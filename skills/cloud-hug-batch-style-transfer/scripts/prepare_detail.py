#!/usr/bin/env python3
"""Local, non-generative detail-page inspection, stitching and exact slicing."""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps


EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
MAX_PIXELS = 120_000_000


class InputError(Exception):
    pass


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)
        stream.write("\n")


def natural_key(name):
    return tuple((0, int(part)) if part.isdigit() else (1, part.casefold())
                 for part in re.split(r"(\d+)", name))


def load_image(path):
    with Image.open(path) as original:
        if getattr(original, "n_frames", 1) != 1:
            raise InputError("Animated or multi-page image is unsupported: " + str(path))
        if original.mode not in {"RGB", "RGBA", "L", "LA", "P"}:
            raise InputError("Unsupported color mode; no automatic color conversion: " + str(path))
        image = ImageOps.exif_transpose(original)
        image.load()
        return image.copy()


def image_record(path):
    with Image.open(path) as image:
        if getattr(image, "n_frames", 1) != 1:
            raise InputError("Animated or multi-page image is unsupported: " + str(path))
        raw_size = list(image.size)
        orientation = image.getexif().get(274, 1)
        size = raw_size[::-1] if orientation in {5, 6, 7, 8} else raw_size
        profile = image.info.get("icc_profile")
        record = {"path": str(path), "file_sha256": digest(path),
                  "width": size[0], "height": size[1], "stored_size": raw_size,
                  "exif_orientation": orientation, "format": image.format, "mode": image.mode,
                  "has_alpha": image.mode in {"RGBA", "LA"} or "transparency" in image.info,
                  "icc_sha256": hashlib.sha256(profile).hexdigest() if profile else None}
    return record


def inventory(args):
    source = Path(args.input).resolve()
    if not source.is_dir():
        raise InputError("Input must be an image directory.")
    files = sorted((p for p in source.iterdir() if p.is_file() and p.suffix.lower() in EXTENSIONS),
                   key=lambda p: natural_key(p.name))
    if not files:
        raise InputError("No supported images in input directory.")
    order_kind = "natural-filename"
    if args.order:
        order = read_json(args.order)
        names = order.get("files") if isinstance(order, dict) else order
        if not isinstance(names, list) or not all(isinstance(n, str) for n in names):
            raise InputError("Order JSON must be a list of paths or {files: [paths]}.")
        ordered = [(source / n).resolve() for n in names]
        if len(set(ordered)) != len(ordered):
            raise InputError("Order list repeats an input path.")
        if set(ordered) != set(p.resolve() for p in files):
            raise InputError("Order list must contain every input image exactly once.")
        files = ordered
        order_kind = "explicit-file-list"
    records = [image_record(p) for p in files]
    issues = []
    seen = {}
    for record in records:
        key = record["file_sha256"]
        if key in seen:
            issues.append({"code": "DUPLICATE_BYTES", "files": [seen[key], record["path"]]})
        seen[key] = record["path"]
    if len(set(r["width"] for r in records)) != 1:
        issues.append({"code": "DIFFERENT_WIDTHS"})
    if len(set(r["icc_sha256"] for r in records)) != 1:
        issues.append({"code": "DIFFERENT_COLOR_PROFILES"})
    numbered = [re.fullmatch(r"(.*?)(\d+)", p.stem) for p in files]
    if len(files) > 1 and all(numbered) and len(set(m.group(1) for m in numbered)) == 1:
        numbers = [int(m.group(2)) for m in numbered]
        if len(set(numbers)) != len(numbers):
            issues.append({"code": "DUPLICATE_SEQUENCE_NUMBERS"})
        if sorted(numbers) != list(range(min(numbers), max(numbers) + 1)):
            issues.append({"code": "POSSIBLE_MISSING_SEQUENCE", "numbers": numbers})
    elif len(files) > 1 and not args.order:
        issues.append({"code": "ORDER_NEEDS_VISUAL_REVIEW", "resolution": "Supply an explicit order JSON after visual review."})
    return {"schema": "cloud-hug-inputs-v1", "input_directory": str(source),
            "order_kind": order_kind, "count": len(records),
            "total_height": sum(r["height"] for r in records), "files": records,
            "issues": issues,
            "visual_review_required": "Confirm continuity, completeness and semantic screen boundaries; filenames cannot prove these."}


