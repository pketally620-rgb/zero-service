import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {openStore} from './store.mjs';
import {passwordHash} from './server.mjs';
const path=fileURLToPath(new URL('private/candidate.sqlite',import.meta.url));const s=openStore(path);
if(s.db.prepare("SELECT value FROM settings WHERE key='admin-password'").get()){console.log('Owner credential already configured; no reset performed.');s.close();}else{
 const password=randomBytes(24).toString('base64url');s.db.prepare('INSERT INTO settings VALUES(?,?)').run('admin-password',await passwordHash(password));s.close();
 await writeFile(new URL('private/OWNER_ACCESS.txt',import.meta.url),`Controlled local review only\nURL: http://127.0.0.1:4180/admin\nPassword: ${password}\nDo not upload this file. Rotate before any future promotion.\n`,{flag:'wx',mode:0o600});console.log('Configured. Review credential is in website/private/OWNER_ACCESS.txt (never served or committed).');
}

