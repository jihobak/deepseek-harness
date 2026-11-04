"""Execute each notebook in a fresh kernel; fail on any error and record evidence."""
import json, os, time
from pathlib import Path
import nbformat
from nbclient import NotebookClient
ROOT=Path(__file__).resolve().parents[1]
for key,folder in [('IPYTHONDIR','.ipython'),('JUPYTER_RUNTIME_DIR','.jupyter-runtime')]:
    path=ROOT/folder; path.mkdir(exist_ok=True); os.environ[key]=str(path)
os.environ['RUN_LIVE']='0'
(ROOT/'validation.json').unlink(missing_ok=True)
rows=[]
for path in sorted((ROOT/'notebooks').glob('*.ipynb')):
    nb=nbformat.read(path,as_version=4)
    nbformat.validate(nb)
    started=time.monotonic()
    NotebookClient(nb,timeout=60,kernel_name='harness-lab',resources={'metadata':{'path':str(ROOT)}}).execute()
    errors=[o for c in nb.cells if c.cell_type=='code' for o in c.get('outputs',[]) if o.output_type=='error']
    assert not errors
    assert all(c.execution_count is not None for c in nb.cells if c.cell_type=='code')
    nbformat.write(nb,path)
    row={'notebook':path.name,'code_cells':sum(c.cell_type=='code' for c in nb.cells),
         'status':'passed','seconds':round(time.monotonic()-started,2)}
    rows.append(row); print(row,flush=True)
report={'mode':'fresh kernel per notebook, RUN_LIVE=0','notebooks':rows,
        'live_model':'skipped; no request made','errors':0}
(ROOT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
