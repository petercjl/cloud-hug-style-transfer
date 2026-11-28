"""Current-product old modules. Identification is by pixels; names only locate reviewed inputs."""
import base64
import hashlib
import json
import os
import re
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

KINDS = ('selling', 'material', 'certificate', 'detail', 'size')
NAMES = dict(zip(KINDS, ('卖点', '材质', '证书', '细节展示', '尺码参考')))
# The order describes semantic proximity when an exact module is absent.
RELATED = {
    'selling': ('water', 'layering', 'temperature'),
    'material': ('layering', 'water'),
    'certificate': ('test_evidence',),
    'detail': (),
    'size': ('fit_guide', 'measurements'),
}


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1048576), b''):
            h.update(chunk)
    return h.hexdigest()


def image_paths(folder, excluded):
    exclusions = {p.resolve() for p in excluded}
    for directory, children, names in os.walk(folder, followlinks=False):
        current = Path(directory)
        children[:] = sorted(n for n in children if (current/n).resolve() not in exclusions
                             and not (current/n).is_symlink() and (current/n).resolve()==current/n)
        for name in sorted(names):
            path = current/name
            if path.is_file() and not path.is_symlink() and path.resolve()==path:
                yield path


def identify(folder, index_path, excluded=()):
    index = json.loads(index_path.read_text(encoding='utf-8'))
    signatures = index['signatures']
    thumbs = {k: np.frombuffer(zlib.decompress(base64.b64decode(v['fp'])), dtype=np.uint8)
              .astype(np.float32) for k, v in signatures.items()}
    matches, audit = {}, {}
    for path in image_paths(folder, excluded):
        name = path.relative_to(folder).as_posix()
        try:
            with Image.open(path) as im:
                if im.format == 'GIF' or getattr(im, 'is_animated', False):
                    audit[name] = '禁用 GIF 或动图'
                    continue
                key = digest(path)
                if key not in signatures:
                    thumb = np.asarray(im.convert('RGB').resize((16, 24), Image.Resampling.BOX),
                                       dtype=np.float32).ravel()
                    nearby = []
                    for k, spec in signatures.items():
                        w, h = spec['size']
                        if abs((im.width / im.height) / (w / h) - 1) <= .012:
                            nearby.append((float(np.abs(thumb - thumbs[k]).mean()), k))
                    nearby.sort()
                    if nearby and nearby[0][0] <= 3 and (len(nearby) == 1 or nearby[1][0] - nearby[0][0] > 1):
                        key = nearby[0][1]
                if key not in signatures:
                    audit[name] = '未收录，请由版式 skill 看原图登记'
                elif not signatures[key]['allow']:
                    audit[name] = '禁用旧实拍、旧多色或淘汰模块'
                else:
                    audit[name] = '内容指纹匹配'
                    matches.setdefault(key, path)
        except UnidentifiedImageError:
            continue
        except (OSError, ValueError) as exc:
            audit[name] = '旧图不可读：' + str(exc)
    recipes = []
    for recipe in index['recipes']:
        if all(p['key'] in matches for p in recipe['parts']):
            parts = []
            for p in recipe['parts']:
                source = matches[p['key']]
                with Image.open(source) as im:
                    ratio = im.height / signatures[p['key']]['size'][1]
                windows = [[round(y * ratio) for y in pair] for pair in p['windows']]
                parts.append(dict(file=source, windows=windows))
            recipes.append(dict(recipe, parts=parts))
    return recipes, audit


def add_reviewed(recipes, audit, folder, extra, errors):
    for idx, row in enumerate(extra):
        try:
            if row['kind'] not in set(KINDS) | {'layering','temperature','water','other','test_evidence','fit_guide','measurements','showcase_title'}:
                raise ValueError('未知类型')
            if row.get('safe') is not True or not str(row['evidence']).strip():
                raise ValueError('需要本款内容、画质和模块边界的目检依据')
            parts = []
            for item in row['parts']:
                name = item['file']
                if name not in audit or audit[name].startswith('禁用'):
                    raise ValueError('来源缺失或禁用 ' + name)
                path = folder / name
                with Image.open(path) as im:
                    top, bottom = item.get('rows', [0, im.height])
                    if not 0 <= top < bottom <= im.height:
                        raise ValueError('内容区间越界')
                    windows = item.get('windows', [])
                    if any(not top <= a < b <= bottom for a,b in windows):
                        raise ValueError('空带范围越界')
                parts.append(dict(file=path, rows=[top,bottom], windows=windows))
            if not parts:
                raise ValueError('空模块')
            targets=row.get('slots', list(KINDS)+['showcase_title'])
            if not isinstance(targets,list) or not targets or any(t not in set(KINDS)|{'showcase_title'} for t in targets):
                raise ValueError('适用槽位无效')
            order=row.get('order')
            if order is not None and (type(order) is not int or order<0):
                raise ValueError('原页顺序 order 须为非负整数')
            recipes.insert(idx, dict(id='review-%d' % idx, kind=row['kind'], slots=targets, order=order,
                                     evidence=row['evidence'], parts=parts))
        except (KeyError, TypeError, ValueError, OSError) as exc:
            errors.append('目检模块 %d：%s' % (idx + 1, exc))


