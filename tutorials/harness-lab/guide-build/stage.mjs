import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const stage=process.argv[2];
if(!/^(0[1-6])$/.test(stage??'')){console.error('npm run stage -- 01 (01–06)');process.exit(2);}
const files=readdirSync(new URL('./tests/',import.meta.url)).filter(n=>n.startsWith(stage+'-')&&n.endsWith('.test.ts'));
if(!files.length)throw new Error('Missing stage test');
const r=spawnSync(process.execPath,['--test','--test-isolation=none',...files.map(n=>'tests/'+n)],{cwd:new URL('.',import.meta.url),stdio:'inherit'});
if(r.error)throw r.error;process.exit(r.status??1);
