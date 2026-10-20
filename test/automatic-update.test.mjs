import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {automaticUpdate,updatePolicy,automaticPaths,compatibleStable} from '../npm/automatic-update.mjs';
import {checkUpdate} from '../npm/update.mjs';
import {pkg} from '../npm/runtime.mjs';
import {mediaFixture} from './media-fixture.mjs';
const root=path.resolve(import.meta.dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-auto-'));
const env={...process.env};let count=0;
test.beforeEach(()=>{process.env.CLOUD_HUG_STATE_DIR=path.join(temp,'state-'+count++);delete process.env.CLOUD_HUG_AUTO_UPDATE;});
test.afterEach(()=>{for(const k of Object.keys(process.env))if(!(k in env))delete process.env[k];Object.assign(process.env,env);});
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
const latest=(available=pkg.version)=>({ok:true,current:pkg.version,available,updateAvailable:available!==pkg.version,tag:'latest'});
const services=extra=>({owner:'global-npm',now:()=>1000000,check:async()=>latest(),...extra});
const patch=()=>{const v=pkg.version.split('.').map(Number);v[2]++;return v.join('.');};
test('default detection is persistent, throttled and notification-only',async()=>{
 let calls=0;const svc=services({check:async()=>{calls++;return latest(patch());},install:()=>{throw Error('notification must not install');}});
 assert.equal(updatePolicy().policy.mode,'notify');
 assert.equal((await automaticUpdate({},svc)).state,'update-available');
 assert.equal((await automaticUpdate({},svc)).cached,true);assert.equal(calls,1);
 await automaticUpdate({force:true},svc);assert.equal(calls,2);
 await automaticUpdate({},services({...svc,now:()=>1000000+24*3600000}));assert.equal(calls,3);
});
test('off/environment overrides and owner-managed installations avoid registry and writes',async()=>{
 const svc=services({check:()=>{throw Error('must not check');}});
 process.env.CLOUD_HUG_AUTO_UPDATE='0';assert.equal((await automaticUpdate({},svc)).state,'disabled');assert.equal(fs.existsSync(automaticPaths().dir),false);
 delete process.env.CLOUD_HUG_AUTO_UPDATE;assert.equal((await automaticUpdate({},services({owner:'source-or-parent'}))).state,'owner-managed');assert.equal(fs.existsSync(automaticPaths().dir),false);
 updatePolicy({mode:'off'});assert.equal((await automaticUpdate({},svc)).state,'disabled');
});
test('offline checks back off and pass a bounded timeout to registry detection',async()=>{
 let calls=0;const svc=services({check:async(_registry,options)=>{calls++;assert.equal(options.timeoutMs,2000);return {ok:false,code:'REGISTRY_UNAVAILABLE'};}});
 assert.equal((await automaticUpdate({},svc)).state,'offline');assert.equal((await automaticUpdate({},svc)).cached,true);assert.equal(calls,1);
 await automaticUpdate({},services({...svc,now:()=>1300000}));assert.equal(calls,2);
 const check=await checkUpdate(async(_url,o)=>{assert.ok(o.signal instanceof AbortSignal);throw Error('offline');},{timeoutMs:2000});assert.equal(check.ok,false);
});
test('concurrent automatic checks have one registry request',async()=>{
 let finish,calls=0;const svc=services({check:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
 const first=automaticUpdate({},svc);assert.equal((await automaticUpdate({},svc)).state,'busy');assert.equal(calls,1);finish(latest());await first;assert.equal(fs.existsSync(automaticPaths().lock),false);
});
test('explicit auto policy reuses installer for compatible updates and same-version Skill repair',async()=>{
 const saved=updatePolicy({mode:'auto'});assert.equal(saved.policy.mode,'auto');let calls=0;
 const install=(check,options)=>{calls++;assert.equal(options.resolution?.target,'selected');return {ok:true,changed:true,packageChanged:check.updateAvailable,verified:true,version:check.available};};
 const first=await automaticUpdate({resolution:{target:'selected'}},services({check:async()=>latest(patch()),install}));assert.equal(first.packageChanged,true);assert.equal(first.reloadSkill,true);
 const repair=await automaticUpdate({force:true,resolution:{target:'selected'}},services({install}));assert.equal(repair.changed,true);assert.equal(repair.packageChanged,false);assert.equal(calls,2);
});
test('compatibility boundaries and notify policy never install an incompatible release',async()=>{
 assert.equal(compatibleStable('0.5.1','0.5.0'),true);assert.equal(compatibleStable('0.6.0','0.5.0'),false);assert.equal(compatibleStable('1.9.0','1.1.0'),true);assert.equal(compatibleStable('2.0.0','1.9.0'),false);assert.equal(compatibleStable('1.1.0-beta.1','1.0.0'),false);
 updatePolicy({mode:'auto'});const r=await automaticUpdate({},services({check:async()=>latest('99.0.0'),install:()=>{throw Error('must not install');}}));assert.equal(r.state,'manual-update-required');
});
test('policy changes are validated and backed up; malformed state stays untouched',async()=>{
 assert.throws(()=>updatePolicy({intervalHours:0}),{code:'AUTO_POLICY_INVALID'});assert.throws(()=>updatePolicy({intervalHours:NaN}),{code:'AUTO_POLICY_INVALID'});
 updatePolicy({mode:'auto'});const r=updatePolicy({mode:'notify',intervalHours:1});assert.ok(fs.existsSync(r.backup));assert.equal(JSON.parse(fs.readFileSync(r.backup)).policy.mode,'auto');
 const paths=automaticPaths();fs.writeFileSync(paths.policy,'user-owned malformed data');assert.equal((await automaticUpdate({},services())).code,'AUTO_STATE_INVALID');assert.equal(fs.readFileSync(paths.policy,'utf8'),'user-owned malformed data');
});
test('a forged standing-authorization policy and corrupted cache cannot trigger installation',async()=>{
 updatePolicy({mode:'auto'});const p=automaticPaths().policy,record=JSON.parse(fs.readFileSync(p));record.authorizedAutomaticInstall=false;fs.writeFileSync(p,JSON.stringify(record));assert.equal((await automaticUpdate({},services())).code,'AUTO_POLICY_INVALID');
 updatePolicy({mode:'notify'});await automaticUpdate({},services());const c=automaticPaths().cache;fs.writeFileSync(c,'malformed');let checked=false;const r=await automaticUpdate({},services({check:async()=>{checked=true;return latest();}}));assert.equal(r.code,'AUTO_STATE_INVALID');assert.equal(checked,false);assert.equal(fs.readFileSync(c,'utf8'),'malformed');
});
test('safe ownership/edit conflicts defer; uncertain rollback stops the task',async()=>{
 updatePolicy({mode:'auto'});
 const run=code=>automaticUpdate({force:true},services({install:()=>{throw Object.assign(Error(code),{code});}}));
 assert.equal((await run('SKILL_EDITED')).ok,true);assert.equal((await run('UPDATE_BUSY')).state,'deferred');assert.equal((await run('ROLLBACK_REQUIRED')).ok,false);
});
test('policy CLI requires standing authorization and help/version/source never check the network',()=>{
 const cli=args=>spawnSync(process.execPath,[path.join(root,'npm/cli.mjs'),...args],{encoding:'utf8',env:process.env});
 assert.notEqual(cli(['update','policy','--mode','auto']).status,0);
 assert.notEqual(cli(['update','policy','--interval-hours','wrong','--yes']).status,0);
 assert.equal(cli(['update','policy','--mode','auto','--yes']).status,0);
 for(const args of [['version'],['skill','source'],['doctor','--help'],['update','auto','--help']])assert.equal(cli(args).status,0);
 assert.equal(fs.existsSync(automaticPaths().cache),false);
});
test('doctor resumes using the newly installed CLI instead of stale loaded modules',()=>{
 const dir=fs.mkdtempSync(path.join(temp,'continuation-'));
 for(const folder of ['npm','skills','node_modules/yaml'])fs.cpSync(path.join(root,folder),path.join(dir,folder),{recursive:true});
 for(const file of ['package.json','capabilities.json'])fs.copyFileSync(path.join(root,file),path.join(dir,file));
 fs.writeFileSync(path.join(dir,'npm/automatic-update.mjs'),`import fs from 'node:fs';import path from 'node:path';import {root,pkg} from './runtime.mjs';export const updatePolicy=()=>({});export async function automaticUpdate(){if(process.env.CLOUD_HUG_AUTO_UPDATE==='0')return {ok:true,state:'disabled'};const p={...pkg,version:'0.4.99'};fs.writeFileSync(path.join(root,'package.json'),JSON.stringify(p));return {ok:true,packageChanged:true,changed:true,receipt:{version:p.version}};}`);
 const media=mediaFixture(path.join(dir,'media'));
 const r=spawnSync(process.execPath,[path.join(dir,'npm/cli.mjs'),'doctor','--json'],{encoding:'utf8',env:{...process.env,CLOUD_HUG_MEDIA_ROOT:media}});
 assert.equal(r.status,0,r.stderr+r.stdout);const d=JSON.parse(r.stdout);assert.equal(d.version,'0.4.99');assert.equal(d.automaticUpdate.packageChanged,true);assert.equal(d.ok,true);
});

test('ordinary doctor entry performs cached automatic detection through the actual global-owner CLI',()=>{
 const dir=path.join(fs.mkdtempSync(path.join(temp,'ordinary-entry-')),'prefix','lib','node_modules','@petercjl','cloud-hug-style-transfer');fs.mkdirSync(dir,{recursive:true});
 for(const folder of ['npm','skills','node_modules/yaml'])fs.cpSync(path.join(root,folder),path.join(dir,folder),{recursive:true});
 for(const file of ['package.json','capabilities.json'])fs.copyFileSync(path.join(root,file),path.join(dir,file));
 const media=mediaFixture(path.join(temp,'ordinary-media'));
 const cli=args=>{const r=spawnSync(process.execPath,[path.join(dir,'npm/cli.mjs'),...args],{encoding:'utf8',env:{...process.env,CLOUD_HUG_MEDIA_ROOT:media}});assert.equal(r.status,0,r.stdout+r.stderr);return JSON.parse(r.stdout);};
 const policy=cli(['update','policy','--mode','notify','--yes']);const cache=path.join(path.dirname(policy.policyFile),'cache.json');
 fs.writeFileSync(cache,JSON.stringify({schemaVersion:1,package:pkg.name,checkedAt:Date.now(),response:latest(patch())}),{flag:'wx'});
 const d=cli(['doctor','--json']);assert.equal(d.automaticUpdate.state,'update-available');assert.equal(d.automaticUpdate.cached,true);assert.equal(d.owner,'global-npm');assert.equal(d.ok,true);
 const diagnostic=cli(['doctor','--no-auto-update','--json']);assert.equal(diagnostic.automaticUpdate,undefined);
});