def new_directory(name):
    path = Path(name).resolve()
    if path.exists():
        raise InputError("Output already exists; use a new directory: " + str(path))
    path.mkdir(parents=True, exist_ok=False)
    return path


def guard_size(width, height):
    if width * height > MAX_PIXELS:
        raise InputError("Image exceeds the 120-megapixel local processing limit.")


def stitch(args):
    manifest = inventory(args)
    if manifest["issues"]:
        raise InputError("Stitch blocked; inspect and resolve input issues: " + json.dumps(manifest["issues"], ensure_ascii=False))
    records = manifest["files"]
    width, height = records[0]["width"], manifest["total_height"]
    guard_size(width, height)
    output = Path(args.output).resolve()
    if output.exists():
        raise InputError("Output already exists; use a new directory: " + str(output))
    mode = "RGBA" if any(r["has_alpha"] for r in records) else "RGB"
    canvas = Image.new(mode, (width, height))
    top = 0
    profile = None
    for record in records:
        with load_image(Path(record["path"])) as image:
            if profile is None:
                profile = image.info.get("icc_profile")
            converted = image.convert(mode)
            canvas.paste(converted, (0, top))
            converted.close()
        record["source_y"] = [0, record["height"]]
        record["stitched_y"] = [top, top + record["height"]]
        top += record["height"]
    output = new_directory(args.output)
    target = output / "stitched.png"
    canvas.save(target, format="PNG", **({"icc_profile": profile} if profile else {}))
    canvas.close()
    manifest.update({"schema": "cloud-hug-stitch-v1", "width": width, "height": height,
                     "image": "stitched.png", "image_sha256": digest(target)})
    write_json(output / "manifest.json", manifest)
    return {"ok": True, "image": str(target), "manifest": str(output / "manifest.json"),
            "width": width, "height": height, "input_count": len(records)}


def split(args):
    source = Path(args.image).resolve()
    record = image_record(source)
    width, height = record["width"], record["height"]
    guard_size(width, height)
    cuts = read_json(args.cuts)
    if not isinstance(cuts, dict):
        raise InputError("Cuts JSON must be an object with boundaries.")
    boundaries = cuts.get("boundaries")
    if (not isinstance(boundaries, list) or len(boundaries) < 2
            or any(type(y) is not int for y in boundaries)
            or boundaries[0] != 0 or boundaries[-1] != height
            or any(a >= b for a, b in zip(boundaries, boundaries[1:]))):
        raise InputError("Boundaries must be strictly increasing integers, start at 0 and end at image height.")
    for key, actual in [("width", width), ("height", height), ("image_sha256", record["file_sha256"])]:
        if key in cuts and cuts[key] != actual:
            raise InputError("Cuts do not match source " + key)
    labels = cuts.get("labels", [""] * (len(boundaries) - 1))
    if not isinstance(labels, list) or len(labels) != len(boundaries) - 1 or not all(isinstance(v, str) for v in labels):
        raise InputError("Labels must have one string per screen.")
    stitch_manifest = read_json(args.source_manifest) if args.source_manifest is not None else None
    if args.source_manifest is not None and (not isinstance(stitch_manifest, dict)
            or stitch_manifest.get("schema") != "cloud-hug-stitch-v1"
            or stitch_manifest.get("image_sha256") != record["file_sha256"]
            or [stitch_manifest.get("width"), stitch_manifest.get("height")] != [width, height]):
        raise InputError("Source manifest does not describe this stitched image.")
    output = new_directory(args.output)
    screens = []
    with load_image(source) as image:
        for index, (top, bottom) in enumerate(zip(boundaries, boundaries[1:]), 1):
            filename = "screen-{:02d}.png".format(index)
            target = output / filename
            with image.crop((0, top, width, bottom)) as screen:
                profile = image.info.get("icc_profile")
                screen.save(target, format="PNG", **({"icc_profile": profile} if profile else {}))
            row = {"screen_id": "screen-{:02d}".format(index), "file": filename,
                   "label": labels[index - 1], "width": width, "height": bottom - top,
                   "source_y": [top, bottom], "sha256": digest(target), "input_sources": []}
            if stitch_manifest is not None:
                for part in stitch_manifest["files"]:
                    start, end = part["stitched_y"]
                    overlap_start, overlap_end = max(top, start), min(bottom, end)
                    if overlap_start < overlap_end:
                        row["input_sources"].append({"path": part["path"], "file_sha256": part["file_sha256"],
                            "source_y": [overlap_start - start, overlap_end - start],
                            "screen_y": [overlap_start - top, overlap_end - top]})
            else:
                row["input_sources"].append({"path": str(source), "file_sha256": record["file_sha256"],
                                             "source_y": [top, bottom], "screen_y": [0, bottom - top]})
            screens.append(row)
    manifest = {"schema": "cloud-hug-screens-v1", "source": record, "boundaries": boundaries,
                "count": len(screens), "screens": screens, "semantic_boundaries": "Supplied by caller; visually verify before generation."}
    write_json(output / "manifest.json", manifest)
    return {"ok": True, "directory": str(output), "manifest": str(output / "manifest.json"), "count": len(screens)}


