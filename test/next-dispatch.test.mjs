import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nextDispatch} from '../skills/cloud-hug-style-transfer/scripts/next-dispatch.mjs';
const input = (extra = {}) => ({authorized:true,awaiting_user:false,pages:Array.from({length:10},(_,i)=>({page_id:String(i+3).padStart(2,'0'),state:'pending'})),...extra});
test('default selects only the first pending page and waiting prevents prefetch',()=>{
  assert.deepEqual(nextDispatch(input()).next_page_ids,['03']);
  assert.deepEqual(nextDispatch(input({awaiting_user:true})).next_page_ids,[]);
  assert.deepEqual(nextDispatch(input({authorized:false,mode:'batch'})).next_page_ids,[]);
});
test('batch caps five live tasks and replenishes only free slots',()=>{
  const v=input({mode:'batch'});assert.equal(nextDispatch(v).next_page_ids.length,5);
  v.pages.slice(0,5).forEach(p=>p.state='queued');assert.deepEqual(nextDispatch(v).next_page_ids,[]);
  v.pages[0].state='succeeded';assert.deepEqual(nextDispatch(v).next_page_ids,['08']);
  v.pages[1].state='failed';assert.deepEqual(nextDispatch(v).next_page_ids,['08','09']);
});
test('unknown submission blocks new dispatch without treating it as failed',()=>{
  const v=input({mode:'batch'});v.pages[0].state='unknown';
  assert.equal(nextDispatch(v).blocked,'recover-unknown');assert.deepEqual(nextDispatch(v).next_page_ids,[]);
});
test('completed results stay out of new work and invalid states fail closed',()=>{
  const v=input();v.pages[0].state='succeeded';assert.deepEqual(nextDispatch(v).next_page_ids,['04']);
  assert.throws(()=>nextDispatch(input({mode:'first-three'})));
  assert.throws(()=>nextDispatch(input({pages:[{page_id:'03',state:'timeout'}]})));
  assert.throws(()=>nextDispatch(input({pages:[{page_id:'03',state:'pending'},{page_id:'03',state:'running'}]})));
});
