set -euo pipefail
umask 077
export PATH=/home/zero-web-eng/work/private-runtime-r1/node-v24.19.0-linux-x64/bin:$PATH
node --input-type=module <<'JS'
import {DatabaseSync,backup} from 'node:sqlite';import {readFileSync,writeFileSync,mkdirSync,rmdirSync,statSync} from 'node:fs';import {randomBytes} from 'node:crypto';
import {R2,seal,sha,checkStorage,MAX_PACKAGE} from '/home/zero-web-eng/work/r2-backup-r2/core.mjs';
const root='/home/zero-web-eng/work/r44-integration',r2root='/home/zero-web-eng/work/r2-backup-r2',lock=r2root+'/operation.lock',release='bcd5057b02d44510b0c7efac47701c3668c2d5cd';
if(sha(readFileSync(r2root+'/core.mjs'))!=='2496992243c93c7110e35cd11a0add68d64e114e7d9dbc16be9319489c75d095')throw Error('R2_CORE_CHANGED');
mkdirSync(lock,{mode:0o700});try{
 const db=new DatabaseSync(root+'/smoke.sqlite',{readOnly:true});await backup(db,root+'/r2-snapshot.sqlite');db.close();const snap=new DatabaseSync(root+'/r2-snapshot.sqlite',{readOnly:true});const json=snap.prepare('SELECT json FROM state WHERE id=1').get().json,s=JSON.parse(json);if(s.schema!==1||s.vehicles.length!==422||snap.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('SCHEMA_INVALID');snap.close();
 if(statSync(root+'/r2-snapshot.sqlite').size>MAX_PACKAGE-4096)throw Error('PACKAGE_LIMIT');
 const identity={release,schema:s.schema,revision:s.revision,stateHash:sha(json),created:new Date().toISOString()},data=seal(readFileSync(root+'/r2-snapshot.sqlite'),readFileSync(r2root+'/recovery-public.pem'),identity);
 const client=new R2(JSON.parse(readFileSync(r2root+'/credential.json')),r2root+'/ledger.json');const objects=await client.list();checkStorage(objects,data.length);
 const key='validation/r44-'+randomBytes(8).toString('hex')+'.r2b';await client.put(key,data);const downloaded=await client.get(key);if(sha(downloaded)!==sha(data))throw Error('REMOTE_HASH_MISMATCH');
 writeFileSync(root+'/recovery.r2b',downloaded,{mode:0o600,flag:'wx'});const result={result:'PASS',key,bytes:data.length,packageHash:sha(data),...identity,source:'isolated synthetic smoke DB',productionScheduleUnchanged:true};writeFileSync(root+'/BACKUP.json',JSON.stringify(result),{mode:0o600});console.log(JSON.stringify(result));
}finally{rmdirSync(lock);}
JS
