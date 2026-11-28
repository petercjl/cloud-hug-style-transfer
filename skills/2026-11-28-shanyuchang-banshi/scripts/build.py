"""Build a local Shanyuchang product detail page: python -B build.py PROJECT --output OUTPUT."""
import argparse
import json
import sys
from pathlib import Path

sys.dont_write_bytecode=True

from PIL import Image
from delivery import as_json, manifest, stage
from imaging import (ICC, LIMIT, LANCZOS, POSITIONS, W, at_width, frame_photo, jpg,
                     old_panel, overlay_parts, place, plan_cuts, read_rgb)
from modules import add_reviewed, identify, select
from project import ASSETS, check

def photograph(item, plan, prepared, record, number):
    role=item['role']
    rev=item.get('review',{})
    raw=read_rgb(item['file'])
    page,view=frame_photo(raw,role,item['color_index'],plan['cfg']['per_color_count'],plan['cfg']['frames'])
    notes=list(rev.get('issues',[]))
    if role=='brand':
        notes=[note for note in notes if not note.startswith('标识位置待设计师确认')]
    row=dict(key=item['key'],sources=[item['file'].name],issues=notes,viewport=view,
             source_size=list(raw.size),action='',reviewed=bool(rev.get('checked')))
    if role=='multicolor':
        row['action']='调度整屏，按宽度保留原比例，保留原有字与格序'
        if rev.get('checked') is True and rev.get('cut_windows'):
            scale=W/raw.width
            row['grid_windows']=[[round(a*scale),round(b*scale)] for a,b in rev['cut_windows']]
        return page,row,[]
    spec=plan['overlays'][role]
    chosen,options,preview=place(page,view,prepared[role],spec,rev,plan['cfg']['quality'])
    preview_path=record/'定位'/('%02d.jpg'%number)
    jpg(preview,preview_path)
    row.update(position=chosen['position'],boxes=chosen['boxes'],candidates=options,
               red_preview='项目记录/定位/'+preview_path.name)
    treatment=spec['file']+'，'+POSITIONS[chosen['position']]
    if rev.get('reject') and chosen['position']!='original' and 'original' in rev['reject']:
        treatment+='。原位目检：'+rev['reject']['original']
    if role=='brand':
        left,top,right,bottom=view
        row.update(color=item['color'],color_index=item['color_index'],frame=[left,W-right,top,page.height-bottom])
        treatment+='，照片白边 左/右/上/下 %d/%d/%d/%d px'%(left,W-right,top,page.height-bottom)
    if role=='hero':
        reserve=rev.get('reserve')
        if reserve:
            scale=W/raw.width
            top,bottom=reserve['top']*scale,reserve['bottom']*scale
            treatment+='。宽 %d 尺度顶部净空 %.1f px，关键部位最小离底 %.1f px'%(W,top,bottom)
            limits=plan['cfg']['hero_clearance']
            if top<limits['top'] or not reserve['clean_sky']:
                notes.append('首屏顶部净空或背景未达标')
            if bottom<limits['bottom']:
                notes.append('首屏底部关键部位留位不足')
            if reserve['clean_sky']:
                row['sky_boundary']=round(top)
        else:
            notes.append('首屏缺少绑定底片的净空实测')
    if chosen['issues']:
        notes.append('标识位置待设计师确认（'+ '、'.join(chosen['issues'])+'）')
    row['reviewed']=spec.get('placement')=='fixed_top' or (rev.get('checked') is True and rev.get('checked_boxes')==chosen['boxes'])
    row['visual_review']={k:v for k,v in rev.items() if k not in ('issues','checked_boxes')}
    if not row['reviewed']:
        notes.append('标识位置待设计师确认（红框尚未目检）')
    row['action']=treatment
    protected=[[a[1],a[3]] for a in chosen['boxes']]
    protected.extend([[view[1]+round(y*(view[3]-view[1])),view[1]+round(b*(view[3]-view[1]))]
                      for _,y,_,b in rev.get('protected',[])])
    return page,row,protected


