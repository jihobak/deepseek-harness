"""Check relative links, pinned implementation citations and generated cell sources."""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import unquote

from practice import ROOT, check_pages


def cells(path):
    return [(c['cell_type'], ''.join(c['source'])) for c in json.loads(path.read_text())['cells']]


def check_notebooks(root=ROOT):
    with tempfile.TemporaryDirectory(prefix='harness-notebooks-') as directory:
        env = {**os.environ, 'HARNESS_NOTEBOOK_OUTPUT': directory}
        for name in ['build_notebooks.py', 'build_prototype_materials.py']:
            subprocess.run([sys.executable, str(root / 'scripts' / name)], env=env, check=True, capture_output=True)
        generated = sorted(Path(directory).glob('*.ipynb'))
        if {p.name for p in generated} != {p.name for p in (root / 'notebooks').glob('*.ipynb')}:
            raise ValueError('Notebook file set differs from generators')
        for path in generated:
            if cells(path) != cells(root / 'notebooks' / path.name):
                raise ValueError(f'Stale notebook source: {path.name}')

def check_links(paths):
    count = 0
    for path in paths:
        if path.suffix not in ['.md', '.ipynb']:
            continue
        text = path.read_text()
        if path.suffix == '.ipynb':
            text = '\n'.join(source for kind, source in cells(path) if kind == 'markdown')
        if re.search(r'github\.com/(deepseek-ai/dsh-superagent-prototype|switch-dimension/deepseek-superagent-guide)/blob/main/', text):
            raise ValueError(f'Moving implementation citation: {path}')
        for target in re.findall(r'\]\(([^)]+)\)', text):
            target = unquote(target.split('#')[0])
            if not target or '://' in target or target.startswith('mailto:'):
                continue
            if not (path.parent / target).exists():
                raise ValueError(f'Missing linked file: {path}: {target}')
            count += 1
    return count


def check():
    check_pages()
    check_notebooks()
    repository = ROOT.parents[1]
    tracked = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '--', str(ROOT)], text=True, cwd=repository)
    count = check_links(repository / name for name in tracked.splitlines())
    print(f'PASS: generated notebooks, practice pages, pinned citations, {count} relative file links')


if __name__ == '__main__':
    check()
