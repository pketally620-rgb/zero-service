set -euo pipefail
umask 077
export PATH=/home/zero-web-eng/work/private-runtime-r1/node-v24.19.0-linux-x64/bin:$PATH
systemctl --user stop zero-web-r44 zero-web-r44-smoke
for port in 4196 4198 4199; do if ss -ltn | grep -q ":$port "; then echo UNEXPECTED_LISTENER; exit 1; fi; done
node --input-type=module <<'JS'
import {readFileSync,writeFileSync,mkdirSync,rmdirSync,statSync} from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {execFileSync} from 'node:child_process';import {R2,sha} from '/home/zero-web-eng/work/r2-backup-r2/core.mjs';
const root='/home/zero-web-eng/work/r44-integration',r2root='/home/zero-web-eng/work/r2-backup-r2',manifest=JSON.parse(readFileSync(root+'/SOURCE_IDENTITY.json')),backup=JSON.parse(readFileSync(root+'/BACKUP.json')),recovery=JSON.parse(readFileSync(root+'/RECOVERY.json'));
if(recovery.result!=='PASS')throw Error('RECOVERY_NOT_PASSED');for(const [p,h] of Object.entries(manifest.files))if(sha(readFileSync(root+'/release/'+p))!==h)throw Error('SOURCE_DRIFT');
const expected={ 'core.mjs':'2496992243c93c7110e35cd11a0add68d64e114e7d9dbc16be9319489c75d095','runner.mjs':'94825ad6a3ea3e7133b2886fed763265070b7bd256a5995588ce49801c585e4b','schedule.sh':'f41843897f5f4f6103ae1ac1e3ba958e699ae096f421d3edc40990ef5977f233'};for(const [f,h]of Object.entries(expected))if(sha(readFileSync(r2root+'/'+f))!==h)throw Error('R2_CODE_CHANGED');
if(sha(execFileSync('crontab',['-l']))!==sha(readFileSync(r2root+'/crontab-final')))throw Error('SCHEDULE_CHANGED');
const lock=r2root+'/operation.lock';mkdirSync(lock,{mode:0o700});try{if(!/^validation\/r44-[a-f0-9]{16}\.r2b$/.test(backup.key))throw Error('INVALID_CLEANUP_KEY');const r2=new R2(JSON.parse(readFileSync(r2root+'/credential.json')),r2root+'/ledger.json');await r2.remove(backup.key);if((await r2.list()).some(o=>o.key===backup.key))throw Error('CLEANUP_FAILED');}finally{rmdirSync(lock);}
const d=new DatabaseSync(root+'/launch.sqlite');d.exec('DELETE FROM sessions; DELETE FROM limits;');const json=d.prepare('SELECT json FROM state WHERE id=1').get().json,s=JSON.parse(json),prep=JSON.parse(readFileSync(root+'/PREPARATION.json'));if(sha(json)!==prep.launchStateHash||s.vehicles.length!==422||s.bookings.length||s.slots.length)throw Error('LAUNCH_CONTAMINATION');const integrity=d.prepare('PRAGMA integrity_check').get().integrity_check;d.close();
const result={result:'PASS',release:manifest.commit,sourceHashesMatch:true,sourceFiles:Object.keys(manifest.files).length,launchStateHash:sha(json),launch:{vehicles:422,bookings:0,slots:0,sessions:0,schema:s.schema,dataClass:s.dataClass},privateDirectoryMode:(statSync(root).mode&0o777).toString(8),dbMode:(statSync(root+'/launch.sqlite').mode&0o777).toString(8),integrity,servicesStopped:true,r2CodeAndScheduleUnchanged:true,r2ValidationObjectRemoved:true,scheduledSource:'existing R1 synthetic database; NOT switched to R4.4',activationRequiredBeforeFutureServing:true};writeFileSync(root+'/FINAL.json',JSON.stringify(result),{mode:0o600});console.log(JSON.stringify(result));
JS
node /home/zero-web-eng/work/r2-backup-r2/runner.mjs status
ss -ltn
