"""Validate every solved stage and independently exercise every intentional gap."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path

from practice import ROOT, catalog, check_pages, create, fill_gap


def run(args, cwd, expected=0):
    result = subprocess.run(args, cwd=cwd, text=True, capture_output=True, timeout=120)
    if expected == 0 and result.returncode != 0:
        raise RuntimeError(f'{args} in {cwd}\n{result.stdout}\n{result.stderr}')
    if expected != 0:
        output = result.stdout + result.stderr
        if result.returncode != 1 or any(s in output for s in ['ERR_MODULE_NOT_FOUND', 'SyntaxError', 'startup timeout', 'state did not converge']):
            raise RuntimeError(f'Expected a behavioral exercise failure: {args}\n{output}')


def validate(selection=None):
    check_pages()
    results = []
    for entry in catalog():
        if selection and f"{entry['course']}/{entry['stage']}" not in selection:
            continue
        with tempfile.TemporaryDirectory(prefix='harness-practice-') as temporary:
            project = Path(temporary) / 'answer'
            create(entry, project, answers=True)
            dependencies = ROOT / entry['course'] / 'node_modules'
            if not dependencies.exists():
                raise RuntimeError(f'Run npm ci --ignore-scripts in {dependencies.parent}')
            (project / 'node_modules').symlink_to(dependencies, target_is_directory=True)
            run(['npm', 'run', 'typecheck'], project)
            run(['npm', 'test'], project)
            if entry['stage'] == '08':
                run(['node', 'stage.mjs', '08'], project)
            for hole in entry['holes']:
                path = project / hole['file']
                original = path.read_text()
                try:
                    path.write_text(fill_gap(original, hole))
                    run(['npm', 'run', 'typecheck'], project)
                    run(['node', 'stage.mjs', entry['stage']], project, expected=1)
                finally:
                    path.write_text(original)
            # The actual all-gaps starter must also compile and fail behaviorally.
            exercise = Path(temporary) / 'exercise'
            create(entry, exercise)
            (exercise / 'node_modules').symlink_to(dependencies, target_is_directory=True)
            run(['npm', 'run', 'typecheck'], exercise)
            run(['node', 'stage.mjs', entry['stage']], exercise, expected=1)
            sentinel = exercise / 'README.md'
            before = sentinel.read_bytes()
            try:
                create(entry, exercise)
            except FileExistsError:
                assert sentinel.read_bytes() == before
            else:
                raise AssertionError('Existing learner work must never be overwritten')
            row = {'course': entry['course'], 'stage': entry['stage'], 'answer': 'passed',
                   'independent_gap_failures': len(entry['holes']), 'starter': 'expected failure'}
            results.append(row)
            print(row, flush=True)
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path)
    parser.add_argument('--stage', action='append', help='select course/NN for a focused recheck')
    args = parser.parse_args()
    if args.report:
        args.report.unlink(missing_ok=True)
    if args.stage:
        valid = {f"{e['course']}/{e['stage']}" for e in catalog()}
        if not set(args.stage) <= valid:
            parser.error('unknown course/stage')
    result = validate(args.stage)
    if args.report:
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
