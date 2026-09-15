import {DatabaseSync, backup} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {vehicles, services, BookingStore} from './domain.mjs';
import {launchPolicy} from './policy.mjs';

export function openStore(filename, {fixtures=false}={}) {
  mkdirSync(dirname(filename), {recursive:true, mode:0o700});
  const db = new DatabaseSync(filename, {timeout:5000});
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, role TEXT NOT NULL, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, time TEXT NOT NULL, action TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
  if(!db.prepare('SELECT id FROM state WHERE id=1').get()) {
    const data={schema:1, revision:1, dataClass:fixtures?'SYNTHETIC_PREVIEW':'APPROVED_LAUNCH_PREPARATION', policy:launchPolicy, vehicles:fixtures?structuredClone(vehicles):[], services:structuredClone(services),
      slots:[],bookings:[],sequence:1,content:{
        featured:{title:'觀看拋光施工紀錄 ↗',url:'https://www.instagram.com/p/DIyYGx8S_6j/',enabled:true},
        cases:[{id:'matte',title:'Tesla 消光系列 ↗',url:'https://www.instagram.com/p/DSthtORkoGq/',enabled:true},{id:'wash',title:'車況與方案說明 ↗',url:'https://www.instagram.com/p/DSeURmLEjlu/',enabled:true}],
        links:{facebook:'https://www.facebook.com/LANDGTW',instagram:'https://www.instagram.com/xpel_hsinchu_zhubei/',maps:'https://maps.app.goo.gl/7R4MEFphwXHfXgYY6',line:'https://lin.ee/y8kjBXa',lineAccount:'@udu6260e'}}};
    // Controlled fixtures only. Routine dates are subsequently managed by Owner.
    if(fixtures)for(let day=1;day<=3;day++){const date=new Date(Date.now()+day*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'});for(const time of ['10:00','13:30','15:30'])data.slots.push({id:`${date}-${time}`,date,time,status:'OPEN',bookingId:null});}
    db.prepare('INSERT INTO state VALUES(1,?)').run(JSON.stringify(data));
  }
  const read=()=>JSON.parse(db.prepare('SELECT json FROM state WHERE id=1').get().json);
  const mutate=(fn,action)=>{db.exec('BEGIN IMMEDIATE');try{const s=read();const result=fn(s);s.revision++;db.prepare('UPDATE state SET json=? WHERE id=1').run(JSON.stringify(s));if(action)db.prepare('INSERT INTO audit(time,action) VALUES(?,?)').run(new Date().toISOString(),action);db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}};
  return {db,read,mutate,close:()=>db.close(),backup:path=>backup(db,path)};
}
export function bookingStore(data){const b=new BookingStore([]);b.slots=data.slots;b.bookings=new Map(data.bookings.map(x=>[x.id,x]));b.sequence=data.sequence;return b;}
export function saveBookings(data,b){data.slots=b.slots;data.bookings=[...b.bookings.values()];data.sequence=b.sequence;}
