import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {planInventory} from '../skills/cloud-hug-style-transfer/scripts/plan-inventory.mjs';
import * as life from '../lifecycle/engine.mjs';

const groups=[{id:'moon',variants:['moon-white','moon-yellow']},{id:'star',variants:['star-blue']}];

test('brand upgrade counts colors as cards and defaults to one plan and output per page',()=>{
 const result=planInventory({groups});
 assert.equal(result.product_cards,3);
 assert.equal(result.shape_groups,2);
 assert.equal(result.all_page_count,11);
 assert.equal(result.selected_photo_slots,18);
 assert.equal(result.mode,'pages');
 assert.equal(result.output_count,11);
 assert.ok(result.outputs.every(o=>o.slot==='page'));
 assert.ok(result.outputs.every(o=>o.direction==='A'));
 assert.deepEqual(result.pages.filter(p=>p.group_id).map(p=>p.page_id),['07_moon','07_star']);
 assert.equal(new Set(result.outputs.map(o=>o.file_key)).size,11);
 assert.equal(new Set(result.outputs.map(o=>o.page_id)).size,11);
 assert.equal(result.generation_authorized,false);
 assert.ok(result.pages.every(p=>!['01','02','16','17','18','19'].includes(p.template)));
});

test('selected pages keep one direction unless multiple directions are explicitly requested',()=>{
 const selected_pages=['07_moon','12'];
 const split=planInventory({groups,selected_pages,mode:'assets'});
 assert.equal(split.output_count,7);
 const complete=planInventory({groups,selected_pages});
 assert.equal(complete.output_count,2);
 assert.ok(complete.outputs.every(o=>o.slot==='page'));
 assert.equal(complete.generation_authorized,false);
 const directions=['A','B','C'];
 const multipleSplit=planInventory({groups,selected_pages,mode:'assets',directions});
 assert.equal(multipleSplit.output_count,21);
 for(const direction of directions)assert.equal(multipleSplit.outputs.filter(o=>o.direction===direction).length,7);
 const multipleComplete=planInventory({groups,selected_pages,directions});
 assert.equal(multipleComplete.output_count,6);
 assert.ok(multipleComplete.outputs.every(o=>o.slot==='page'));
});

test('single-shape mushroom set needs ten detail images regardless of color count',()=>{
 const expected=['03','04','05','06','07_mushroom','11','12','13','14','15'];
 for(const variants of [['mushroom-caramel'],['mushroom-caramel','mushroom-cream']]){
  const result=planInventory({groups:[{id:'mushroom',variants}]});
  assert.equal(result.product_cards,variants.length);
  assert.equal(result.selected_photo_slots,15);
  assert.equal(result.output_count,10);
  assert.deepEqual(result.outputs.map(item=>item.page_id),expected);
  assert.equal(result.outputs.filter(item=>item.page_id==='12').length,1);
  assert.equal(result.generation_authorized,false);
 }
});

test('page inventory rejects duplicate product ids, excluded pages and unsupported modes',()=>{
 for(const input of [
  {groups:[]},
  {groups:[groups[0],groups[0]]},
  {groups:[groups[0],{id:'star',variants:['moon-white']}]},
  {groups,selected_pages:['01']},
  {groups,selected_pages:['12','12']},
  {groups,mode:'both'}
 ])assert.throws(()=>planInventory(input));
});

test('explicit single direction does not expand the requested paid-image inventory',()=>{
 const result=planInventory({groups,selected_pages:['03','12'],directions:['A']});
 assert.equal(result.output_count,2);
 assert.ok(result.outputs.every(item=>item.direction==='A'));
 assert.equal(result.generation_authorized,false);
 for(const directions of [[],['A','A'],['../escape'],[1]])assert.throws(()=>planInventory({groups,directions}));
});

test('four-grid defaults to one output with four content slots without a scheme selection',()=>{
 const result=planInventory({groups,selected_pages:['12']});
 assert.equal(result.selected_photo_slots,4);
 assert.equal(result.output_count,1);
 assert.deepEqual(result.pages[0].slots,['top-left','top-right','bottom-left','bottom-right']);
 assert.equal(result.outputs[0].file_key,'12_A_page');
 assert.equal(result.generation_authorized,false);
});

test('installed Skill runs its inventory helper and owning runtime outside the checkout',t=>{
 const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-brand-upgrade-')));
 const previous=process.env.CLOUD_HUG_STATE_DIR;
 process.env.CLOUD_HUG_STATE_DIR=path.join(temp,'state');
 t.after(()=>{if(previous===undefined)delete process.env.CLOUD_HUG_STATE_DIR;else process.env.CLOUD_HUG_STATE_DIR=previous;fs.rmSync(temp,{recursive:true,force:true});});
 const target=path.join(temp,'installed');
 assert.equal(life.install(life.resolveTarget({agent:'test-host',path:target})).current,true);
 const input=path.join(temp,'inventory.json');
 fs.writeFileSync(input,'\uFEFF'+JSON.stringify({groups,selected_pages:['12']}));
 const env={...process.env,PATH:temp,CLOUD_HUG_AUTO_UPDATE:'0'};
 const run=spawnSync(process.execPath,[path.join(target,'scripts/plan-inventory.mjs'),'--input',input],{cwd:temp,env,encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 assert.equal(JSON.parse(run.stdout).output_count,1);
 const version=spawnSync(process.execPath,[path.join(target,'scripts/run.mjs'),'version','--json'],{cwd:temp,env,encoding:'utf8'});
 assert.equal(version.status,0,version.stderr);
 assert.equal(JSON.parse(version.stdout).version,life.pkg.version);
 const invalid=spawnSync(process.execPath,[path.join(target,'scripts/plan-inventory.mjs'),'--unknown'],{cwd:temp,env,encoding:'utf8'});
 assert.equal(invalid.status,1);
 assert.equal(JSON.parse(invalid.stderr).code,'INVALID_INPUT');
});
