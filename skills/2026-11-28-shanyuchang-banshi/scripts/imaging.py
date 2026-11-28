"""Width-preserving colour conversion, alpha anchoring, objective checks and safe cuts."""
import io
import math

import numpy as np
from PIL import Image, ImageCms, ImageDraw, ImageOps

W = 1500
LIMIT = 2500
SEARCH = 300
LANCZOS = Image.Resampling.LANCZOS
PROFILE = ImageCms.ImageCmsProfile(ImageCms.createProfile('sRGB'))
ICC = PROFILE.tobytes()
POSITIONS = {'original':'原位','swap_x':'换左右','swap_y':'换上下','swap_xy':'换对角'}


def read_rgb(path):
    with Image.open(path) as raw:
        im = ImageOps.exif_transpose(raw)
        profile = im.info.get('icc_profile')
        if im.mode in ('RGBA','LA','P') and ('A' in im.mode or 'transparency' in im.info):
            layer = im.convert('RGBA')
            im = Image.new('RGB', layer.size, 'white')
            im.paste(layer, mask=layer.getchannel('A'))
        if profile:
            source = ImageCms.ImageCmsProfile(io.BytesIO(profile))
            return ImageCms.profileToProfile(im, source, PROFILE, outputMode='RGB')
        return im.convert('RGB')


def at_width(im, width=W):
    height = max(1, round(im.height * width / im.width))
    return im.resize((width, height), LANCZOS) if im.size != (width,height) else im.copy()


def jpg(im, path):
    im.save(path, 'JPEG', quality=92, subsampling=0, icc_profile=ICC)


def overlay_parts(folder, spec):
    with Image.open(folder / spec['file']) as source:
        if source.format != 'PNG' or 'A' not in source.getbands():
            raise ValueError(spec['file']+' 须为带 alpha 的真实 PNG')
        rgba = source.convert('RGBA')
    if rgba.width != W:
        raise ValueError('%s 宽 %d px，贴图必须为 %d px' % (spec['file'], rgba.width, W))
    if list(rgba.size) != spec['canvas'] or list(rgba.getchannel('A').getbbox()) != spec['box']:
        raise ValueError(spec['file'] + ' 的画布或 alpha 与 overlays.json 不一致')
    parts = []
    for part in spec['parts']:
        x,y,r,b = part['box']
        mx,my = part['margin']
        if (mx,my) != (x if part['h']=='left' else rgba.width-r,
                       y if part['v']=='top' else rgba.height-b):
            raise ValueError(spec['file'] + ' 的边距与锚点不一致')
        patch = rgba.crop((x,y,r,b))
        if patch.getchannel('A').getbbox() != (0,0,patch.width,patch.height):
            raise ValueError(spec['file'] + ' 的分组未贴合 alpha')
        mx,my = part.get('placement_margin', (mx,my))
        parts.append((part, patch, mx, my))
    return parts


def frame_photo(raw, role, color_index, group_count, cfg):
    # The first photo owns no frame. Framed neighbours own the full gutter
    # next to an unframed image; interior framed pairs each own half.
    framed = role == 'brand' and color_index > 0
    left = cfg['left'] if framed else 0
    right = cfg['right'] if framed else 0
    edge = cfg['album_edge']
    top = edge * (2 if color_index == 1 else 1) if framed else 0
    bottom = edge * (2 if color_index == group_count-1 else 1) if framed else 0
    photo = at_width(raw)
    if left or right:
        photo = at_width(photo, W-left-right)
    if not (left or right or top or bottom):
        return photo, [0,0,W,photo.height]
    page = Image.new('RGB',(W,top+photo.height+bottom),'white')
    page.paste(photo,(left,top))
    return page, [left,top,W-right,top+photo.height]


def row_groups(alpha):
    xs = np.flatnonzero(alpha.max(0) > 0)
    groups = np.split(xs, np.flatnonzero(np.diff(xs) > 65) + 1)
    for g in groups:
        x,r = int(g[0]),int(g[-1])+1
        ys = np.flatnonzero(alpha[:,x:r].max(1) > 0)
        yield x,int(ys[0]),r,int(ys[-1])+1


