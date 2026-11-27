#!/usr/bin/env python3
"""Verify the bundled visual references against their recorded original bytes."""
import argparse
import hashlib
import json
from pathlib import Path


def verify(root):
    root = root.resolve()
    manifest = json.loads((root / "assets" / "manifest.json").read_text(encoding="utf-8"))
    failures = []
    total = 0
    seen = set()
    for item in manifest["assets"]:
        relative = item["path"]
        path = (root / relative).resolve()
        if relative in seen or (path != root and root not in path.parents):
            failures.append({"path": relative, "error": "duplicate or unsafe path"})
            continue
        seen.add(relative)
        if not path.is_file():
            failures.append({"path": relative, "error": "missing file"})
            continue
        data = path.read_bytes()
        total += len(data)
        if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
            failures.append({"path": relative, "error": "original byte checksum mismatch"})
    result = {
        "status": "failed" if failures else "passed",
        "checked_assets": len(manifest["assets"]),
        "total_bytes": total,
        "failures": failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    raise SystemExit(verify(parser.parse_args().root))
