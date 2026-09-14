import {mkdir,copyFile,access} from 'node:fs/promises';import {constants} from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {fileURLToPath} from 'node:url';import {resolve,join} from 'node:path';import {openStore} from './store.mjs';
const root=fileURLToPath(new URL('private/',import.meta.url));await mkdir(root,{recursive:true,mode:0o700});const command=process.argv[2];
if(command==='backup'){await access(join(root,'candidate.sqlite'));const s=openStore(join(root,'candidate.sqlite'));try{const path=join(root,'backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite');await s.backup(path);console.log(path);}finally{s.close();}}
else if(command==='restore-copy'){
 if(!process.argv[3]||!process.argv[4])throw Error('Usage: node website/ops.mjs restore-copy SOURCE NEW_TARGET');
 const source=resolve(process.argv[3]),target=resolve(process.argv[4]);if(source===target)throw Error('Restore must use a new target');
 const check=new DatabaseSync(source,{readOnly:true});try{if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||JSON.parse(check.prepare('SELECT json FROM state WHERE id=1').get().json).schema!==1)throw Error('Restore validation failed');}finally{check.close();}
 await copyFile(source,target,constants.COPYFILE_EXCL);const restored=new DatabaseSync(target);try{restored.exec('DELETE FROM sessions; DELETE FROM limits;');console.log('Validated restore copy; sessions revoked: '+target);}finally{restored.close();}
}else throw Error('Use backup or restore-copy; no live overwrite command exists.');

