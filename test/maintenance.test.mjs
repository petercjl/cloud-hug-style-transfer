import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import * as life from '../lifecycle/engine.mjs';
const temp=t=>{const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'managed-lifecycle-')));const key=life.config.env+'_STATE_DIR',prev=process.env[key];process.env[key]=path.join(dir,'state');t.after(()=>{if(prev===undefined)delete process.env[key];else process.env[key]=prev;fs.rmSync(dir,{recursive:true,force:true});});return dir;};
const target=(dir,name='target')=>life.resolveTarget({agent:'future-agent',path:path.join(dir,name)});
const run=(args,env={})=>spawnSync(process.execPath,[path.join(life.root,life.config.entry),...args],{encoding:'utf8',timeout:90000,env:{...process.env,[life.config.env+'_AUTO_UPDATE']:'0',...env}});

test('selected target explicit precedence and historical flag translation',t=>{
 const dir=temp(t);const r=life.resolveTarget({agent:'future-agent',path:path.join(dir,'explicit')},{[life.config.env+'_SKILL_PATH']:path.join(dir,'env')});assert.equal(r.selection_source,'--path');assert.equal(r.target,path.join(dir,'explicit'));
 const parent=path.join(dir,'parent');const result=run(['skill','install','--agent','future-agent','--root',parent,'--mode','link','--json']);assert.equal(result.status,0,result.stdout+result.stderr);const body=JSON.parse(result.stdout);assert.equal(body.target,path.join(parent,life.config.skill));assert.equal(fs.lstatSync(body.target).isSymbolicLink(),false);
});
test('operation status is target scoped, read-only and preserves failure diagnostics',t=>{
 const dir=temp(t),r=target(dir);life.install(r);const m=path.join(r.target,'.agent-package.json'),v=JSON.parse(fs.readFileSync(m));v.version='0.0.0';fs.writeFileSync(m,JSON.stringify(v));
 assert.throws(()=>life.install(r,{rename:()=>{throw Object.assign(Error('failure'),{code:'EIO'});}}));const state=life.operationStatus(r);assert.equal(state.stage,'failed');assert(state.backup);assert.equal(state.skillComplete,false);assert.equal(state.error.code,'EIO');assert(fs.existsSync(path.join(state.backup,'SKILL.md')));
 const before=life.inventory(path.dirname(r.target));life.operationStatus(r,state.id);assert.deepEqual(life.inventory(path.dirname(r.target)),before);assert.throws(()=>life.operationStatus(target(dir,'other'),state.id),{code:'OPERATION_NOT_FOUND'});
});

test('generic and arbitrary named hosts require explicit own destination before any mutation',t=>{
 const dir=temp(t);for(const agent of ['generic','codex','sealseek','future-agent']){
  assert.throws(()=>life.resolveTarget({agent}),{code:'TARGET_PATH_REQUIRED'});
  assert.equal(life.resolveTarget({agent,path:path.join(dir,agent)}).agent,agent);
 }
 for(const agent of ['../host','Bad Agent','__proto__',''])assert.throws(()=>life.resolveTarget({agent,path:path.join(dir,'x')}),{code:'INVALID_TARGET'});
 assert.throws(()=>life.resolveTarget({path:dir,root:dir}),{code:'CONFLICTING_TARGET'});
 const before=fs.readdirSync(dir);const r=run(['update','install','--yes','--agent','future-agent','--json']);assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).code,'TARGET_PATH_REQUIRED');assert.deepEqual(fs.readdirSync(dir),before);
});
test('bootstrap source, duplicate and unknown arguments are read-only',t=>{
 const dir=temp(t),r=run(['skill','source','--json']);assert.equal(r.status,0,r.stderr+r.stdout);const body=JSON.parse(r.stdout);assert.equal(body.source,life.source);assert.equal(body.installationLifecycle.agentNeutral,true);
 for(const a of [['skill','install','--path',dir,'--path',dir],['skill','install','--wat'],['skill','install','--path'],['skill','source','--root',dir],['skill','install','extra','--path',dir]])assert.equal(run(a).status,1,JSON.stringify(a));
 assert.equal(run(['skill','install','--help']).status,0);assert.deepEqual(fs.readdirSync(dir),[]);
});

test('read-only status and version reject mutating or unknown flags before writing',t=>{
 const dir=temp(t),before=fs.readdirSync(dir);const r=run(['update','status','--path',path.join(dir,'target'),'--mode','auto','--yes']);assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).code,'INVALID_ARGUMENT');assert.deepEqual(fs.readdirSync(dir),before);
 const version=run(['version','--unknown']);assert.equal(version.status,1);assert.equal(JSON.parse(version.stdout).code,'INVALID_ARGUMENT');
});

test('doctor preserves an explicit legacy root and verifies the selected generic target',async t=>{
 const dir=temp(t),resolution=life.resolveTarget({agent:'future-agent',root:dir});life.install(resolution);const {mediaFixture}=await import('./media-fixture.mjs');const media=mediaFixture(path.join(dir,'media-dependency'));
 const r=run(['doctor','--agent','future-agent','--root',dir,'--json'],{CLOUD_HUG_MEDIA_ROOT:media});assert.equal(r.status,0,r.stdout+r.stderr);const value=JSON.parse(r.stdout);assert.equal(value.installation.current,true);assert.equal(value.resolution.target,resolution.target);
});

test('doctor honors per-command automatic-update opt-out in an installed runtime',async t=>{
 const dir=temp(t),resolution=target(dir);life.install(resolution);const {mediaFixture}=await import('./media-fixture.mjs');const media=mediaFixture(path.join(dir,'required-media')),hits=path.join(dir,'hits.txt'),preload=path.join(dir,'registry-fixture.mjs');fs.writeFileSync(hits,'',{flag:'wx'});
 fs.writeFileSync(preload,`import fs from 'node:fs';globalThis.fetch=async()=>{fs.appendFileSync(${JSON.stringify(hits)},'check');return new Response(JSON.stringify({name:'@petercjl/cloud-hug-style-transfer',version:'99.0.0'}));};`,{flag:'wx'});
 const {pathToFileURL}=await import('node:url');const r=spawnSync(process.execPath,[path.join(resolution.target,'scripts/run.mjs'),'doctor','--no-auto-update','--json'],{encoding:'utf8',env:{...process.env,CLOUD_HUG_AUTO_UPDATE:'1',CLOUD_HUG_MEDIA_ROOT:media,NODE_OPTIONS:'--import '+JSON.stringify(pathToFileURL(preload).href)},timeout:30000});assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(fs.readFileSync(hits,'utf8'),'');
});
