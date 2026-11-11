import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image, ImageOps

sys.dont_write_bytecode = True
SCRIPT = Path(__file__).resolve().parents[1] / "skills/cloud-hug-batch-style-transfer/scripts/prepare_detail.py"
spec = importlib.util.spec_from_file_location("prepare_detail", SCRIPT)
prep = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prep)


class BatchPreprocessingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="cloud-hug-batch-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def image(self, name, size, color, mode="RGB", **save_options):
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        with Image.new(mode, size, color) as image:
            image.save(target, **save_options)
        return target

    def json(self, name, data):
        target = self.root / name
        target.write_text(json.dumps(data), encoding="utf-8")
        return target

    def args(self, **kwargs):
        return argparse.Namespace(order=None, source_manifest=None, **kwargs)

    def test_stitch_and_variable_screens_preserve_every_pixel_and_source_mapping(self):
        sources = [self.image("input/{:02d}.png".format(i), (8, h), color)
                   for i, h, color in [(1, 5, "red"), (2, 4, "green"), (3, 6, "blue")]]
        hashes = [prep.digest(p) for p in sources]
        stitched = prep.stitch(self.args(input=self.root / "input", output=self.root / "joined"))
        self.assertEqual((stitched["width"], stitched["height"]), (8, 15))
        cuts = self.json("cuts.json", {"boundaries": [0, 3, 11, 15], "labels": ["title", "scene", "table"]})
        args = self.args(image=stitched["image"], cuts=cuts, output=self.root / "screens")
        args.source_manifest = stitched["manifest"]
        result = prep.split(args)
        manifest = prep.read_json(result["manifest"])
        self.assertEqual([p["height"] for p in manifest["screens"]], [3, 8, 4])
        middle = manifest["screens"][1]["input_sources"]
        self.assertEqual([p["source_y"] for p in middle], [[3, 5], [0, 4], [0, 2]])
        self.assertEqual([p["screen_y"] for p in middle], [[0, 2], [2, 6], [6, 8]])
        with Image.new("RGB", (8, 15)) as reconstructed, Image.open(stitched["image"]) as original:
            for row in manifest["screens"]:
                with Image.open(self.root / "screens" / row["file"]) as image:
                    reconstructed.paste(image, (0, row["source_y"][0]))
            self.assertEqual(reconstructed.tobytes(), original.tobytes())
        self.assertEqual([prep.digest(p) for p in sources], hashes)

    def test_explicit_order_requires_exactly_all_inputs(self):
        for i, name in enumerate(["top", "middle", "bottom"]):
            self.image("input/" + name + ".png", (8, 3), (i * 80, 20, 40))
        args = self.args(input=self.root / "input")
        self.assertIn("ORDER_NEEDS_VISUAL_REVIEW", [i["code"] for i in prep.inventory(args)["issues"]])
        args.order = self.json("order.json", {"files": ["bottom.png", "top.png", "middle.png"]})
        result = prep.inventory(args)
        self.assertEqual(result["issues"], [])
        self.assertEqual([Path(p["path"]).name for p in result["files"]], ["bottom.png", "top.png", "middle.png"])
        for index, names in enumerate([["top.png"], ["top.png", "top.png", "middle.png"]]):
            args.order = self.json("bad-order-{}.json".format(index), names)
            with self.assertRaises(prep.InputError):
                prep.inventory(args)

    def test_unsafe_stitches_fail_without_creating_output(self):
        cases = [
            ("width", "02.png", (9, 3), "blue", {}),
            ("missing", "03.png", (8, 3), "blue", {}),
            ("duplicate", "02.png", (8, 3), "red", {}),
            ("profile", "02.png", (8, 3), "blue", {"icc_profile": b"test-profile"}),
        ]
        for name, second, size, color, options in cases:
            with self.subTest(name=name):
                self.image(name + "/01.png", (8, 3), "red")
                self.image(name + "/" + second, size, color, **options)
                output = self.root / (name + "-output")
                with self.assertRaises(prep.InputError):
                    prep.stitch(self.args(input=self.root / name, output=output))
                self.assertFalse(output.exists())

    def test_incomplete_boundaries_and_mismatched_sources_are_rejected(self):
        source = self.image("source.png", (8, 10), "red")
        invalid = [{"boundaries": b} for b in [[1, 10], [0, 9], [0, 5, 5, 10], [0, True, 10], [0, 11, 10]]]
        invalid += [{"boundaries": [0, 10], "image_sha256": "wrong"}, {"boundaries": [0, 10], "width": 9}]
        for index, cuts in enumerate(invalid):
            with self.subTest(cuts=cuts):
                output = self.root / ("bad-" + str(index))
                with self.assertRaises(prep.InputError):
                    prep.split(self.args(image=source, cuts=self.json("cuts-{}.json".format(index), cuts), output=output))
                self.assertFalse(output.exists())
        args = self.args(image=source, cuts=self.json("valid.json", {"boundaries": [0, 10]}), output=self.root / "mismatch")
        args.source_manifest = self.json("wrong-manifest.json", {"schema": "cloud-hug-stitch-v1", "image_sha256": "wrong"})
        with self.assertRaises(prep.InputError):
            prep.split(args)
        self.assertFalse(Path(args.output).exists())

    def test_display_orientation_is_used_without_changing_the_source(self):
        exif = Image.Exif()
        exif[274] = 6
        source = self.image("oriented.jpg", (12, 8), "blue", exif=exif)
        before = prep.digest(source)
        record = prep.image_record(source)
        self.assertEqual([record["width"], record["height"]], [8, 12])
        output = self.root / "oriented-screens"
        prep.split(self.args(image=source, cuts=self.json("cuts.json", {"boundaries": [0, 5, 12]}), output=output))
        with Image.new("RGB", (8, 12)) as reconstructed, Image.open(source) as raw:
            for y, name in [(0, "screen-01.png"), (5, "screen-02.png")]:
                with Image.open(output / name) as part:
                    reconstructed.paste(part, (0, y))
            with ImageOps.exif_transpose(raw) as original:
                self.assertEqual(reconstructed.tobytes(), original.tobytes())
        self.assertEqual(prep.digest(source), before)

    def test_alpha_and_color_profiles_are_preserved(self):
        profile = b"fixture-icc-profile"
        for number, color in [(1, (10, 20, 30, 96)), (2, (40, 50, 60, 160))]:
            self.image("alpha/{:02d}.png".format(number), (8, 3), color, mode="RGBA", icc_profile=profile)
        result = prep.stitch(self.args(input=self.root / "alpha", output=self.root / "joined"))
        with Image.open(result["image"]) as image:
            self.assertEqual(image.mode, "RGBA")
            self.assertEqual(image.getpixel((0, 0)), (10, 20, 30, 96))
            self.assertEqual(image.getpixel((0, 5)), (40, 50, 60, 160))
            self.assertEqual(image.info["icc_profile"], profile)

    def test_preview_cli_maps_tiles_and_preserves_existing_outputs(self):
        source = self.image("源图.png", (8, 15), "red")
        before = prep.digest(source)
        command = [sys.executable, "-B", str(SCRIPT), "preview", "--image", str(source),
                   "--output", str(self.root / "preview"), "--tile-height", "6", "--width", "4"]
        result = subprocess.run(command, capture_output=True, encoding="utf-8")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["tile_count"], 3)
        preview = prep.read_json(self.root / "preview/preview.json")
        self.assertEqual([p["source_y"] for p in preview["tiles"]], [[0, 6], [6, 12], [12, 15]])
        self.assertTrue(all(p["width"] == 4 for p in preview["tiles"]))
        saved = (self.root / "preview/preview.json").read_bytes()
        repeated = subprocess.run(command, capture_output=True, encoding="utf-8")
        self.assertEqual(repeated.returncode, 1)
        self.assertEqual((self.root / "preview/preview.json").read_bytes(), saved)
        self.assertEqual(prep.digest(source), before)


if __name__ == "__main__":
    unittest.main()
