import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdirSync,rmSync,rmdirSync,statSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {randomBytes} from 'node:crypto';
import {R2,seal,sha,checkStorage,prunePlan,saveJSON,MAX_PACKAGE} from './core.mjs';
const root=dirname(new URL(import.meta.url).pathname),base='/home/zero-web-eng/work/r46-integration';
const release='3a329c71e8ec959ba1008f0b3e69dbcfaeaff495',dbpath=base+'/launch.sqlite';
const action=process.argv[2]||'backup',statusFile=join(root,'status.json'),lock=join(root,'operation.lock');
let locked=false,snapshot;
function state(){return JSON.parse(readFileSync(statusFile,'utf8'));}
function output(x){console.log(JSON.stringify(x));}
try{
 if(action==='status'){
  const s=state(),age=s.lastSuccess?(Date.now()-Date.parse(s.lastSuccess))/3600000:null;
  const ok=Number.isFinite(age)&&age>=0&&age<=26&&s.result==='PASS';output({monitor:ok?'PASS':'ALERT',ageHours:age,lastCode:s.code||null});if(!ok)process.exitCode=1;
 }else{
  mkdirSync(lock,{mode:0o700});locked=true;
  const c=JSON.parse(readFileSync(join(root,'credential.json'),'utf8')),r2=new R2(c,join(root,'ledger.json'));
  if(action==='probe'){output({access:'PASS',objects:await r2.list()});}
  else if(action==='backup'){
   const prior=state(),today=new Date().toISOString().slice(0,10);if(prior.lastAttempt?.startsWith(today))throw Error('DAILY_ATTEMPT_STOP');
   saveJSON(statusFile,{...prior,lastAttempt:new Date().toISOString(),result:'RUNNING'});
   if(readFileSync(base+'/release/RELEASE_SHA','utf8').trim()!==release)throw Error('RELEASE_INVALID');
   const objects=await r2.list();checkStorage(objects,0);
   snapshot=join(root,'snapshot-'+randomBytes(8).toString('hex')+'.sqlite');
   const source=new DatabaseSync(dbpath,{readOnly:true,timeout:5000});try{const pages=source.prepare('PRAGMA page_count').get().page_count,bytes=source.prepare('PRAGMA page_size').get().page_size;if(pages*bytes>MAX_PACKAGE-4096)throw Error('PACKAGE_LIMIT');await backup(source,snapshot);}finally{source.close();}
   if(statSync(snapshot).size>MAX_PACKAGE-4096)throw Error('PACKAGE_LIMIT');
   const check=new DatabaseSync(snapshot,{readOnly:true});let identity;
   try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('INTEGRITY_INVALID');const json=check.prepare('SELECT json FROM state WHERE id=1').get().json,s=JSON.parse(json);if(s.schema!==1)throw Error('SCHEMA_INVALID');identity={release,schema:s.schema,revision:s.revision,stateHash:sha(json),created:new Date().toISOString()};}finally{check.close();}
   const data=seal(readFileSync(snapshot),readFileSync(join(root,'recovery-public.pem')),identity);checkStorage(objects,data.length);
   const key='daily/'+today+'-'+randomBytes(8).toString('hex')+'.r2b';await r2.put(key,data);
   const downloaded=await r2.get(key);if(sha(downloaded)!==sha(data))throw Error('REMOTE_HASH_INVALID');
   const after=await r2.list();if(!after.some(x=>x.key===key&&x.size===data.length))throw Error('REMOTE_IDENTITY_INVALID');
   const pruned=prunePlan(after);for(const x of pruned)await r2.remove(x.key);
   const result={...state(),result:'PASS',code:null,lastSuccess:new Date().toISOString(),key,bytes:data.length,packageHash:sha(data),...identity,pruned:pruned.length};saveJSON(statusFile,result);output(result);
  }else if(action==='download'){
   const s=state();if(s.result!=='PASS'||!s.key)throw Error('NO_VALIDATED_BACKUP');const data=await r2.get(s.key);if(sha(data)!==s.packageHash)throw Error('REMOTE_HASH_INVALID');
   const dest=join(root,'recovery-download.r2b');writeFileSync(dest,data,{mode:0o600,flag:'wx'});output({download:'PASS',bytes:data.length,hash:sha(data)});
  }else if(action==='prune-test'){
   const key='validation/'+randomBytes(8).toString('hex')+'.r2b';const dummy=seal(Buffer.from('synthetic retention probe'),readFileSync(join(root,'recovery-public.pem')),{release,schema:1,created:new Date().toISOString()});checkStorage(await r2.list(),dummy.length);
   await r2.put(key,dummy);if(sha(await r2.get(key))!==sha(dummy))throw Error('PROBE_HASH_INVALID');await r2.remove(key);if((await r2.list()).some(x=>x.key===key))throw Error('PRUNE_FAILED');output({retentionObjectRoundTrip:'PASS'});
  }else if(action==='failure-test'){
   // Explicit fault injection exercises failure visibility without network or source DB mutation.
   throw Error('INJECTED_FAILURE');
  }else throw Error('ACTION_INVALID');
 }
}catch(e){
 const code=/^[A-Z0-9_]+$/.test(e.message)?e.message:'OPERATION_FAILED';
 // A second caller must not overwrite the active caller's status.
 let old={};try{old=state();}catch{}
 if(code==='DAILY_ATTEMPT_STOP'&&old.result==='PASS'){output({backup:'SKIP',code});}
 else{if(locked)saveJSON(statusFile,{...old,result:'FAIL',code,lastFailure:new Date().toISOString()});console.error(JSON.stringify({backup:'FAIL',code}));process.exitCode=1;}
}finally{
 if(snapshot){for(const suffix of ['','-wal','-shm'])if(existsSync(snapshot+suffix))rmSync(snapshot+suffix);}
 if(locked)rmdirSync(lock);
}