def assemble(plan, selected, audit, prepared, output):
    record=output/'项目记录'
    (record/'定位').mkdir(parents=True)
    (output/'切片').mkdir()
    rows,all_slices,thumbs=[],[],[]
    offset=0
    for slot,definition in enumerate(plan['cfg']['slots'],1):
        role,label=definition['role'],definition['name']
        is_old=definition['source'] in ('old','optional_old')
        if role=='showcase_title' and (not plan['cfg']['showcase_title'] or not selected[role]):
            why='旧页未找到' if plan['cfg']['showcase_title'] else '开关关闭'
            rows.append(dict(slot=slot,name=label,key=role,sources=[],action=why+'，跳过',issues=[],
                             skip=True,fallback=False,slices=[],range=[offset,offset]))
            continue
        source_items=[p for p in plan['items'] if p['role']==role]
        if role=='multicolor' and not source_items:
            rows.append(dict(slot=slot,name=label,key=role,sources=[],action='单色款跳过',
                             issues=[],skip=True,slices=[],range=[offset,offset]))
            continue
        for idx,item in enumerate(([None] if is_old else source_items),1):
            page=None
            seams,windows,protected,boundaries=[],[],[],[]
            row=dict(key=role,sources=[],issues=[],action='')
            name=label
            if is_old:
                recipe=selected[role]
                if recipe:
                    page,seams,windows=old_panel(recipe)
                    boundaries=[seams[n-1] for n in recipe.get("detail_ends",[])]
                    replacement=recipe['kind']!=role
                    row.update(sources=[p['file'].name for p in recipe['parts']],fallback=replacement,
                               module_id=recipe['id'],kind=recipe['kind'],
                               source_rows=[p.get('rows') for p in recipe['parts']],
                               action=('补位。' if replacement else '旧页原模块。')+recipe['evidence'])
                    crops=['%s [%d,%d)'%(p['file'].name,*p['rows']) for p in recipe['parts'] if 'rows' in p]
                    if crops:
                        row['action']+='。原像素纵向区间 '+ '、'.join(crops)
                    if replacement:
                        if role=='material' and recipe['kind']=='layering':
                            row['action']+=' 用旧页明确给出的穿着分层补充材质槽，填充物名称仍缺。'
                        elif role=='selling' and recipe['kind'] in ('layering','temperature'):
                            row['action']+=' 分层的防水、保暖或对应天气是本款已有的穿着卖点。'
                        else:
                            row['action']+=' 已核实为本槽同性质、未被其他槽使用的模块。'
                        row['issues'].append('补位，原页缺少可用的'+label+'专屏')
                else:
                    row.update(action='旧页无此类模块，已去掉',skip=True,fallback=False)
            else:
                if role=='brand':
                    name+=' · '+item['color']+' '+str(item['color_index']+1)
                if role=='banner':
                    name+=' '+str(idx)
                page,row,protected=photograph(item,plan,prepared,record,len(rows)+1)
                review=item.get('review',{})
                if review.get('observation'):
                    row['action']+='。总览：'+review['observation']
                if row.get('sky_boundary'):
                    seams=[row['sky_boundary']]
                if row.get('grid_windows'):
                    windows=row['grid_windows']
                    seams=[(a+b_)//2 for a,b_ in windows]
            row.update(slot=slot,name=name,slices=[])
            if page is not None:
                if is_old and recipe['kind'] in ('certificate','size') and page.height>LIMIT and not windows:
                    # No approved corridor: don't interpret whitespace inside an unseen table as a gutter.
                    cuts=None
                elif role=='multicolor' and page.height>LIMIT and not windows:
                    cuts=None
                elif not is_old and page.height>LIMIT and not row.get('reviewed'):
                    cuts=None
                else:
                    cuts=plan_cuts(page,seams,windows,protected,boundaries)
                row.update(height=page.height,range=[offset,offset+page.height],cuts=cuts,
                           cut_windows=windows,seams=seams)
                if cuts:
                    for low,high in zip(cuts,cuts[1:]):
                        file='%s详情页_%02d.jpg'%(plan['id'],len(all_slices)+1)
                        tile=page.crop((0,low,W,high))
                        jpg(tile,output/'切片'/file)
                        all_slices.append(dict(file=file,key=row['key'],range=[offset+low,offset+high],
                                               local=[low,high],size=list(tile.size)))
                        row['slices'].append(file)
                else:
                    reason='理想位置 ±300 px 内找不到可用整行空白带'
                    if is_old and recipe['kind'] in ('certificate','size') and not windows:
                        reason='缺少已目检的可切空带，无法保证内部表格或图文完整'
                    elif role=='multicolor' and not windows:
                        reason='多行整屏缺少目检过的格间安全空带'
                    elif not is_old and not row.get('reviewed'):
                        reason='超高摄影的头部与标识保护区尚未完成目检'
                    row['issues'].append('切片错误，'+reason)
                    row['action']+='。该屏保留在整页预览，切片目录跳过此屏'
                h=round((offset+page.height)/2)-round(offset/2)
                thumbs.append(page.resize((750,max(1,h)),LANCZOS))
                offset+=page.height
            else:
                row['range']=[offset,offset]
            rows.append(row)
    long=Image.new('RGB',(750,sum(im.height for im in thumbs)))
    cursor=0
    for im in thumbs:
        long.paste(im,(0,cursor))
        cursor+=im.height
    preview='整页预览.jpg' if long.height<=65500 else '整页预览.png'
    if preview.endswith('.jpg'):
        jpg(long,output/preview)
    else:
        long.save(output/preview,icc_profile=ICC)
    metadata=dict(product_id=plan['id'],page=[W,offset],preview=preview,settings=plan['cfg'],
                  input_colors=plan['colors'],output_colors=plan['ordered'],old_index=audit,
                  rows=rows,slices=all_slices)
    as_json(record/'排版数据.json',metadata)
    manifest(output,plan,rows,all_slices,preview)
    return metadata


def main():
    parser=argparse.ArgumentParser(description='离线拼接山与场商品详情页')
    parser.add_argument('project',type=Path)
    parser.add_argument('--output',type=Path)
    parser.add_argument('--manifest',type=Path,help='只读项目可从工作目录交 project.json，数据路径仍以项目根为基准')
    parser.add_argument('--review',type=Path,help='可选的本次离线目检记录')
    args=parser.parse_args()
    project=args.project.resolve()
    out=(args.output or project.with_name(project.name+'_版式输出')).resolve()
    plan=check(project,out,args.review,args.manifest)
    errors=plan['errors']
    prepared={}
    for role,spec in plan['overlays'].items():
        try:
            prepared[role]=overlay_parts(ASSETS/'overlays',spec)
        except (OSError,KeyError,ValueError) as exc:
            errors.append('贴图 '+str(exc))
    old=plan['dirs'].get('old_dir')
    recipes,audit=[],{}
    if old and old.is_dir():
        omit=[out]+[p for key,p in plan['dirs'].items() if key!='old_dir' and old in p.parents]
        recipes,audit=identify(old,ASSETS/'module-index.json',omit)
        errors.extend(name+' '+value for name,value in audit.items() if value.startswith('旧图不可读'))
        add_reviewed(recipes,audit,old,plan['review'].get('modules',[]),errors)
    if errors:
        print('输入检查未通过')
        print('\n'.join('  - '+s for s in errors))
        return 2
    with stage(out) as staged:
        data=assemble(plan,select(recipes),audit,prepared,staged)
    rows=data['rows']
    pending=sum(bool(r['issues']) for r in rows)
    missing=sum(not r['slices'] and not r.get('skip',False) for r in rows)
    print('商品 %s | 整页 %d×%d | 切片 %d 张'%(plan['id'],*data['page'],len(data['slices'])))
    print('切片上限 %d px | 红框预览 %d 张 | 待确认 %d 屏 | 未出切片 %d 屏'%(
        LIMIT,sum('red_preview' in r for r in rows),pending,missing))
    print('输出 '+str(out))
    return 3 if missing else 0

if __name__=='__main__':
    try:
        sys.exit(main())
    except (OSError,ValueError,KeyError) as error:
        print('版式未发布：'+str(error),file=sys.stderr)
        sys.exit(2)
