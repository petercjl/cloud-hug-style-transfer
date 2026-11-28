"""Publish only files created by this skill and preserve every other file."""
import json
import os
import tempfile
from contextlib import contextmanager
from pathlib import Path

from modules import digest

OWNER='.版式输出.json'


def as_json(path, value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')


def target(folder, rel):
    path=folder/rel
    if Path(rel).is_absolute() or '..' in Path(rel).parts or path.resolve()!=path:
        raise ValueError('拒绝越界或链接输出 '+str(path))
    return path


@contextmanager
def stage(output, owner=OWNER, shared=False):
    output.mkdir(parents=True,exist_ok=True)
    lock=output/('.商业图运行.lock' if shared else '.版式运行.lock')
    if lock.is_symlink():
        raise ValueError('输出锁为链接')
    try:
        handle=lock.open('x',encoding='ascii')
    except FileExistsError:
        raise ValueError('同一输出有运行锁，先核对上一进程是否仍在写入')
    try:
        with handle:
            handle.write(str(os.getpid()))
        marker=target(output,owner)
        if marker.exists():
            record=json.loads(marker.read_text(encoding='utf-8'))
            if record.get('writer')!='shanyuchang-banshi/1':
                raise ValueError('无法确认输出归属 '+str(marker))
            old=record['files']
        else:
            old={}
            if not shared and any(p!=lock for p in output.iterdir()):
                raise ValueError('输出目录已有其他文件，请使用空目录或本 skill 的输出目录')
        for rel,checksum in old.items():
            dst=target(output,rel)
            if dst.exists() and (not dst.is_file() or digest(dst)!=checksum):
                raise ValueError('已有成品被外部修改，已保护 '+rel)
        slices=target(output,'切片')
        if not shared and slices.is_dir() and any(p.relative_to(output).as_posix() not in old for p in slices.iterdir()):
            raise ValueError('切片目录含未登记文件，请保留该目录并另选输出目录')
        with tempfile.TemporaryDirectory(prefix='.版式暂存-',dir=str(output)) as temp:
            work=Path(temp)
            if work.resolve().parent!=output:
                raise ValueError('暂存目录越界')
            new,backup=work/'new',work/'previous'
            new.mkdir()
            backup.mkdir()
            yield new
            current={p.relative_to(new).as_posix():digest(p) for p in new.rglob('*') if p.is_file()}
            for rel in current:
                if target(output,rel).exists() and rel not in old:
                    raise ValueError('同名文件不属于本 skill '+rel)
            as_json(new/owner,dict(writer='shanyuchang-banshi/1',files=current))
            moved,installed=[],[]
            try:
                for rel in list(old)+[owner]:
                    dst=target(output,rel)
                    if dst.exists():
                        saved=backup/rel
                        saved.parent.mkdir(parents=True,exist_ok=True)
                        dst.replace(saved)
                        moved.append(rel)
                for rel in list(current)+[owner]:
                    dst=target(output,rel)
                    dst.parent.mkdir(parents=True,exist_ok=True)
                    (new/rel).replace(dst)
                    installed.append(rel)
            except BaseException:
                for rel in reversed(installed):
                    target(output,rel).unlink()
                for rel in reversed(moved):
                    (backup/rel).replace(target(output,rel))
                raise
    finally:
        lock.unlink()


def cell(value):
    return str(value).replace('|','\\|').replace('\n',' ')


def manifest(folder, plan, rows, slices, preview):
    cfg=plan['cfg']
    names={'same':'多色屏同序','reverse':'多色屏反序'}
    order=cfg['color_order']
    order_text=names.get(order,'自定义') if isinstance(order,str) else '自定义'
    if plan.get('order_explicit'):
        order_text='手动指定的'+order_text
    blocked=[r for r in rows if not r['slices'] and not r.get('skip')]
    pending=[r for r in rows if r['issues']]
    for color in plan['ordered']:
        group=[r for r in rows if r.get('color')==color]
        if len(group)!=cfg['per_color_count']:
            raise ValueError(color+' 的摄影张数与输入不一致')
        for index,row in enumerate(group):
            left,right,top,bottom=row['frame']
            if (index==0 and any(row['frame'])) or (index>0 and min(left,right)<=0):
                raise ValueError(row['name']+' 的分色相框未通过验收')
    lines=['# '+plan['id']+' 详情页交付清单','',
           '页面宽 1500 px，JPG 品质 92，内嵌 sRGB。整页预览宽 750 px。',
           '横屏 %s 张，每色 %s 张。色序采用%s（%s）。'%(cfg['horizontal_count'],cfg['per_color_count'],order_text,' → '.join(plan['ordered'])),
           '共 %d 张切片，%d 屏待确认，%d 屏缺少可交付切片。'%(len(slices),len(pending),len(blocked)),
           '预览文件为 '+preview+'。'+('存在未切模块，当前切片不能构成完整上架页。' if blocked else '切片已覆盖整页。'),
           '', '| 序号 | 槽位 | 来源文件 | 处理与选片依据 | 状态 |','|---|---|---|---|---|']
    for idx,r in enumerate(rows,1):
        status='<span style="color:#bd1622">🔴 待确认 · '+cell('；'.join(r['issues']))+'</span>' if r['issues'] else '通过'
        lines.append('| %02d | %s | %s | %s | %s |'%(idx,cell(r['name']),cell('、'.join(r['sources']) or '—'),cell(r['action']),status))
    (folder/'交付清单.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
