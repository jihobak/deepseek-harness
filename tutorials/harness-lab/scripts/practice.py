"""Create isolated fill-in projects; generate their separate exercise/answer pages."""
import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / 'practice/catalog.json'


def catalog():
    entries = json.loads(CATALOG.read_text())
    for entry in entries:
        for hole in entry['holes']:
            source = (ROOT / entry['course'] / hole['file']).read_text()
            if source.count(hole['answer']) != 1:
                raise ValueError(f"Exercise anchor drift: {hole['id']}")
    return entries


def blank(hole):
    message = f"EXERCISE {hole['id']}: {hole['prompt']}"
    statement = 'throw new Error(' + json.dumps(message, ensure_ascii=False) + ');'
    if hole['expression']:
        return f"exercise<{hole['return_type']}>({json.dumps(message, ensure_ascii=False)})"
    if hole['answer'].startswith('throw '):
        return statement
    return f"exercise<void>({json.dumps(message, ensure_ascii=False)});"


def fill_gap(source, hole):
    result = source.replace(hole['answer'], blank(hole), 1)
    if 'exercise<' in blank(hole) and "from './exercise-gap.ts'" not in result:
        result = "import { exercise } from './exercise-gap.ts';\n" + result
    return result


def create(entry, destination, answers=False, only_hole=None):
    """Copy the selected tests and their dependency closure; never overwrite work."""
    destination.mkdir(parents=True, exist_ok=False)
    course = ROOT / entry['course']
    stage = entry['stage']
    files = {Path(p) for p in ['package.json', 'package-lock.json', 'tsconfig.json', 'stage.mjs']}
    pending = [p.relative_to(course) for p in (course / 'tests').glob('*.test.ts') if p.name[:2] <= stage]
    if stage == '08':
        pending += [Path('tests/smoke.mjs'), Path('src/app.ts'), Path('src/mock-worker.ts'), Path('src/sa.ts')] if entry['course'] == 'guide-build' else [Path('tests/http-smoke.mjs'), Path('src/server.ts')]
    # Both execution tests and final assembly use these fixed worker assets.
    if entry['course'] == 'guide-build':
        files.update([Path('prompts/worker.md'), Path('bin/sa')])
    while pending:
        relative = pending.pop()
        if relative in files:
            continue
        files.add(relative)
        source = course / relative
        for module in re.findall(r"from\s*['\"]([^'\"]+)['\"]", source.read_text()):
            if module.startswith('.'):
                dependency = (source.parent / module).resolve().relative_to(course)
                pending.append(dependency)
    for relative in sorted(files):
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(course / relative, target)
    (destination / 'src/exercise-gap.ts').write_text(
        '/** A typed placeholder; replace its call with the requested expression. */\n'
        'export function exercise<T>(message: string): T { throw new Error(message); }\n')
    for hole in entry['holes']:
        target = destination / hole['file']
        if not target.exists():
            raise ValueError(f"Exercise is outside stage dependencies: {hole['id']}")
        if not answers and (only_hole is None or hole['id'] == only_hole):
            target.write_text(fill_gap(target.read_text(), hole))
    (destination / 'README.md').write_text(
        f"# {entry['course']} {stage}: {entry['title']}\n\n"
        + ('완성 정답 프로젝트입니다.\n\n' if answers else 'EXERCISE 표시를 해당 동작으로 바꾸세요. 주변 코드는 제공됩니다.\n\n')
        + '```sh\nnpm ci --ignore-scripts\nnpm run typecheck\nnpm test\n'
        + f'npm run stage -- {stage}\n```\n\n'
        + '\n'.join(f"- `{h['id']}` · `{h['file']}`: {h['prompt']}" for h in entry['holes']) + '\n')


def pages(entry):
    slug = f"{entry['course']}-{entry['stage']}"
    intro = f"# {entry['stage']}. {entry['title']}\n\n"
    command = f"python scripts/practice.py create {entry['course']} {entry['stage']} --dest /tmp/{slug}"
    exercise = intro + '학습 프로젝트 루트(`tutorials/harness-lab`)에서 실행합니다. 기존 경로가 있으면 새 경로를 선택하세요.\n\n'
    exercise += f'```sh\n{command}\ncd /tmp/{slug}\nnpm ci --ignore-scripts\nnpm run typecheck\nnpm run stage -- {entry["stage"]}\n```\n\n'
    exercise += '처음에는 타입 검사는 통과하고 동작 테스트는 실패합니다. `EXERCISE` 예외를 요구한 코드로 바꾸세요. 주변 코드와 이전 단계 테스트는 제공됩니다.\n\n'
    answer = intro + '실습을 먼저 시도한 뒤 읽으세요. 아래 코드는 각 EXERCISE 표현식 또는 문장 전체를 대체합니다.\n\n'
    for number, hole in enumerate(entry['holes'], 1):
        exercise += f"## 빈칸 {number}: {hole['id']}\n\n파일: `{hole['file']}`. {hole['prompt']}\n\n힌트: {hole['hint']}\n\n"
        answer += f"## 정답 {number}: {hole['id']}\n\n```text\n{hole['answer']}\n```\n\n{hole['explanation']}\n\n"
    exercise += f"완료 기준: 현재 단계와 `npm test`의 이전 단계 테스트가 모두 통과합니다. 테스트 기대값은 변경하지 않습니다.\n\n[별도 정답과 해설](../answers/{slug}.ko.md) · [실습 사용법](../INDEX.ko.md)\n"
    answer += f'## 전체 정답 실행\n\n```sh\n{command}-answer --answers\ncd /tmp/{slug}-answer\nnpm ci --ignore-scripts\nnpm run typecheck\nnpm test\nnpm run stage -- {entry["stage"]}\n```\n\n'
    answer += f"[문제로 돌아가기](../exercises/{slug}.ko.md) · [참조 구현](../../{entry['course']}/src/{'app' if entry['course']=='guide-build' and entry['stage']=='08' else 'engine' if entry['stage'] not in ['01','02'] or entry['course']=='guide-build' else 'source' if entry['stage']=='01' else 'policy'}.ts)\n"
    return {'exercises': exercise, 'answers': answer}


def check_pages(write=False):
    for entry in catalog():
        for kind, body in pages(entry).items():
            path = ROOT / 'practice' / kind / f"{entry['course']}-{entry['stage']}.ko.md"
            if write:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(body)
            elif not path.exists() or path.read_text() != body:
                raise ValueError(f'Stale practice page: {path}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    new = sub.add_parser('create')
    new.add_argument('course', choices=['guide-build', 'rebuild'])
    new.add_argument('stage', choices=[f'{n:02}' for n in range(1, 9)])
    new.add_argument('--dest', type=Path, required=True)
    new.add_argument('--answers', action='store_true')
    docs = sub.add_parser('pages')
    docs.add_argument('--write', action='store_true')
    args = parser.parse_args()
    if args.command == 'pages':
        check_pages(args.write)
    else:
        entry = next(e for e in catalog() if (e['course'], e['stage']) == (args.course, args.stage))
        create(entry, args.dest.resolve(), args.answers)
        print(args.dest.resolve())


if __name__ == '__main__':
    main()
