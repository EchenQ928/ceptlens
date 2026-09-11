// Invoked only by the server owner over the existing deployment SSH connection.
// No HTTP endpoint can grant a role. Credentials never leave this process.
import { readFileSync, readlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { resolveServiceStorage, resolveServiceEnvironment } from './inspect-storage.mjs';
import { openCommunityStore } from '../server/community-store.mjs';
import { createAccountService } from '../server/account-service.mjs';

let input='';
for await (const chunk of process.stdin) { input+=chunk; if(input.length>65535) throw Error('Owner request too large'); }
const request=JSON.parse(input);
if(!['grant-developer','revoke-developer','publish-questions'].includes(request.operation))throw Error('Unsupported owner operation');
const pid=execFileSync('systemctl',['show','ceptlens','--property=MainPID','--value'],{encoding:'utf8'}).trim();
if(!/^[1-9][0-9]*$/.test(pid))throw Error('Service is not running');
const entries=readFileSync(`/proc/${pid}/environ`,'utf8').split('\0').filter(Boolean);
const initialEnv=Object.fromEntries(entries.map(e=>{const i=e.indexOf('=');return [e.slice(0,i),e.slice(i+1)];}));
const config={cwd:readlinkSync(`/proc/${pid}/cwd`),initialEnv,argv:readFileSync(`/proc/${pid}/cmdline`,'utf8').split('\0').filter(Boolean)};
const paths=resolveServiceStorage(config);
if(!paths.absoluteConfiguration)throw Error('Persistent storage must be configured with absolute paths');
if(request.operation==='publish-questions'){
 if(typeof request.bundleGzip!=='string'||!/^[A-Za-z0-9+/]+=*$/.test(request.bundleGzip))throw Error('Invalid compressed bundle');
 const bundle=gunzipSync(Buffer.from(request.bundleGzip,'base64'),{maxOutputLength:25*1024*1024});
 if(createHash('sha256').update(bundle).digest('hex')!==request.sha256)throw Error('Bundle checksum mismatch');
 const data=JSON.parse(bundle); if(data.kind!=='question-bundle'||!Array.isArray(data.questions)||!data.questions.length)throw Error('Expected a question bundle');
 const env=resolveServiceEnvironment(config);
 const token=env.CEPTLENS_CONTENT_TOKEN?.trim()||readFileSync(resolve(paths.content,'runtime/content-admin-token.txt'),'utf8').trim();
 const portIndex=config.argv.indexOf('--port'); const port=portIndex>=0?config.argv[portIndex+1]:'8765';
 if(!/^\d{1,5}$/.test(port))throw Error('Invalid service port');
 const response=await fetch(`http://127.0.0.1:${port}/api/content/questions/import`,{method:'POST',headers:{'Content-Type':'application/json','X-Content-Admin-Token':token},body:bundle,signal:AbortSignal.timeout(240000)});
 const result=await response.json(); if(!response.ok||!result.ok)throw Error(`Publication rejected (${response.status}): ${result.error}`);
 console.log(JSON.stringify({ok:true,imported:result.imported,ids:result.ids,sha256:request.sha256}));
}else{
 if(typeof request.userId!=='string'||!/^[0-9a-f-]{36}$/.test(request.userId))throw Error('Use the registered account ID from its profile page');
 const database=resolve(paths.data,'ceptlens.sqlite'); if(!existsSync(database))throw Error('Existing account database not found');
 const store=openCommunityStore(database);
 try{const accounts=createAccountService(store.db);const user=accounts.setRole(request.userId,request.operation==='grant-developer'?'developer':'learner');console.log(JSON.stringify({ok:true,user}));}finally{store.close();}
}