def candidate(page, viewport, parts, pos, review, limits, fixed=False):
    l,t,r,b = viewport
    protected = [[l+round(a*(r-l)),t+round(c*(b-t)),l+round(d*(r-l)),t+round(e*(b-t))]
                 for a,c,d,e in review.get('protected',[])]
    boxes, blocks, stamps = [], [], []
    swap_x = pos in ('swap_x','swap_xy')
    swap_y = pos in ('swap_y','swap_xy')
    for part, patch, mx, my in parts:
        left = (part['h']=='left') != swap_x
        top = (part['v']=='top') != swap_y
        x = mx if left else W-mx-patch.width
        y = t+my if top else b-my-patch.height
        if x < 0 or y < t or x+patch.width > W or y+patch.height > b:
            return None
        alpha = np.asarray(patch.getchannel('A'))
        stamps.append((patch,(x,y)))
        boxes.append([x,y,x+patch.width,y+patch.height])
        for ax,ay,ar,ab in row_groups(alpha):
            box = [x+ax,y+ay,x+ar,y+ab]
            if fixed:
                blocks.append(dict(box=box))
                continue
            rgb = np.asarray(page.crop(box),dtype=np.float32)/255
            luma = rgb @ np.array([.2126,.7152,.0722],dtype=np.float32)
            lin = np.where(rgb<=.04045,rgb/12.92,((rgb+.055)/1.055)**2.4)
            linear = lin @ np.array([.2126,.7152,.0722],dtype=np.float32)
            glyph = alpha[ay:ab,ax:ar] >= 96
            contrast = float(np.percentile(1.05/(linear[glyph]+.05),25))
            horizontal = np.abs(np.diff(luma,axis=1,prepend=luma[:,:1]))
            vertical = np.abs(np.diff(luma,axis=0,prepend=luma[:1,:]))
            edges = float((np.maximum(horizontal,vertical)>.075).mean())
            hits = np.zeros(glyph.shape,dtype=bool)
            for sx,sy,sr,sb in protected:
                x0,y0,x1,y1=max(sx,box[0]),max(sy,box[1]),min(sr,box[2]),min(sb,box[3])
                if x1>x0 and y1>y0:
                    hits[y0-box[1]:y1-box[1],x0-box[0]:x1-box[0]]=True
            overlap = float((hits & glyph).sum()/max(1,glyph.sum()))
            blocks.append(dict(box=box,mean_luma=round(float(luma.mean()*255),2),
                               contrast=round(contrast,3),edge_density=round(edges,4),
                               protected_overlap=round(overlap,5)))
    if fixed:
        return dict(position=pos, boxes=boxes, blocks=blocks, issues=[], penalty=0), stamps
    violations = []
    penalty = 0
    for m in blocks:
        for key,target,reverse,label in [('mean_luma','mean_luma_max',False,'亮度过高'),
                                        ('contrast','contrast_min',True,'白字对比不足'),
                                        ('edge_density','edge_density_max',False,'背景边缘密')]:
            ratio = (limits[target]-m[key] if reverse else m[key]-limits[target])/limits[target]
            if ratio>0:
                violations.append(label)
                penalty+=ratio
        if m['protected_overlap']>0:
            violations.append('压到主体保护区')
            penalty+=3 + 12*m['protected_overlap']
    if pos in review.get('reject',{}):
        violations.append(review['reject'][pos])
        penalty+=20
    return (dict(position=pos,boxes=boxes,blocks=blocks,issues=list(dict.fromkeys(violations)),
                 penalty=round(penalty,4)),stamps)


def place(page, viewport, parts, spec, review, limits):
    options=[]
    fixed=spec.get('placement')=='fixed_top'
    for pos in (['original'] if fixed else spec['candidates']):
        option=candidate(page,viewport,parts,pos,review,limits,fixed)
        if option is not None:
            options.append(option)
    if not options:
        raise ValueError('照片尺寸容不下完整标识')
    chosen,stamps=next((opt for opt in options if not opt[0]['issues']),
                        min(options,key=lambda item:item[0]['penalty']))
    for patch,origin in stamps:
        page.paste(patch,origin,patch.getchannel('A'))
    preview=page.copy()
    draw=ImageDraw.Draw(preview)
    for block in chosen['blocks']:
        x,y,r,b=block['box']
        draw.rectangle((x,y,r-1,b-1),outline=(235,18,29),width=4)
    return chosen, [v for v,_ in options], preview


