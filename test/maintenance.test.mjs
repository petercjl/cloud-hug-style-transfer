import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-maintenance-'));
test.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
const cli=(args,env={})=>spawnSync(process.execPath,[path.join(root,'npm/cli.mjs'),...args],{encoding:'utf8',env:{...process.env,CLOUD_HUG_STATE_DIR:path.join(temp,'state'),CODEX_HOME:path.join(temp,'codex-home'),CODEX_SKILLS_DIR:path.join(temp,'host-skills'),...env}});
test('unknown options fail before any target writes',()=>{
 const r=cli(['skill','install','--path',path.join(temp,'wrong'),'--json']);
 assert.notEqual(r.status,0);assert.equal(JSON.parse(r.stdout).code,'INVALID_ARGUMENT');
 assert.equal(fs.existsSync(path.join(temp,'host-skills')),false);
});
test('command help is read-only and declares root semantics',()=>{
 const r=cli(['skill','install','--help','--json']);assert.equal(r.status,0);
 const result=JSON.parse(r.stdout);assert.equal(result.command,'skill install');assert.ok(result.options['--root'].description.includes('parent'));
 assert.equal(fs.existsSync(path.join(temp,'host-skills')),false);
});
test('duplicate, missing, contradictory and boolean values fail',()=>{
 for(const args of [['skill','status','--root'],['skill','status','--agent','codex','--agent','sealseek'],['update','install','--yes','false'],['skill','source','--root','x'],['doctor','--root','x']])assert.notEqual(cli(args).status,0,JSON.stringify(args));
});

import { resolveTarget, install, status } from '../npm/skills.mjs';
import { installUpdate } from '../npm/update.mjs';
import { pkg } from '../npm/runtime.mjs';
import { parse as parseYaml } from 'yaml';
const marker='.cloud-hug-style-transfer-managed.json';
const isolate=fn=>{
 const saved={...process.env};
 try{Object.assign(process.env,{CLOUD_HUG_STATE_DIR:path.join(temp,'lifecycle-state'),CODEX_HOME:path.join(temp,'home'),CODEX_SKILLS_DIR:path.join(temp,'host-skills'),SEALSEEK_SKILLS_DIR:path.join(temp,'sealseek-skills'),WORKBUDDY_SKILLS_DIR:path.join(temp,'workbuddy-skills')});return fn();}
 finally{for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);}
};
test('host skills environment precedence and conflicts are explicit',()=>isolate(()=>{
 const r=resolveTarget('codex');assert.equal(r.resolvedFrom,'CODEX_SKILLS_DIR');assert.ok(r.warnings.length);
 const explicit=resolveTarget('codex',path.join(temp,'explicit'));assert.equal(explicit.resolvedFrom,'--root');assert.equal(explicit.root,path.join(temp,'explicit'));
 for(const agent of ['sealseek','workbuddy'])assert.equal(resolveTarget(agent).resolvedFrom,agent.toUpperCase()+'_SKILLS_DIR');
}));
test('same-version stale Skill and legacy UI metadata reconcile with backup then verified no-op',()=>isolate(()=>{
 const resolution=resolveTarget('codex',path.join(temp,'reconcile'));install(resolution.target);
 const m=path.join(resolution.target,marker),record=JSON.parse(fs.readFileSync(m));record.version='0.0.0';fs.writeFileSync(m,JSON.stringify(record));
 const ui=path.join(resolution.target,'agents/openai.yaml');let text=fs.readFileSync(ui,'utf8').replace('display_name: 抱抱云朵社风格转换','display_name: 私人展示名').replace('  - atlas','  - api\n  - atlas');fs.writeFileSync(ui,text+'\n# my custom UI\n');
 assert.equal(status(resolution.target).current,false);
 const result=installUpdate({ok:true,available:pkg.version},{resolution,npm:()=>{throw Error('same-version must not call npm');}});
 assert.equal(result.packageChanged,false);assert.equal(result.changed,true);assert.equal(result.verified,true);assert.equal(result.skills.length,1);
 assert.ok(fs.existsSync(path.join(result.skills[0].backup,'agents/openai.yaml')));
 const current=fs.readFileSync(ui,'utf8'),parsed=parseYaml(current);assert.equal(parsed.interface.display_name,'私人展示名');assert.ok(current.includes('# my custom UI'));assert.ok(!parsed.policy.products.includes('api'));
 const repeat=installUpdate({ok:true,available:pkg.version},{resolution});assert.equal(repeat.changed,false);assert.ok(repeat.timingsMs.skills>=0);assert.equal(repeat.skills[0].current,true);
}));
test('same-version defaults reconcile registered targets without creating absent host targets',()=>isolate(()=>{
 const registered=resolveTarget('sealseek',path.join(temp,'registered'));install(registered.target);
 const file=path.join(registered.target,marker),record=JSON.parse(fs.readFileSync(file));record.version='0.0.0';fs.writeFileSync(file,JSON.stringify(record));
 const r=installUpdate({ok:true,available:pkg.version});assert.ok(r.skills.some(s=>s.target===registered.target&&s.changed));assert.equal(fs.existsSync(process.env.SEALSEEK_SKILLS_DIR),false);
}));
test('metadata conflicts and edited/unmanaged targets refuse before mutation',()=>isolate(()=>{
 const resolution=resolveTarget('codex',path.join(temp,'conflict'));install(resolution.target);
 const ui=path.join(resolution.target,'agents/openai.yaml');const text=fs.readFileSync(ui,'utf8');fs.writeFileSync(ui,text.replace('  - atlas','  - invented-product'));
 assert.throws(()=>installUpdate({ok:true,available:pkg.version},{resolution}),{code:'SKILL_METADATA_INVALID'});assert.ok(fs.readFileSync(ui,'utf8').includes('invented-product'));
 fs.writeFileSync(ui,text);fs.appendFileSync(path.join(resolution.target,'SKILL.md'),'user edit');
 assert.throws(()=>installUpdate({ok:true,available:pkg.version},{resolution}),{code:'SKILL_EDITED'});
 const unmanaged=resolveTarget('codex',path.join(temp,'unmanaged'));fs.mkdirSync(unmanaged.target,{recursive:true});assert.throws(()=>installUpdate({ok:true,available:pkg.version},{resolution:unmanaged}),{code:'SKILL_UNMANAGED'});
 assert.equal(fs.existsSync(path.join(process.env.CLOUD_HUG_STATE_DIR,'update.lock')),false);
}));
test('source ownership and update lock protect package replacement',()=>isolate(()=>{
 assert.throws(()=>installUpdate({ok:true,available:'99.0.0'}),{code:'UPDATE_OWNER_REQUIRED'});
 const lock=path.join(process.env.CLOUD_HUG_STATE_DIR,'update.lock');fs.mkdirSync(lock);try{assert.throws(()=>installUpdate({ok:true,available:pkg.version}),{code:'UPDATE_BUSY'});}finally{fs.rmdirSync(lock);}
}));