def preview(args):
    source = Path(args.image).resolve()
    if args.tile_height < 1 or args.width < 1:
        raise InputError("Preview width and tile height must be positive.")
    output = new_directory(args.output)
    tiles = []
    with load_image(source) as image:
        for top in range(0, image.height, args.tile_height):
            bottom = min(top + args.tile_height, image.height)
            tile = image.crop((0, top, image.width, bottom))
            tile.thumbnail((args.width, max(1, round((bottom - top) * args.width / image.width))), Image.Resampling.LANCZOS)
            filename = "preview-y{:06d}-{:06d}.png".format(top, bottom)
            tile.save(output / filename)
            tiles.append({"file": filename, "source_y": [top, bottom], "width": tile.width, "height": tile.height})
            tile.close()
    write_json(output / "preview.json", {"source": str(source), "purpose": "Inspection only; these are not semantic screens.", "tiles": tiles})
    return {"ok": True, "directory": str(output), "tile_count": len(tiles), "purpose": "Inspection only; not generation inputs."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("inspect", "stitch"):
        part = sub.add_parser(name, help="Inspect ordered inputs" if name == "inspect" else "Join same-width images without resizing")
        part.add_argument("--input", required=True, help="Directory of input images; non-recursive")
        part.add_argument("--order", help="JSON files list, relative to input directory or absolute")
        part.add_argument("--output", required=name == "stitch", help="New manifest file (inspect) or new directory (stitch)")
    part = sub.add_parser("split", help="Slice using visually selected full-height boundaries")
    part.add_argument("--image", required=True)
    part.add_argument("--cuts", required=True)
    part.add_argument("--source-manifest", help="Matching stitch manifest, to map each crop back to original slices")
    part.add_argument("--output", required=True, help="New output directory")
    part = sub.add_parser("preview", help="Create inspection tiles; never use these as semantic screens")
    part.add_argument("--image", required=True)
    part.add_argument("--output", required=True, help="New output directory")
    part.add_argument("--tile-height", type=int, default=2000, help="Original-image rows per preview tile")
    part.add_argument("--width", type=int, default=750, help="Maximum preview width; originals remain untouched")
    args = parser.parse_args()
    if args.command == "inspect":
        result = inventory(args)
        result["ok"] = True
        if args.output:
            write_json(Path(args.output).resolve(), result)
    else:
        result = {"stitch": stitch, "split": split, "preview": preview}[args.command](args)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    try:
        main()
    except (InputError, OSError, ValueError, KeyError, Image.DecompressionBombError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
