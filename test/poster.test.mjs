import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestPoster, MANUAL_MESSAGE } from '../src/services/poster.mjs';
const user={id:1,role:'organizer'},image={image:'aW1hZ2U=',mimeType:'image/png'};
const valid={title:'Club meetup',date:new Date(Date.now()+86400000).toISOString(),location:'TU Sofia, Library'};
test('AC-7 missing key provides manual entry without calling the model',async()=>{
 let called=false;const result=await suggestPoster(user,image,{key:'',client:()=>{called=true;}});
 assert.equal(result.suggestion,null);assert.equal(result.message,MANUAL_MESSAGE);assert.equal(called,false);
});
test('AC-16 injected fake returns validated suggestions and no extra fields',async()=>{
 const result=await suggestPoster(user,image,{key:'fake',client:async()=>({...valid,userId:999})});
 assert.deepEqual(result.suggestion,valid);
});
test('AC-16 fake nonsense, nonexistent venue, invalid date, no answer and timeout fall back',async()=>{
 for(const output of [null,{}, {...valid,title:''},{...valid,title:'<script>'},{...valid,title:'a'.repeat(161)}, {...valid,date:42},{...valid,date:'2027-02-30T00:00:00.000Z'},{...valid,date:'2000-01-01T00:00:00.000Z'}, {...valid,location:'Imaginary room'}]) {
  assert.equal((await suggestPoster(user,image,{key:'fake',client:async()=>output})).suggestion,null);
 }
 assert.equal((await suggestPoster(user,image,{key:'fake',client:async()=>{throw new Error('429');}})).suggestion,null);
 let signal;const timed=await suggestPoster(user,image,{key:'fake',timeoutMs:5,client:args=>{signal=args.signal;return new Promise(()=>{});}});
 assert.equal(timed.suggestion,null);assert.equal(signal.aborted,true);
 for(const invalid of [{image:'!',mimeType:'image/png'},{image:'',mimeType:'image/png'},{image:7,mimeType:'image/png'},{image:'a'.repeat(2800001),mimeType:'image/png'},{image:'abcd',mimeType:'text/plain'}]) assert.equal((await suggestPoster(user,invalid,{key:'fake'})).suggestion,null);
 await assert.rejects(()=>suggestPoster(null,image),e=>e.status===401);
 await assert.rejects(()=>suggestPoster({role:'member'},image),e=>e.status===403);
});
