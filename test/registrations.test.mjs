import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, upsertDemoUser, hashPassword } from '../src/data/db.mjs';
import { reservePlace, cancelReservation, myRegistrations } from '../src/services/registrations.mjs';
function fixture(t) {
 const db=openDatabase(':memory:'); t.after(()=>db.close()); upsertDemoUser(db,'test-only-password');
 db.prepare('INSERT INTO users(email,password_hash) VALUES (?,?)').run('second@example.test',hashPassword('test-only-password'));
 db.prepare('UPDATE events SET capacity=1 WHERE id=1').run(); return db;
}
const refusal=(name,status)=>e=>e.name===name && e.status===status;
test('AC-2 AC-3 service refuses a full event without adding a row',t=>{
 const db=fixture(t); const r=reservePlace(db,1,1); assert.equal(r.user_id,1);
 assert.throws(()=>reservePlace(db,2,1),refusal('EventFull',409));
 assert.equal(db.prepare('SELECT count(*) AS n FROM registrations').get().n,1);
});
test('AC-12 service rejects duplicate before capacity with no extra row',t=>{
 const db=fixture(t); reservePlace(db,1,1);
 assert.throws(()=>reservePlace(db,1,1),refusal('AlreadyRegistered',409));
 assert.equal(myRegistrations(db,1).length,1);
});
test('AC-4 AC-13 only the owner cancels; cancellation frees a place',t=>{
 const db=fixture(t); const a=reservePlace(db,1,1); const b=reservePlace(db,2,2);
 assert.throws(()=>cancelReservation(db,2,a.id),refusal('NotOwner',403));
 assert.throws(()=>cancelReservation(db,null,a.id),refusal('Unauthenticated',401));
 assert.equal(myRegistrations(db,1).length,1);
 cancelReservation(db,1,a.id); assert.equal(myRegistrations(db,1).length,0);
 assert.equal(myRegistrations(db,2)[0].id,b.id);
 assert.equal(reservePlace(db,2,1).event_id,1);
});
test('AC-14 service handles invalid ids, missing and past events and missing cancellations',t=>{
 const db=fixture(t);
 assert.throws(()=>reservePlace(db,null,1),refusal('Unauthenticated',401));
 assert.throws(()=>myRegistrations(db,null),refusal('Unauthenticated',401));
 for(const id of [0,-1,1.5,'1',null]) assert.throws(()=>reservePlace(db,1,id),refusal('InvalidInput',422));
 assert.throws(()=>cancelReservation(db,1,0),refusal('InvalidInput',422));
 assert.throws(()=>cancelReservation(db,1,999),refusal('NotFound',404));
 assert.throws(()=>reservePlace(db,1,999),refusal('NotFound',404));
 db.prepare("UPDATE events SET start_at='2000-01-01T00:00:00.000Z' WHERE id=1").run();
 assert.throws(()=>reservePlace(db,1,1),refusal('EventPast',409));
});
