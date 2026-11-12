import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mediaDependency} from '../npm/media-dependency.mjs';
import {mediaFixture} from './media-fixture.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-media-'));
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
test('missing selected Skill pauses generation without using another host',()=>{
 const env={...process.env,CLOUD_HUG_AUTO_UPDATE:'0',CLOUD_HUG_TOAPIS_SKILL_ROOT:path.join(tmp,'absent')};
 assert.equal(mediaDependency({env}).code,'DEPENDENCY_MISSING');
 const r=spawnSync(process.execPath,[fileURLToPath(new URL('../npm/cli.mjs',import.meta.url)),'doctor','--json'],{encoding:'utf8',env});
 const d=JSON.parse(r.stdout);assert.equal(r.status,1);assert.equal(d.code,'DEPENDENCY_MISSING');assert.equal(d.generation.state,'paused');assert.equal(d.integrity.ok,true);
});
test('managed discovery uses active Node, capabilities only and no credential',()=>{
 const root=mediaFixture(path.join(tmp,'valid'));
 const d=mediaDependency({skillRoot:root,env:{...process.env,PATH:tmp}});
 assert.equal(d.ok,true);assert.equal(d.invocation.command,process.execPath);assert.equal(d.source,fs.realpathSync(root));assert.equal(d.serviceAccess,'requires-live-preflight');assert.equal(d.generationTested,false);
});
test('Skill-only copy and old runtime cannot pass verification',()=>{
 const root=mediaFixture(path.join(tmp,'no-runtime'));fs.renameSync(path.join(root,'.runtime'),path.join(root,'removed-runtime'));
 assert.equal(mediaDependency({skillRoot:root}).code,'DEPENDENCY_INVALID');
 assert.equal(mediaDependency({skillRoot:mediaFixture(path.join(tmp,'old'),{version:'0.1.0'})}).code,'DEPENDENCY_INCOMPATIBLE');
});
test('wrong identity and failed executable are rejected',()=>{
 const root=mediaFixture(path.join(tmp,'wrong'));const file=path.join(root,'.runtime/package.json');const p=JSON.parse(fs.readFileSync(file));p.name='other';fs.writeFileSync(file,JSON.stringify(p));
 assert.equal(mediaDependency({skillRoot:root}).code,'DEPENDENCY_INVALID');
 const broken=mediaFixture(path.join(tmp,'broken'));fs.writeFileSync(path.join(broken,'.runtime/dist/cli.mjs'),'process.exit(1)');assert.equal(mediaDependency({skillRoot:broken}).code,'DEPENDENCY_INVALID');
});
test('multiple references and recovery by directory are required, canvas is not',()=>{
 for(const [label,options] of [['single-ref',{repeatable:false}],['no-recovery',{missingCommand:'task wait'}]]){
  const root=mediaFixture(path.join(tmp,label),options);assert.equal(mediaDependency({skillRoot:root}).code,'DEPENDENCY_INCOMPATIBLE');
 }
 assert.equal(mediaDependency({skillRoot:mediaFixture(path.join(tmp,'no-canvas'))}).ok,true);
});
test('standalone preflight resolves only its own sibling toapiscli Skill',()=>{
 const parent=path.join(tmp,'host-skills'),app=path.join(parent,'cloud-hug-style-transfer/scripts');fs.mkdirSync(app,{recursive:true});
 for(const f of ['check-media.mjs','media-dependency.mjs'])fs.copyFileSync(fileURLToPath(new URL('../skills/cloud-hug-style-transfer/scripts/'+f,import.meta.url)),path.join(app,f));
 const media=mediaFixture(path.join(parent,'toapiscli'));
 const env={...process.env};delete env.CLOUD_HUG_TOAPIS_SKILL_ROOT;
 const r=spawnSync(process.execPath,[path.join(app,'check-media.mjs')],{encoding:'utf8',env});assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(JSON.parse(r.stdout).source,fs.realpathSync(media));
});
