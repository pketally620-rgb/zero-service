import {readFileSync,writeFileSync,mkdirSync,rmdirSync,renameSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';import {DatabaseSync} from 'node:sqlite';import {spawnSync} from 'node:child_process';
process.umask(0o077);const root='/home/zero-web-eng/work/r46-integration',r2='/home/zero-web-eng/work/r2-backup-r2',sha=b=>createHash('sha256').update(b).digest('hex'),release='3a329c71e8ec959ba1008f0b3e69dbcfaeaff495';
if(existsSync(root+'/TRANSITION.json'))throw Error('TRANSITION_ALREADY_RECORDED');
const db=new DatabaseSync(root+'/launch.sqlite',{readOnly:true});const json=db.prepare('SELECT json FROM state WHERE id=1').get().json,s=JSON.parse(json);if(s.dataClass!=='APPROVED_LAUNCH_PREPARATION'||s.slots.length||s.bookings.length||db.prepare('SELECT count(*) n FROM sessions').get().n||sha(json)!=='b3c5c8b0e5fd4ce31e187d29ac2a4c422f1c1d5edded87f230bd18ef7f3840db')throw Error('LAUNCH_NOT_CLEAN');db.close();
if(readFileSync(root+'/release/RELEASE_SHA','utf8').trim()!==release)throw Error('SOURCE_RELEASE');
const old=readFileSync(r2+'/runner.mjs','utf8');if(sha(old)!=='94825ad6a3ea3e7133b2886fed763265070b7bd256a5995588ce49801c585e4b'||sha(readFileSync(r2+'/core.mjs'))!=='2496992243c93c7110e35cd11a0add68d64e114e7d9dbc16be9319489c75d095')throw Error('R2_BASELINE');
const next=old.replace("base='/home/zero-web-eng/work/private-runtime-r1'","base='/home/zero-web-eng/work/r46-integration'").replace("release='ee14e23274c17cd7a4fe61496a51697b589d84dc',dbpath=base+'/release/website/private/candidate.sqlite'",`release='${release}',dbpath=base+'/launch.sqlite'`);
if(next===old||next.includes("dbpath=base+'/release/website/private/candidate.sqlite'"))throw Error('ADAPTER');
writeFileSync(root+'/runner-candidate.mjs',next);if(spawnSync(process.execPath,['--check',root+'/runner-candidate.mjs']).status!==0)throw Error('SYNTAX');
const tests=spawnSync(process.execPath,['--test',r2+'/core.test.mjs'],{encoding:'utf8'});writeFileSync(root+'/R2_TEST_RESULTS.txt',tests.stdout+tests.stderr);if(tests.status!==0)throw Error('GUARD_TESTS');
mkdirSync(r2+'/operation.lock',{mode:0o700});try{
 const prior=JSON.parse(readFileSync(r2+'/status.json'));if(prior.release!=='ee14e23274c17cd7a4fe61496a51697b589d84dc'||prior.result!=='PASS')throw Error('PRIOR_STATUS');
 writeFileSync(root+'/runner-before.mjs',old,{flag:'wx'});writeFileSync(root+'/status-before.json',JSON.stringify(prior),{flag:'wx'});
 const controls={};for(const name of ['core.mjs','schedule.sh','units/zero-r2-backup.service','units/zero-r2-monitor.service'])controls[name]=sha(readFileSync(r2+'/'+name));const cron=spawnSync('crontab',['-l'],{encoding:'utf8'});if(cron.status!==0)throw Error('CRON');writeFileSync(root+'/crontab-before.txt',cron.stdout);
 writeFileSync(r2+'/runner-r46.tmp',next);renameSync(r2+'/runner-r46.tmp',r2+'/runner.mjs');
 // New source has not yet been protected. Preserve prior-source attempt evidence separately;
 // initialize once under this explicit transition, without changing the daily guard or global ledger.
 writeFileSync(r2+'/status-r46.tmp',JSON.stringify({result:'AWAITING_NEW_SOURCE_BACKUP',sourceTransitionAt:new Date().toISOString(),expectedRelease:release,previousSource:{release:prior.release,lastAttempt:prior.lastAttempt,lastSuccess:prior.lastSuccess,key:prior.key}}));renameSync(r2+'/status-r46.tmp',r2+'/status.json');
 const result={release,source:root+'/launch.sqlite',priorRelease:prior.release,priorSource:'/home/zero-web-eng/work/private-runtime-r1/release/website/private/candidate.sqlite',oldRunnerSha256:sha(old),newRunnerSha256:sha(next),unchangedControls:controls,crontabSha256:sha(cron.stdout),launchStateHash:sha(json),oneTimeNewSourceStatusInitialization:true,priorStatusArchived:true,dailyGuardUnchanged:true,globalOperationLedgerNotReset:true};writeFileSync(root+'/TRANSITION.json',JSON.stringify(result));console.log(JSON.stringify(result));
}finally{rmdirSync(r2+'/operation.lock');}
