"""Negative controls for the corpus guards, using only private temporary copies."""
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from practice import ROOT
from verify_materials import check_links, check_notebooks


class MaterialGuards(unittest.TestCase):
    def test_missing_link_is_rejected_and_existing_target_passes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            page = root / 'guide.md'
            page.write_text('[exercise](exercise.md)\n')
            with self.assertRaisesRegex(ValueError, 'Missing linked file'):
                check_links([page])
            (root / 'exercise.md').write_text('# Exercise\n')
            self.assertEqual(check_links([page]), 1)

    def test_moving_implementation_citation_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'guide.md'
            page.write_text('[policy](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/main/src/policy.ts)\n')
            with self.assertRaisesRegex(ValueError, 'Moving implementation citation'):
                check_links([page])

    def test_manually_changed_cell_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'scripts').mkdir()
            for name in ['build_notebooks.py', 'build_prototype_materials.py']:
                shutil.copyfile(ROOT / 'scripts' / name, root / 'scripts' / name)
            shutil.copytree(ROOT / 'notebooks', root / 'notebooks')
            page = root / 'notebooks/00_reading_map.ipynb'
            data = json.loads(page.read_text())
            data['cells'][0]['source'] = ['This stale text must fail the corpus gate.']
            page.write_text(json.dumps(data))
            with self.assertRaisesRegex(ValueError, 'Stale notebook source: 00_reading_map'):
                check_notebooks(root)


if __name__ == '__main__':
    unittest.main()
