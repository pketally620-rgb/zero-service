import test from 'node:test';
import assert from 'node:assert/strict';
import {BookingStore} from './core.mjs';
import {bookingWording} from './ux.mjs';
test('R2.1 wording follows actual request/confirm/change/cancel transitions without exposing raw states',()=>{
 const store=new BookingStore([{id:'S1'},{id:'S2'}]);
 const b=store.request('S1',{});
 const check=()=>{const text=bookingWording(b);assert.doesNotMatch(JSON.stringify(text),/OPEN|PENDING|CONFIRMED|CANCELLED|→/);return text;};
 assert.equal(check().change,'更改申請時段');assert.equal(check().cancel,'撤回預約需求');
 store.confirm(b.id);assert.equal(check().status,'預約已確認');assert.equal(check().cancel,'申請取消預約');
 assert.ok(check().actionNote.includes('立即生效'));
 store.change(b.id,'S2');assert.equal(check().change,'更改申請時段');assert.match(check().detail,/尚未成立正式預約/);
 store.cancel(b.id);assert.equal(check().status,'預約需求已撤回');assert.equal(check().cancel,null);
 const c=store.request('S1',{});store.confirm(c.id);store.cancel(c.id);assert.equal(bookingWording(c).status,'預約已取消');
 assert.equal(store.slots[0].status,'OPEN');assert.equal(store.slots[1].status,'OPEN');
});