def old_panel(recipe):
    pieces, local_windows = [], []
    for part in recipe['parts']:
        raw = read_rgb(part['file'])
        y0,y1 = part.get('rows',[0,raw.height])
        pieces.append(raw.crop((0,y0,raw.width,y1)))
        local_windows.append([(a-y0,b-y0) for a,b in part.get('windows',[])])
    # Concatenate at native width first. Mixed-width sources share the first file's
    # scale before stitching. The finished old module is resized only once to 1500.
    base_width=pieces[0].width
    strips=[p if p.width==base_width else at_width(p,base_width) for p in pieces]
    total=sum(p.height for p in strips)
    stitch=Image.new('RGB',(base_width,total))
    seams,windows=[],[]
    y=0
    for raw,p,band in zip(pieces,strips,local_windows):
        if y:
            seams.append(y)
        stitch.paste(p,(0,y))
        windows.extend([[y+round(a*p.height/raw.height),y+round(b*p.height/raw.height)] for a,b in band])
        y+=p.height
    page=at_width(stitch)
    factor=page.height/total
    return page,[round(v*factor) for v in seams],[[round(a*factor),round(b*factor)] for a,b in windows]


def safe_rows(im, windows, protected):
    # All pixels in all channels participate. A short band rejects isolated thin strokes.
    out=np.zeros(im.height,dtype=bool)
    for y in range(0,im.height,160):
        a=np.asarray(im.crop((0,y,W,min(y+160,im.height))))
        span=np.ptp(a,axis=1).max(1)
        sigma=a.std(axis=1).max(1)
        out[y:y+len(a)]=(span<=36)&(sigma<=8)
    if windows:
        allowed=np.zeros(im.height,dtype=bool)
        for a,b in windows:
            allowed[max(0,a):min(im.height,b)]=True
        out &= allowed
    for a,b in protected:
        out[max(0,a-4):min(im.height,b+4)]=False
    return np.flatnonzero(np.convolve(out.astype('int16'),np.ones(9,dtype='int16'),'same')==9)


def plan_cuts(im,seams=(),windows=(),protected=(),boundaries=()):
    if boundaries and im.height>LIMIT:
        # Natural edges between complete detail cards are legal module boundaries.
        stops=[0]+list(boundaries)+[im.height]
        candidates=[]
        for a,b in zip(stops,stops[1:]):
            if b-a>LIMIT:
                local=plan_cuts(im.crop((0,a,W,b)),[y-a for y in seams if a<y<b],
                                [[max(x,a)-a,min(y,b)-a] for x,y in windows if x<b and y>a],
                                [[max(x,a)-a,min(y,b)-a] for x,y in protected if x<b and y>a])
                if local is None:
                    return None
                candidates.extend(a+y for y in local[1:])
            else:
                candidates.append(b)
        cuts=[0]
        previous=0
        for y in candidates:
            if y-cuts[-1]>LIMIT:
                cuts.append(previous)
            previous=y
        return cuts+[im.height]
    if im.height<=LIMIT:
        return [0,im.height]
    rows=safe_rows(im,windows,protected)
    memo={}
    def path(start):
        if im.height-start<=LIMIT:
            return [im.height]
        if start in memo:
            return memo[start]
        high=start+LIMIT
        span=im.height-start
        ideal=start+round(span/math.ceil(span/LIMIT))
        # Prefer original content joins and then a balanced split. A final limit-sized
        # alternative avoids a tiny tail when the balanced target falls inside a table.
        targets=[v for v in seams if start+SEARCH<v<=high+SEARCH]
        targets.sort(key=lambda y:abs(ideal-y))
        targets.extend([ideal,high])
        tried=set()
        for goal in targets:
            nearby=rows[(rows>start)&(rows<=high)&(np.abs(rows-goal)<=SEARCH)]
            for y in nearby[np.argsort(np.abs(nearby-goal),kind='stable')]:
                y=int(y)
                if y in tried:
                    continue
                tried.add(y)
                suffix=path(y)
                if suffix:
                    memo[start]=[y]+suffix
                    return memo[start]
        memo[start]=None
        return None
    result=path(0)
    return [0]+result if result else None
