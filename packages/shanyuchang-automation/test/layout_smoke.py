"""Run the two layout entry points with a temporary, synthetic single-colour product."""
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

from PIL import Image


def verify_jpg(file, width, height=None):
    with Image.open(file) as image:
        assert image.format == 'JPEG' and image.width == width and image.info.get('icc_profile'), file
        assert image.height == height if height is not None else image.height <= 2500, file


def exercise(skill):
    config = json.loads((skill / 'assets/layout.json').read_text(encoding='utf-8'))
    with TemporaryDirectory(prefix='shanyuchang-layout-') as temp:
        base = Path(temp)
        project = base / 'project'
        photos = project / 'photos'
        photos.mkdir(parents=True)
        (project / 'old').mkdir()
        color = '雪白'

        def make_image(name, size):
            Image.new('RGB', tuple(size), (80, 125, 180)).save(photos / name)
            return name

        portrait = make_image('portrait.png', (600, 900))
        landscape = make_image('landscape.png', (900, 600))
        commercial = {}
        for role, spec in config['commercial'].items():
            keys = [color] if spec.get('per_color') else [
                str(i) for i in range(1, spec['count'] + 1) if i not in spec.get('skip_single', [])
            ]
            commercial[role] = dict.fromkeys(keys, make_image(role + '.png', spec['size']))
        manifest = {
            'product_id': '1000000000000', 'colors': [color], 'photos_dir': 'photos', 'old_dir': 'old',
            'settings': {'horizontal_count': 2, 'per_color_count': 2},
            'photos': {
                'hero': portrait, 'sport': portrait, 'banners': [landscape] * 2,
                'brand': {color: [portrait] * 2}, 'closing': landscape,
            },
            'commercial': commercial,
        }
        with (project / 'project.json').open('x', encoding='utf-8') as output:
            json.dump(manifest, output, ensure_ascii=False)
        detail_output, commercial_output = base / 'detail', base / 'commercial'
        for script, output in [('build.py', detail_output), ('build_commercial.py', commercial_output)]:
            subprocess.run(
                [sys.executable, '-B', str(skill / 'scripts' / script), str(project), '--output', str(output)],
                check=True,
            )
        detail = list((detail_output / '切片').glob('*.jpg'))
        assert len(detail) == 7
        for file in detail:
            verify_jpg(file, 1500)
        assert list(detail_output.glob('整页预览.*')) and (detail_output / '交付清单.md').is_file()
        counts = {}
        for role, spec in config['commercial'].items():
            files = list((commercial_output / spec['folder']).glob('*.jpg'))
            assert len(files) == len(commercial[role])
            counts[role] = len(files)
            for file in files:
                verify_jpg(file, *spec['size'])
        assert counts == {'main': 4, 'search': 5, 'sku': 1}
        print(json.dumps({'detail': len(detail), **counts}, ensure_ascii=False))


if __name__ == '__main__':
    exercise(Path(sys.argv[1]).resolve())
