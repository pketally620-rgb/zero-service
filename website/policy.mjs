// Root.4 R4 OWNER POLICY DECISION R1. No automatic PENDING cancellation.
export const launchPolicy = Object.freeze({authority:'issue-5-5677868342',bookingRetentionDays:90,securityRetentionDays:30,backupRetentionDays:14,pending:'manual-next-business-day',hours:'週一至週六 09:00–18:00；12:00–13:00 休息；週日公休，例外由 ZERO 人員確認。'});
export function pendingReviewAt(iso) {
  const t=Date.parse(iso);if(!Number.isFinite(t))return null;
  const d=new Date(t+8*3600000);d.setUTCDate(d.getUTCDate()+1);
  if(d.getUTCDay()===0)d.setUTCDate(d.getUTCDate()+1);
  d.setUTCHours(10,0,0,0);return d.toISOString(); // Taipei 18:00; holidays require staff review.
}
export function retain(store, now=Date.now()) {
  const day=86400000,result={bookings:0,audit:0,limits:0,sessions:0,missingTerminalAnchor:0};
  store.db.exec('BEGIN IMMEDIATE');
  try {
    const s=store.read();const removed=new Set();
    s.bookings=s.bookings.filter(b=>{
      // Only actual cancellation/completion anchors qualify. Past scheduled time alone is not completion.
      const terminal=b.status==='CANCELLED'?b.cancelledAt:b.endedAt;
      if(!terminal){if(b.status==='CANCELLED')result.missingTerminalAnchor++;return true;}
      if(b.status==='PENDING')return true;
      const t=Date.parse(terminal);if(Number.isFinite(t)&&t<=now-90*day){removed.add(b.id);return false;}return true;
    });
    result.bookings=removed.size;
    if(removed.size){for(const slot of s.slots)if(removed.has(slot.bookingId)){slot.bookingId=null;slot.status='CLOSED';}s.revision++;store.db.prepare('UPDATE state SET json=? WHERE id=1').run(JSON.stringify(s));}
    result.audit=Number(store.db.prepare('DELETE FROM audit WHERE time <= ?').run(new Date(now-30*day).toISOString()).changes);
    result.limits=Number(store.db.prepare('DELETE FROM limits WHERE until <= ?').run(now).changes);
    result.sessions=Number(store.db.prepare('DELETE FROM sessions WHERE expires <= ?').run(now).changes);
    store.db.exec('COMMIT');return result;
  }catch(e){store.db.exec('ROLLBACK');throw e;}
}
export function rotateAdminHash(store, encoded, now=Date.now()) {
  if(!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(encoded))throw Error('Invalid credential hash');
  store.db.exec('BEGIN IMMEDIATE');try{
    store.db.prepare("INSERT OR REPLACE INTO settings VALUES('admin-password',?)").run(encoded);
    const revoked=Number(store.db.prepare("DELETE FROM sessions WHERE role='admin'").run().changes);
    store.db.prepare("INSERT OR REPLACE INTO settings VALUES('admin-rotated-at',?)").run(new Date(now).toISOString());
    store.db.prepare('INSERT INTO audit(time,action) VALUES(?,?)').run(new Date(now).toISOString(),'admin:credential-rotation');
    store.db.exec('COMMIT');return {revoked};
  }catch(e){store.db.exec('ROLLBACK');throw e;}
}
