"""Assemble main images, search images and SKU images from one local project manifest."""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True

from PIL import Image, ImageDraw

from delivery import cell, stage
from imaging import LANCZOS, jpg, read_rgb
from modules import digest
from project import ASSETS, ROOT, inside, local_path, read_json

OWNER = '.商业图输出.json'
LIST = '主图搜索图SKU交付清单.md'
SHEET = '主图搜索图SKU总览.jpg'


def crop_photo(image, size):
    sw, sh = image.size
    width, height = size
    factor = max(width / sw, height / sh)
    w, h = max(width, round(sw * factor)), max(height, round(sh * factor))
    left, top = (w - width) // 2, (h - height) // 2
    box = (left, top, left + width, top + height)
    source_box = [box[0] * sw / w, box[1] * sh / h, box[2] * sw / w, box[3] * sh / h]
    loss = 1 - width * height / (w * h)
    return image.resize((w,h), LANCZOS).crop(box), source_box, loss


def load_inputs(root, manifest, out, cfg):
    data = read_json(manifest)
    folder = local_path(root, data.get('photos_dir'))
    colors = data.get('colors')
    if not isinstance(colors,list) or not colors or any(
        not isinstance(c,str) or not c.strip() or re.search(r'[<>:"/\\|?*\x00-\x1f]',c)
        or c[-1] in ' .' for c in colors
    ) or len({c.casefold() for c in colors}) != len(colors):
        raise ValueError('colors 须为不重复且可用作文件名的色名')
    old = local_path(root, data['old_dir']) if data.get('old_dir') else None
    if (out == root or inside(root,out) or inside(out,folder) or inside(out,ROOT)
        or (old and inside(out,old)) or not folder.is_dir()):
        raise ValueError('输出与只读来源冲突或 photos_dir 不存在')
    for spec in cfg.values():
        target = (out / spec['folder']).resolve()
        if (target.parent!=out or inside(folder,target) or inside(target,folder)
            or inside(manifest,target) or (old and (inside(old,target) or inside(target,old)))):
            raise ValueError('分类输出与来源重合 '+str(target))
    material = data.get('commercial')
    if not isinstance(material,dict):
        raise ValueError('清单缺少 commercial 对象')
    reviews = material.get('review',{})
    if not isinstance(reviews,dict):
        raise ValueError('commercial.review 须为对象')
    errors, rows = [], []
    for role,spec in cfg.items():
        keys = colors if spec.get('per_color') else [
            str(i) for i in range(1,spec['count']+1)
            if len(colors)>1 or i not in spec.get('skip_single',[])]
        mapping = material.get(role)
        if not isinstance(mapping,dict):
            errors.append('缺少 commercial.'+role)
            continue
        for extra in sorted(set(mapping)-set(keys)):
            errors.append(role+' 意外键 '+extra)
        for key in keys:
            try:
                name = mapping.get(key)
                source = local_path(folder,name)
                if not inside(source,folder) or not source.is_file():
                    raise ValueError('图片缺失或超出 photos_dir')
                with Image.open(source) as image:
                    if image.format=='GIF' or getattr(image,'is_animated',False):
                        raise ValueError('需要单张静态原片')
                    image.verify()
                review = reviews.get(name)
                if review is None:
                    review = dict(note='总览待检查',status='待设计师确认')
                elif (not isinstance(review,dict) or review.get('sha256')!=digest(source)
                      or review.get('status') not in ('通过','待设计师确认')
                      or not isinstance(review.get('note'),str)):
                    raise ValueError('目检摘要、状态或备注无效')
                finished = key in {str(i) for i in spec.get('finished',[])}
                rel = Path(spec['folder'])/(spec['prefix']+'_'+key+'.jpg')
                rows.append((role,key,source,rel,finished,review))
            except (ValueError,TypeError,OSError) as error:
                errors.append(role+'.'+key+' '+str(error))
    if errors:
        raise ValueError('\n'.join(errors))
    return rows


def write_batch(project, manifest, output):
    cfg = read_json(ASSETS/'layout.json')['commercial']
    rows = load_inputs(project,manifest,output,cfg)
    layers = {}
    for role,spec in cfg.items():
        path = ASSETS/'overlays'/spec['template']
        with Image.open(path) as raw:
            if raw.format!='PNG' or raw.mode!='RGBA' or list(raw.size)!=spec['size']:
                raise ValueError(path.name+' 模板画布须为 RGBA PNG '+str(spec['size']))
            layers[role] = raw.copy()
    columns = max(sum(r[0]==role for r in rows) for role in cfg)
    overview = Image.new('RGB',(columns*234,3*294),'#eeeae5')
    draw = ImageDraw.Draw(overview)
    slots = {role:0 for role in cfg}
    lines = ['# 主图、搜索图、SKU 交付清单','',
             'JPG 品质 92，内嵌 sRGB。裁框为原片坐标，右、下端点不含在内。',
             '', '| 文件 | 来源 | 贴标 | 原片 → 成品 | 裁框 | 总览备注 | 状态 |',
             '|---|---|---|---|---|---|---|']
    with stage(output,owner=OWNER,shared=True) as staged:
        for role,key,source,rel,finished,review in rows:
            spec = cfg[role]
            size = tuple(spec['size'])
            image = read_rgb(source)
            original = image.size
            if finished:
                result = image.resize(size,LANCZOS)
                crop, label = '整屏仅缩放，保留全部像素范围','无'
            else:
                result,box,loss = crop_photo(image,size)
                layer = layers[role]
                result.paste(layer,(0,0),layer.getchannel('A'))
                crop = ('[%.2f, %.2f, %.2f, %.2f) · %.2f%%'%(*box,100*loss)
                        if loss>0 else '全幅，0%')
                if loss>.02:
                    crop += '，超过 2%'
                label = spec['template']
            (staged/rel.parent).mkdir(exist_ok=True)
            jpg(result,staged/rel)
            col = slots[role]; slots[role] += 1
            row = list(cfg).index(role)
            thumb=result.copy(); thumb.thumbnail((222,258),LANCZOS)
            overview.paste(thumb,(col*234+(234-thumb.width)//2,row*294+(260-thumb.height)//2))
            draw.text((col*234+8,row*294+266),role.upper()+' '+str(col+1),fill='#232323')
            data = [rel.as_posix(),source.name,label,'%d×%d → %d×%d'%(*original,*size),
                    crop,review['note'],review['status']]
            lines.append('| '+' | '.join(cell(s) for s in data)+' |')
        jpg(overview,staged/SHEET)
        (staged/LIST).write_text('\n'.join(lines)+'\n',encoding='utf-8')
    return slots


def main():
    parser = argparse.ArgumentParser(description='山与场三类商业图离线装配')
    parser.add_argument('project',type=Path)
    parser.add_argument('--manifest',type=Path)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    root=args.project.resolve()
    counts=write_batch(root,(args.manifest or root/'project.json').resolve(),args.output.resolve())
    print('主图 %d 张，搜索图 %d 张，SKU %d 张。JPG 品质 92，sRGB。'%(counts['main'],counts['search'],counts['sku']))
    print('输出 '+str(args.output.resolve()))


if __name__=='__main__':
    try:
        main()
    except (OSError,KeyError,TypeError,ValueError) as exc:
        sys.exit('商业图未发布：'+str(exc))
