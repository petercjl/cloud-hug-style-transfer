import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonRow } from '../npm/canvas-layout.mjs';
const input=(extra={})=>({run_id:'test-run',row_index:1,top:0,source:{url:'https://example.com/source.png',width:1200,height:1800},result:{url:'https://example.com/result.png',width:1200,height:1800},...extra});
const box=media=>media.placement.positions[0];
test('each row has separate original-left and result-right images with exact compact spacing',()=>{
 const row=comparisonRow(input()),[left,right]=row.batch.media.map(box);
 assert.equal(row.batch.media.length,2);assert.equal(left.x,0);assert.equal(right.x,504);
 assert.equal(right.x-(left.x+left.width),24);assert.equal(left.y,right.y);assert.equal(row.next_top-(right.y+right.height),32);
 assert.equal(row.batch.media[0].urls[0],'https://example.com/source.png');assert.equal(row.batch.media[1].urls[0],'https://example.com/result.png');
});
test('tall and wide source images fit the result row without cropping, distortion or row overlap',()=>{
 for(const [sw,sh,rw,rh] of [[1000,20000,1200,1200],[20000,1000,1000,2000],[1,1,1600,900]]){
  const row=comparisonRow(input({source:{url:'https://example.com/s',width:sw,height:sh},result:{url:'https://example.com/r',width:rw,height:rh}}));
  const [s,r]=row.batch.media.map(box);assert.ok(Math.abs(s.width/s.height-sw/sh)<1e-8);assert.ok(Math.abs(r.width/r.height-rw/rh)<1e-8);
  assert.ok(s.x>=0&&s.x+s.width<=480);assert.ok(s.height<=r.height+1e-8);
  const next=comparisonRow(input({row_index:2,top:row.next_top}));assert.equal(box(next.batch.media[1]).y-r.height,32);assert.ok(box(next.batch.media[0]).y>s.y+s.height);
 }
});
test('same row replays identically; another row repeats its original with distinct stable IDs',()=>{
 const a=comparisonRow(input()),b=comparisonRow(input());assert.deepEqual(a,b);
 const next=comparisonRow(input({row_index:2,top:a.next_top}));
 assert.notEqual(a.batch.media[0].id,next.batch.media[0].id);assert.equal(a.batch.media[0].urls[0],next.batch.media[0].urls[0]);
 const details={prompt:'Follow references',model:'selected-model'};
 assert.deepEqual(comparisonRow(input({result:{...input().result,generationParams:details}})).batch.media[1].generationParams,details);
});
test('invalid/unmeasured assets, non-HTTP URLs and unsafe geometry fail before canvas writes',()=>{
 for(const patch of [{row_index:0},{top:-1},{run_id:'bad/key'},{source:{...input().source,width:0}},{result:{...input().result,url:'file:///tmp/a.png'}},{source:{...input().source,url:'https://user:pass@example.com/a.png'}},{result:{...input().result,height:undefined}}])assert.throws(()=>comparisonRow(input(patch)),{code:'INVALID_INPUT'});
 assert.throws(()=>comparisonRow(input({result:{...input().result,width:1,height:1000000}})),{code:'LAYOUT_UNSUPPORTED'});
});
