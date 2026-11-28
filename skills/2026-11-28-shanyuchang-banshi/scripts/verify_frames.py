"""Validate the delivered Markdown and JPEG pixels for each colour group."""
import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image


def measure(page):
    a = np.asarray(page.convert("RGB"))
    # JPEG ringing may affect a few edge pixels. Use the central half of each axis.
    h, w = a.shape[:2]
    dark = a.min(axis=2) < 242
    cols = np.flatnonzero(dark[h//4:3*h//4].mean(axis=0) > .035)
    rows = np.flatnonzero(dark[:,w//4:3*w//4].mean(axis=1) > .035)
    if not len(cols) or not len(rows):
        raise ValueError("画面没有足够的可辨摄影纹理，不能量框")
    return [int(cols[0]), int(w-cols[-1]-1), int(rows[0]), int(h-rows[-1]-1)]


def validate(output):
    data = json.loads((output/"项目记录/排版数据.json").read_text(encoding="utf8"))
    markdown = (output/"交付清单.md").read_text(encoding="utf8")
    groups = {c: [] for c in data["output_colors"]}
    index = {r["name"]: r for r in data["rows"] if r.get("color")}
    measured = []
    for line in markdown.splitlines():
        if not line.startswith("|") or "每色品牌摄影 · " not in line:
            continue
        name = line.split("|")[2].strip()
        row = index[name]
        color = row["color"]
        found = re.search(r"白边 左/右/上/下 (\d+)/(\d+)/(\d+)/(\d+) px", line)
        if not found:
            raise ValueError(name+" 缺少四边尺寸")
        declared = list(map(int, found.groups()))
        first = not groups[color]
        if (first and declared[:2] != [0,0]) or (not first and min(declared[:2]) <= 0):
            raise ValueError(name+" 清单未通过分色首张/后续张左右白边硬检查")
        if name in groups[color] or name != "每色品牌摄影 · "+color+" "+str(len(groups[color])+1):
            raise ValueError(name+" 清单序号或色组重复")
        groups[color].append(name)
        files = row["slices"]
        if not files:
            raise ValueError(name+" 缺少成品切片")
        stripes = []
        for file in files:
            with Image.open(output/"切片"/file) as im:
                if im.format != "JPEG":
                    raise ValueError(file+" 成品格式错误")
                stripes.append(im.convert("RGB"))
        page = Image.new("RGB",(stripes[0].width,sum(i.height for i in stripes)))
        y = 0
        for stripe in stripes:
            page.paste(stripe,(0,y))
            y += stripe.height
        actual = measure(page)
        if row["frame"] != declared or any(abs(a-b)>3 for a,b in zip(actual,declared)):
            raise ValueError(name+" 白边不一致，清单 %s，JPG 实测 %s"%(declared,actual))
        measured.append((name,declared,actual))
    for color, group in groups.items():
        if len(group) != data["settings"]["per_color_count"]:
            raise ValueError(color+" 清单实际行数错误")
    return measured


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output",type=Path)
    args = parser.parse_args()
    for name,declared,actual in validate(args.output):
        print(name+" 清单 "+" / ".join(map(str,declared))+"  JPG "+" / ".join(map(str,actual)))
    print("PASS 分色白边清单与交付 JPG")
