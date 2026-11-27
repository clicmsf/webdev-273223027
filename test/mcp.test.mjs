import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, upsertDemoUser } from '../src/data/db.mjs';
import { authenticate } from '../src/services/auth.mjs';

test('Exercise 1: malformed messages return protocol errors and the same server keeps running', () => {
 const request=(id,method,params)=>({jsonrpc:'2.0',id,method,params});
 const messages=[
  '{broken', null, [], {jsonrpc:'2.0',id:[],method:'tools/list'},
  request(1,'tools/call',null), request(2,'tools/call',[]),
  request(3,'tools/call',{name:'find_lecture',arguments:null}),
  request(4,'tools/call',{name:'find_lecture',arguments:[]}),
  request(5,'tools/call',{name:'find_lecture',arguments:{number:'5'}}),
  request(6,'tools/call',{name:'register_for_event',arguments:{eventId:'1'}}),
  request(7,'tools/call',{name:'register_for_event',arguments:{}}),
  request(8,'tools/call',{name:'register_for_event',arguments:{eventId:0}}),
  {jsonrpc:'2.0',method:'initialize',params:{}},
  {jsonrpc:'2.0',method:'notifications/initialized'},
  request(9,'tools/call',{name:'find_lecture',arguments:{number:99}}),
  request(10,'no_such_method',{}),
  request(11,'tools/call',{name:'find_lecture',arguments:{number:5}})
 ];
 const result=spawnSync(process.execPath,['mcp-server/server.js'],{
  env:{...process.env,DB_PATH:':memory:',CLUB_SESSION_TOKEN:''},encoding:'utf8',timeout:5000,
  input:messages.map(m=>typeof m==='string'?m:JSON.stringify(m)).join('\n')+'\n'
 });
 assert.equal(result.error,undefined);
 assert.equal(result.status,0,result.stderr);
 const replies=result.stdout.trim().split('\n').map(line=>JSON.parse(line));
 assert.equal(replies.length,15,'notifications must produce no output');
 assert.deepEqual(replies.slice(0,4).map(r=>[r.id,r.error.code]),[
  [null,-32700],[null,-32600],[null,-32600],[null,-32600]
 ]);
 for(let id=1;id<=8;id++) assert.equal(replies.find(r=>r.id===id).error.code,-32602);
 assert.equal(replies.find(r=>r.id===9).result.isError,true);
 assert.equal(replies.find(r=>r.id===10).error.code,-32601);
 assert.match(replies.find(r=>r.id===11).result.content[0].text,/Lecture 5:/);
});

test('AC-8 MCP uses shared capacity rule and validates session identity',async t=>{
 const folder=mkdtempSync(join(tmpdir(),'club-mcp-')); const filename=join(folder,'test.db');
 const db=openDatabase(filename); await upsertDemoUser(db,'test-only-password');
 db.prepare('UPDATE events SET capacity=1 WHERE id=1').run();
 const session=await authenticate(db,'student@example.test','test-only-password');
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
