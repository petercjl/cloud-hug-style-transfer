"""Read and preflight the dispatcher contract before creating delivery files."""
import json
import re
from pathlib import Path

from PIL import Image, ImageOps

from modules import digest

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'


def read_json(path):
    with path.open(encoding='utf-8-sig') as f:
        return json.load(f)


def inside(path, root):
    return path==root or root in path.parents


def overlap(a,b):
    return inside(a,b) or inside(b,a)


def local_path(parent, raw):
    if not isinstance(raw,str) or not raw.strip():
        raise ValueError('缺少目录或路径')
    if raw.startswith(('\\\\','//')) or '://' in raw:
        raise ValueError('仅支持本地路径')
    return (parent / raw).resolve()


def check(project, output, review_arg=None, manifest_path=None):
    errors=[]
    project=project.resolve()
    if inside(project,output):
        raise ValueError('输出目录与项目输入根相同或包含项目输入根 '+str(project))
    manifest_path=Path(manifest_path).resolve() if manifest_path else project/'project.json'
    if inside(manifest_path,output):
        raise ValueError('项目清单须放在本次发布输出之外')
    data=read_json(manifest_path)
    if not isinstance(data,dict):
        raise ValueError('project.json 须为对象')
    cfg=read_json(ASSETS/'layout.json')
    ov=read_json(ASSETS/'overlays/overlays.json')
    options=data.get('settings',{})
    if not isinstance(options,dict):
        errors.append('settings 须为对象')
        options={}
    for key in options:
        if key not in ('horizontal_count','per_color_count','color_order','frames','showcase_title'):
            errors.append('未知设置 '+key)
    for key in ('horizontal_count','per_color_count','color_order','showcase_title'):
        if key in options:
            cfg[key]=options[key]
    frame_opts=options.get('frames',{})
    if isinstance(frame_opts,dict) and set(frame_opts)<=set(cfg['frames']):
        cfg['frames'].update(frame_opts)
    else:
        errors.append('frames 配置字段错误')
    for key in ('horizontal_count','per_color_count'):
        if type(cfg[key])!=int or cfg[key] not in (2,3):
            errors.append(key+' 须为 2 或 3')
    if type(cfg['showcase_title']) is not bool:
        errors.append('showcase_title 须为 true 或 false')
    fc=cfg['frames']
    if (fc['mode'] != 'first_full' or
        any(type(fc[k])!=int or fc[k]<0 for k in ('left','right','album_edge')) or
        isinstance(fc['left'],int) and isinstance(fc['right'],int) and fc['left']+fc['right']>=1500):
        errors.append('相框模式或边宽无效')
    elif min(fc['left'],fc['right'])<1:
        errors.append('每色后续照片的左右框必须大于零')
    sku=data.get('product_id')
    if not isinstance(sku,str) or not re.fullmatch('[0-9]+',sku):
        errors.append('product_id 须为商品编号数字字符串')
    colors=data.get('colors')
    if (not isinstance(colors,list) or not colors or
        any(not isinstance(c,str) or not c.strip() for c in colors) or len(set(colors))!=len(colors)):
        errors.append('colors 需要按多色屏从左到右给出不重复的色名')
        colors=[]
    order=cfg['color_order']
    if order=='same':
        ordered=list(colors)
    elif order=='reverse':
        ordered=list(reversed(colors))
    elif isinstance(order,list) and all(isinstance(c,str) for c in order) and sorted(order)==sorted(colors):
        ordered=order
    else:
        errors.append('color_order 须为 same、reverse 或全部色名的排列')
        ordered=list(colors)
    dirs={}
    for key in ('photos_dir','old_dir'):
        try:
            folder=local_path(project,data.get(key))
            if not folder.is_dir():
                errors.append(key+' 目录不存在 '+str(folder))
            dirs[key]=folder
        except (ValueError,OSError) as exc:
            errors.append(key+' '+str(exc))
    if set(dirs)=={'photos_dir','old_dir'} and dirs['photos_dir']==dirs['old_dir']:
        errors.append('照片和旧页需能分开识别，请分别给出目录')
    for src in [ROOT]+list(dirs.values()):
        if overlap(output,src) and not (src==project and src!=ROOT and output!=src and inside(output,src)):
            errors.append('输出目录与输入或 skill 重合 '+str(src))
    review={}
    review_path=review_arg or data.get('review_file')
    if review_path:
        try:
            rp=local_path(project, str(review_path))
            if inside(rp,output):
                errors.append('目检输入须放在本次发布输出之外')
            review=read_json(rp)
            if not isinstance(review,dict) or not isinstance(review.get('photos',{}),dict) or not isinstance(review.get('modules',[]),list):
                raise ValueError('目检文件结构无效')
        except (OSError,TypeError,ValueError) as exc:
            errors.append('目检文件 '+str(exc))
            review={}
    sources=data.get('photos',{})
    if not isinstance(sources,dict):
        sources={}
        errors.append('photos 须为对象')
    items=[]
    def photo(key,role,name,color=None,idx=0):
        row=dict(key=key,role=role,color=color,color_index=idx)
        items.append(row)
        if not isinstance(name,str) or not name.strip():
            errors.append(key+' 缺少照片文件')
            return
        if 'photos_dir' not in dirs:
            return
        try:
            folder=dirs['photos_dir']
            path=local_path(folder,name)
            if not inside(path,folder):
                raise ValueError('照片必须位于 photos_dir')
            if inside(path,output):
                raise ValueError('照片不能来自本次输出目录 '+str(path))
            if not path.is_file():
                raise ValueError('文件不存在 '+str(path))
            with Image.open(path) as im:
                if im.format=='GIF' or getattr(im,'is_animated',False):
                    raise ValueError('照片必须为静态文件')
                im.verify()
            with Image.open(path) as im:
                size=ImageOps.exif_transpose(im).size
            ratio=size[0]/size[1]
            if role in ('banner','closing') and abs(ratio-1.5)>.035:
                raise ValueError('横幅应为 3:2，实收 %d×%d'%size)
            if role in ('hero','brand','sport') and ratio>=1:
                raise ValueError('需要竖幅，实收 %d×%d'%size)
            row.update(file=path,size=list(size))
            note=review.get('photos',{}).get(key,{})
            if not isinstance(note,dict):
                raise ValueError('照片目检须为对象')
            if note and note.get('sha256')!=digest(path):
                raise ValueError('目检 SHA256 缺失或已换底片')
            for rect in note.get('protected',[]):
                a,b,c,d=rect
                if not (0<=a<c<=1 and 0<=b<d<=1):
                    raise ValueError('主体保护区应为归一化坐标')
            if not isinstance(note.get('reject',{}),dict) or not isinstance(note.get('issues',[]),list):
                raise ValueError('目检 reject 或 issues 格式不正确')
            if note.get('frame') not in (None,'full','framed'):
                raise ValueError('逐张边框只能为 full 或 framed')
            if not isinstance(note.get('observation',''),str):
                raise ValueError('总览备注 observation 须为文字')
            if role=='hero' and 'reserve' in note:
                reserve=note['reserve']
                if (not isinstance(reserve,dict) or type(reserve.get('clean_sky')) is not bool
                    or any(type(reserve.get(k)) not in (int,float) or not 0<=reserve[k]<=size[1]
                           for k in ('top','bottom'))):
                    raise ValueError('首屏 reserve 须提供原像素 top、bottom 以及布尔值 clean_sky')
            if role=='multicolor' and 'cut_windows' in note:
                windows=note['cut_windows']
                if (not isinstance(windows,list) or any(not isinstance(v,list) or len(v)!=2
                    or any(type(y) is not int for y in v) or not 0<=v[0]<v[1]<=size[1] for v in windows)):
                    raise ValueError('多色整屏 cut_windows 须为原图全宽空带的半开行区间')
            row['review']=note
        except (ValueError,TypeError,OSError) as exc:
            errors.append(key+' '+str(exc))
    photo('hero','hero',sources.get('hero'))
    if len(colors)>1:
        photo('multicolor','multicolor',sources.get('multicolor'))
    photo('sport','sport',sources.get('sport'))
    banners=sources.get('banners',[])
    if not isinstance(banners,list):banners=[]
    if len(banners)!=cfg['horizontal_count']:
        errors.append('banners 数量应为 '+str(cfg['horizontal_count']))
    for i,f in enumerate(banners,1):
        photo('banner.%d'%i,'banner',f)
    brand=sources.get('brand',{})
    if not isinstance(brand,dict):brand={}
    if set(brand)-set(colors):
        errors.append('brand 有未登记的色名 '+str(sorted(set(brand)-set(colors))))
    for color in ordered:
        group=brand.get(color,[])
        if not isinstance(group,list):group=[]
        if len(group)!=cfg['per_color_count']:
            errors.append('每色品牌摄影 '+color+' 应有 '+str(cfg['per_color_count'])+' 张')
        for i,f in enumerate(group,1):
            photo('brand.%s.%d'%(color,i),'brand',f,color,i-1)
    photo('closing','closing',sources.get('closing'))
    keys={item['key'] for item in items}
    if set(review.get('photos',{}))-keys:
        errors.append('目检含未交付的照片键 '+str(sorted(set(review['photos'])-keys)))
    return dict(id=sku,cfg=cfg,overlays=ov,dirs=dirs,colors=colors,ordered=ordered,
                review=review,items=items,errors=errors,order_explicit='color_order' in options)