def detail_collection(recipes):
    """Keep every independent detail in source order; subtract already covered rows."""
    if len(recipes)<2:
        return dict(recipes[0],slots=['detail']) if recipes else None
    def sequence(rec):
        part=rec['parts'][0]
        if rec.get('order') is not None:
            return (0,rec['order'])
        name=part['file'].as_posix().casefold()
        natural=tuple((0,int(x)) if x.isdigit() else (1,x) for x in re.split(r'(\d+)',name))
        return (1,natural,part.get('rows',(0,))[0])
    seen={}
    parts,ends,ids,evidence=[],[],[],[]
    for rec in sorted(recipes,key=sequence):
        start=len(parts)
        for src in rec['parts']:
            path=src['file']
            if 'rows' in src:
                lo,hi=src['rows']
            else:
                with Image.open(path) as image:
                    lo,hi=0,image.height
            remaining=[(lo,hi)]
            for left,right in seen.get(path,[]):
                remaining=[(x,y) for a,b in remaining for x,y in
                           ((a,min(b,left)),(max(a,right),b)) if x<y]
            for a,b in remaining:
                windows=[[max(a,x),min(b,y)] for x,y in src.get('windows',[]) if a<y and x<b]
                parts.append(dict(file=path,rows=[a,b],windows=windows))
                seen.setdefault(path,[]).append((a,b))
        if len(parts)>start:
            ends.append(len(parts))
            ids.append(rec['id'])
            evidence.append(rec['evidence'])
    return dict(id='+'.join(ids),kind='detail',parts=parts,detail_ends=ends[:-1],
                evidence='按原页顺序收录全部细节。'+' '.join(evidence))


def select(recipes):
    # Reserve exact slots before allocating alternatives. Overlapping source pixels
    # cannot be spent twice, even if two alternative recipes share a source file.
    title_options = [r for r in recipes if r['kind']=='showcase_title']
    details=detail_collection([r for r in recipes if r['kind']=='detail'])
    recipes=[r for r in recipes if r['kind'] not in ('detail','showcase_title')]
    if details:
        reserved=[(p['file'],*p.get('rows',(0,float('inf')))) for p in details['parts']]
        def used_by_detail(recipe):
            for part in recipe['parts']:
                lo,hi=part.get('rows',(0,float('inf')))
                if any(part['file']==f and lo<b and a<hi for f,a,b in reserved):
                    return True
            return False
        recipes=[r for r in recipes if not used_by_detail(r)]+[details]
    options = {}
    for slot in KINDS:
        options[slot] = sorted((r for r in recipes if slot in r.get('slots', KINDS)
                                and (r['kind']==slot or r['kind'] in RELATED[slot]
                                     or (r['kind']=='other' and slot!='detail' and r.get('slots')==[slot]))),
                               key=lambda r: rank(slot, r))
    best, best_plan = None, {}

    def visit(i, used, plan, missing, substitutes, distance):
        nonlocal best, best_plan
        score = (missing + substitutes, missing, distance)
        if best is not None and score >= best:
            return
        if i == len(KINDS):
            best, best_plan = score, plan.copy()
            return
        slot = KINDS[i]
        for rec in options[slot]:
            spans = [(p['file'], *p.get('rows', (0, float('inf')))) for p in rec['parts']]
            if any(f == g and a < d and c < b for f,a,b in spans for g,c,d in used):
                continue
            plan[slot] = rec
            visit(i + 1, used + spans, plan, missing, substitutes + (slot != rec['kind']),
                  distance + rank(slot, rec))
        plan[slot] = None
        visit(i + 1, used, plan, missing + 1, substitutes, distance)

    visit(0, [], {}, 0, 0, 0)
    occupied = [(p['file'], *p.get('rows',(0,float('inf')))) for rec in best_plan.values()
                if rec for p in rec['parts']]
    def available(rec):
        for part in rec['parts']:
            lo,hi=part.get('rows',(0,float('inf')))
            if any(f==part['file'] and lo<b and a<hi for f,a,b in occupied):
                return False
        return True
    best_plan['showcase_title']=next((r for r in title_options if available(r)),None)
    return best_plan


def rank(slot, recipe):
    kind = recipe['kind']
    if kind == slot:
        return 0
    return 1 + (RELATED[slot].index(kind) if kind in RELATED[slot] else len(RELATED[slot]))
