import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, upsertDemoUser } from '../src/data/db.mjs';
import { authenticate } from '../src/services/auth.mjs';

test('AC-8 MCP uses shared capacity rule and validates session identity',async t=>{
 const folder=mkdtempSync(join(tmpdir(),'club-mcp-')); const filename=join(folder,'test.db');
 const db=openDatabase(filename); upsertDemoUser(db,'test-only-password');
 db.prepare('UPDATE events SET capacity=1 WHERE id=1').run();
 const session=authenticate(db,'student@example.test','test-only-password');
 t.after(()=>{db.close();rmSync(folder,{recursive:true,force:true});});
 async function client(token) {
  const child=spawn(process.execPath,['mcp-server/server.js'],{env:{...process.env,DB_PATH:filename,CLUB_SESSION_TOKEN:token},stdio:['pipe','pipe','pipe']});
  const lines=createInterface({input:child.stdout});let next=0;const pending=new Map();
  lines.on('line',line=>{const r=JSON.parse(line);pending.get(r.id)?.(r);pending.delete(r.id);});
  const request=(method,params={})=>new Promise(resolve=>{const id=++next;pending.set(id,resolve);child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});
  return {request,close:()=>new Promise(resolve=>{child.once('exit',resolve);child.stdin.end();})};
 }
 const c=await client(session.token);
 try {
  assert.ok((await c.request('initialize',{protocolVersion:'2024-11-05'})).result.capabilities.tools);
  const names=(await c.request('tools/list')).result.tools.map(t=>t.name);
  assert.ok(['find_lecture','search_lectures','upcoming_events','my_registrations','register_for_event'].every(n=>names.includes(n)));
  const call=(name,args={})=>c.request('tools/call',{name,arguments:args});
  const first=await call('register_for_event',{eventId:1}); assert.equal(first.result.isError,false);
  const again=await call('register_for_event',{eventId:1}); assert.equal(JSON.parse(again.result.content[0].text).status,409);
  assert.equal((await call('register_for_event',{eventId:2,userId:2})).error.code,-32602);
  assert.equal(JSON.parse((await call('my_registrations')).result.content[0].text).length,1);
  assert.equal(JSON.parse((await call('upcoming_events')).result.content[0].text)[0].free_places,0);
  // A second event with no places left proves capacity, independently of duplicates.
  db.prepare('INSERT INTO users(email,password_hash) SELECT ?,password_hash FROM users WHERE id=1').run('other@example.test');
  db.prepare('INSERT INTO registrations(user_id,event_id) VALUES (2,2)').run();
  db.prepare('UPDATE events SET capacity=1 WHERE id=2').run();
  const full=await call('register_for_event',{eventId:2}); assert.equal(JSON.parse(full.result.content[0].text).error,'EventFull');
  assert.equal(db.prepare('SELECT count(*) AS n FROM registrations WHERE event_id=2').get().n,1);
 } finally {await c.close();}
 const anonymous=await client('invalid');
 try {const r=await anonymous.request('tools/call',{name:'my_registrations'});assert.equal(JSON.parse(r.result.content[0].text).status,401);}
 finally {await anonymous.close();}
});
