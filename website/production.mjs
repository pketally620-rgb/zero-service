import {createCandidate} from './server.mjs';
import {isAbsolute} from 'node:path';
import {existsSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const database=process.env.ZERO_DATABASE;
if(!database||!isAbsolute(database)||!existsSync(database))throw Error('Existing absolute ZERO_DATABASE required');
const check=new DatabaseSync(database,{readOnly:true});
try{
  const state=JSON.parse(check.prepare('SELECT json FROM state WHERE id=1').get().json);
  if(state.schema!==1||state.dataClass!=='APPROVED_LAUNCH_PREPARATION'||check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Approved launch database required');
}finally{check.close();}
const {server}=createCandidate({database,origin:'https://zerocraft.tw',trustedLocalProxy:true});
server.listen(4198,'127.0.0.1');
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{
  server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),15000).unref();
});