function replacementFixture(mode) {
 const dir=fs.mkdtempSync(path.join(temp,'package-replacement-'));
 for(const folder of ['npm','skills','node_modules/yaml'])fs.cpSync(path.join(root,folder),path.join(dir,folder),{recursive:true});
 for(const name of ['package.json','capabilities.json'])fs.copyFileSync(path.join(root,name),path.join(dir,name));
 const script=`import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
 const {installUpdate}=await import('./npm/update.mjs');const {install,resolveTarget,status}=await import('./npm/skills.mjs');
 const {pkg}=await import('./npm/runtime.mjs');const resolution=resolveTarget('codex');install(resolution.target);
 const mode=process.env.TEST_REPLACEMENT_MODE;let calls=[];const run=args=>{calls.push(args);if(args[0]==='pack'){const backup=args[args.indexOf('--pack-destination')+1];fs.writeFileSync(path.join(backup,'old.tgz'),'verified fixture archive');return JSON.stringify([{filename:'old.tgz'}]);}
 const p=JSON.parse(fs.readFileSync('package.json'));if(args.at(-1).endsWith('old.tgz')){p.version=pkg.version;fs.writeFileSync('package.json',JSON.stringify(p));return '';}
 p.version='99.0.0';fs.writeFileSync('package.json',JSON.stringify(p));if(mode==='install-failure')throw Error('injected npm failure');return '';};
 let injected=false;const {spawnSync}=await import('node:child_process');const spawn=(...a)=>{if(mode==='sync-failure'&&!injected){injected=true;return {status:1,stdout:JSON.stringify({ok:false,code:'fixture'})};}return spawnSync(...a);};
 if(mode==='success'){const r=installUpdate({ok:true,available:'99.0.0'},{resolution,prefix:path.resolve('prefix'),npm:run,spawn});assert.equal(r.packageChanged,true);assert.equal(r.skills[0].version,'99.0.0');assert.ok(fs.existsSync(r.backup));}
 else{assert.throws(()=>installUpdate({ok:true,available:'99.0.0'},{resolution,prefix:path.resolve('prefix'),npm:run,spawn}));assert.equal(JSON.parse(fs.readFileSync('package.json')).version,pkg.version);assert.equal(status(resolution.target).current,true);assert.ok(calls.some(a=>a.at(-1).endsWith('old.tgz')));}
 assert.equal(fs.existsSync(path.join(process.env.CLOUD_HUG_STATE_DIR,'update.lock')),false);console.log('replacement fixture passed');`;
 const r=spawnSync(process.execPath,['--input-type=module','-e',script],{cwd:dir,encoding:'utf8',env:{...process.env,CLOUD_HUG_STATE_DIR:path.join(dir,'state'),CODEX_SKILLS_DIR:path.join(dir,'target'),TEST_REPLACEMENT_MODE:mode}});
 assert.equal(r.status,0,r.stderr+r.stdout);
}
for(const mode of ['success','install-failure','sync-failure'])test('package replacement and recovery: '+mode,()=>replacementFixture(mode));
