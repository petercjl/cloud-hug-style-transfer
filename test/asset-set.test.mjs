import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assetFixture} from './asset-fixture.mjs';
import {assetDependency,inspectAssetSet,selectAssetReferences} from '../skills/cloud-hug-style-transfer/scripts/asset-set.mjs';
import * as life from '../lifecycle/engine.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
function setup(t){const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cloud-assets-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const skillRoot=assetFixture(path.join(dir,'product-asset-set'));return {dir,skillRoot};}
function guide(dir,skillRoot,roles=['overall','scale','texture']){
 const assets=path.join(dir,'assets');fs.mkdirSync(assets);
 const images=roles.map((role,i)=>{const file=role+'.png';fs.writeFileSync(path.join(assets,file),png,{flag:'wx'});return {id:'A0'+(i+1),file,role,use:'Contract test',when:'Matching product',limits:'Synthetic fixture'};});
 const plan=path.join(dir,'plan.json');fs.writeFileSync(plan,JSON.stringify({product:'Fixture',version:'v1',images}),{flag:'wx'});
 const r=spawnSync(process.execPath,[path.join(skillRoot,'.runtime/bin/product-asset-set.mjs'),'asset','write','--directory',assets,'--plan',plan,'--json'],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);return path.join(assets,'资产说明.txt');
}
test('real callee handoff checks hashes and ordered mandatory scale selection',t=>{
 const {dir,skillRoot}=setup(t),g=guide(dir,skillRoot);const before=fs.readFileSync(g);const set=inspectAssetSet(g,{skillRoot});assert.equal(set.ok,true,JSON.stringify(set));assert.equal(set.dependency.version,'0.1.3');assert.equal(set.visualAcceptance,'requires-image-review-and-user-confirmation');
 const chosen=selectAssetReferences(set,['A02','A03']);assert.deepEqual(chosen.references.map(i=>[i.id,i.referenceIndex]),[['A02',1],['A03',2]]);
 assert.equal(selectAssetReferences(set,['A03']).code,'SCALE_ASSET_REQUIRED');assert.equal(selectAssetReferences(set,['A02']).code,'PRODUCT_ASSET_REQUIRED');for(const ids of [['A01','A01'],['A02','A99']])assert.equal(selectAssetReferences(set,ids).code,'INVALID_ASSET_SELECTION');assert.deepEqual(fs.readFileSync(g),before);
 fs.appendFileSync(path.join(dir,'assets/overall.png'),'tamper');assert.equal(inspectAssetSet(g,{skillRoot}).code,'ASSET_GUIDE_INVALID');
});
test('new complete sets reject historical two-role sets',t=>{const {dir,skillRoot}=setup(t);assert.equal(inspectAssetSet(guide(dir,skillRoot,['overall','scale']),{skillRoot}).code,'ASSET_SET_INCOMPLETE');});
test('missing and incompatible callee pause rather than generating a fallback',t=>{const {dir,skillRoot}=setup(t);assert.equal(assetDependency({skillRoot:path.join(dir,'missing')}).code,'DEPENDENCY_MISSING');const p=path.join(skillRoot,'.runtime/package.json');const value=JSON.parse(fs.readFileSync(p));value.version='0.1.2';fs.writeFileSync(p,JSON.stringify(value));assert.equal(assetDependency({skillRoot}).code,'DEPENDENCY_INCOMPATIBLE');});
test('installed caller resolves current host sibling and enforces selection through real CLI',t=>{
 const {dir,skillRoot}=setup(t),g=guide(dir,skillRoot);const target=path.join(dir,'cloud-hug-style-transfer');life.install(life.resolveTarget({agent:'generic',path:target}));
 const invoke=ids=>spawnSync(process.execPath,[path.join(target,'scripts/run.mjs'),'assets','select','--guide',g,'--ids',ids,'--json'],{encoding:'utf8',env:{...process.env,CLOUD_HUG_AUTO_UPDATE:'0',CLOUD_HUG_PRODUCT_ASSET_SKILL_ROOT:''}});
 const result=invoke('A02,A01');assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(JSON.parse(result.stdout).references[0].role,'scale');const missing=invoke('A03');assert.equal(missing.status,1);assert.equal(JSON.parse(missing.stdout).code,'SCALE_ASSET_REQUIRED');
});
