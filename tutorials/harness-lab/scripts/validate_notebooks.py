"""Run fresh kernels without editing notebooks unless --write is explicit."""
import argparse
import json
import os
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='save executed notebooks and validation.json')
    parser.add_argument('--report', type=Path, help='write a JSON report outside notebooks')
    parser.add_argument('--notebook', action='append', help='select a notebook filename; default: all')
    args = parser.parse_args()
    for key, folder in [('IPYTHONDIR', '.ipython'), ('JUPYTER_RUNTIME_DIR', '.jupyter-runtime')]:
        path = ROOT / folder
        path.mkdir(exist_ok=True)
        os.environ[key] = str(path)
    os.environ['RUN_LIVE'] = '0'
    report_path = args.report or (ROOT / 'validation.json' if args.write else None)
    if report_path:
        report_path.unlink(missing_ok=True)
    paths = sorted((ROOT / 'notebooks').glob('*.ipynb'))
    if args.notebook:
        names = set(args.notebook)
        paths = [p for p in paths if p.name in names]
        if {p.name for p in paths} != names:
            parser.error('unknown notebook filename')
    if not paths:
        raise RuntimeError('No notebooks selected')
    rows = []
    for path in paths:
        nb = nbformat.read(path, as_version=4)
        nbformat.validate(nb)
        started = time.monotonic()
        NotebookClient(nb, timeout=60, kernel_name='harness-lab',
                       resources={'metadata': {'path': str(ROOT)}}).execute()
        cells = [c for c in nb.cells if c.cell_type == 'code']
        assert all(c.execution_count is not None for c in cells)
        if args.write:
            nbformat.write(nb, path)
        row = {'notebook': path.name, 'code_cells': len(cells), 'status': 'passed',
               'seconds': round(time.monotonic() - started, 2)}
        rows.append(row)
        print(row, flush=True)
    report = {'mode': 'fresh kernel per notebook, RUN_LIVE=0', 'notebooks': rows,
              'live_model': 'skipped; no request made', 'errors': 0}
    if report_path:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
