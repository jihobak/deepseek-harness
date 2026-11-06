import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const stage=process.argv[2];
if(!/^(0[1-8])$/.test(stage??'')){console.error('npm run stage -- 01 (01–08)');process.exit(2);}
const files=readdirSync(new URL('./tests/',import.meta.url)).filter(n=>n.startsWith(stage+'-')&&n.endsWith('.test.ts'));
if(!files.length&&stage!=='08')throw new Error('Missing stage test');
const args=stage==='08'?['tests/smoke.mjs']:['--test','--test-isolation=none',...files.map(n=>'tests/'+n)];
const r=spawnSync(process.execPath,args,{cwd:new URL('.',import.meta.url),stdio:'inherit'});
if(r.error)throw r.error;process.exit(r.status??1);
