import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { install, status, targetPath, source, inventory } from '../npm/skills.mjs';
import { newer, checkUpdate, globalPrefix } from '../npm/update.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-test-'));
process.env.CLOUD_HUG_STATE_DIR=path.join(sandbox,'state');
const marker='.cloud-hug-style-transfer-managed.json';
const target=name=>path.join(sandbox,name,'cloud-hug-style-transfer');
const cli=(...args)=>spawnSync(process.execPath,[path.join(repo,'npm/cli.mjs'),...args],{encoding:'utf8',env:process.env});
test.after(()=>fs.rmSync(sandbox,{recursive:true,force:true}));
test('all Agent targets are distinct; unknown Agent refused',()=>{
 for(const agent of ['codex','sealseek','workbuddy'])assert.equal(path.basename(targetPath(agent)),'cloud-hug-style-transfer');
 assert.throws(()=>targetPath('other'),{code:'INVALID_AGENT'});
});
test('fresh and repeat install preserve full image and Chinese bytes for each Agent',()=>{
 for(const agent of ['codex','sealseek','workbuddy']){
  const dest=target(agent);const first=install(dest);assert.equal(first.current,true);assert.equal(first.managed,true);
  const actual=inventory(dest);assert.deepEqual(actual,inventory(source));
  assert.ok(fs.readFileSync(path.join(dest,'SKILL.md'),'utf8').includes('抱抱云朵社'));
  assert.equal(install(dest).changed,false);
 }
});
test('unmanaged directory and symlink refuse overwrite',()=>{
 const dest=target('unmanaged');fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'keep.txt'),'owned');
 assert.throws(()=>install(dest),{code:'SKILL_UNMANAGED'});assert.equal(fs.readFileSync(path.join(dest,'keep.txt'),'utf8'),'owned');
 const link=target('symlink');fs.mkdirSync(path.dirname(link),{recursive:true});
 try{fs.symlinkSync(dest,link,process.platform==='win32'?'junction':'dir');}catch(e){if(e.code==='EPERM')return;throw e;}
 assert.throws(()=>install(link),{code:'SKILL_UNMANAGED'});
});
test('edited managed business content is preserved',()=>{
 const dest=target('edited');install(dest);const file=path.join(dest,'SKILL.md');fs.appendFileSync(file,'\nlocal user edit\n');
 assert.equal(status(dest).edited,true);assert.throws(()=>install(dest),{code:'SKILL_EDITED'});assert.ok(fs.readFileSync(file,'utf8').endsWith('local user edit\n'));
});
test('in-place update backs up whole old install and preserves custom UI metadata',()=>{
 const dest=target('upgrade');install(dest);const m=path.join(dest,marker),record=JSON.parse(fs.readFileSync(m));record.version='0.0.0';fs.writeFileSync(m,JSON.stringify(record));
 fs.appendFileSync(path.join(dest,'agents/openai.yaml'),'\n# custom UI\n');
 fs.writeFileSync(path.join(dest,'user-note.txt'),'preserve');
 const updated=install(dest);assert.ok(updated.backup);assert.ok(fs.statSync(path.join(updated.backup,'SKILL.md')).size>0);
 assert.ok(fs.readFileSync(path.join(dest,'agents/openai.yaml'),'utf8').endsWith('# custom UI\n'));
 assert.equal(fs.readFileSync(path.join(dest,'user-note.txt'),'utf8'),'preserve');assert.equal(status(dest).current,true);
});
test('new package file collision refuses to overwrite user-owned file',()=>{
 const dest=target('collision');install(dest);const m=path.join(dest,marker),record=JSON.parse(fs.readFileSync(m));record.version='0.0.0';delete record.files['references/assets.md'];fs.writeFileSync(m,JSON.stringify(record));
 assert.throws(()=>install(dest),{code:'SKILL_UNMANAGED_FILE'});
});
test('malicious ownership record cannot escape installation root',()=>{
 const dest=target('escape');install(dest);const m=path.join(dest,marker),record=JSON.parse(fs.readFileSync(m));record.files['../outside']='bad';fs.writeFileSync(m,JSON.stringify(record));
 assert.throws(()=>install(dest),{code:'SKILL_UNSAFE_TARGET'});
});
test('a held update lock is reported without mutation',()=>{
 const dest=target('busy');install(dest);const m=path.join(dest,marker),record=JSON.parse(fs.readFileSync(m));record.version='0.0.0';fs.writeFileSync(m,JSON.stringify(record));fs.writeFileSync(dest+'.install-lock','held');
 assert.throws(()=>install(dest),{code:'SKILL_BUSY'});
});
test('locked directory rename is unnecessary for in-place managed update',()=>{
 const dest=target('locked-rename');install(dest);const m=path.join(dest,marker),record=JSON.parse(fs.readFileSync(m));record.version='0.0.0';fs.writeFileSync(m,JSON.stringify(record));
 const original=fs.renameSync;fs.renameSync=()=>{throw Object.assign(Error('host lock'),{code:'EPERM'});};
 try{const result=install(dest);assert.ok(result.backup);assert.equal(result.current,true);}finally{fs.renameSync=original;}
});
test('partial write failure leaves a recoverable full backup',()=>{
 const dest=target('failure');install(dest);const m=path.join(dest,marker),record=JSON.parse(fs.readFileSync(m));record.version='0.0.0';fs.writeFileSync(m,JSON.stringify(record));
 const original=fs.copyFileSync;let count=0;fs.copyFileSync=(...args)=>{if(args[1].startsWith(dest+path.sep)&&++count===2)throw Error('injected I/O failure');return original(...args);};
 try{assert.throws(()=>install(dest),e=>e.code==='SKILL_INSTALL_FAILED'&&e.message.includes('restore from'));}finally{fs.copyFileSync=original;}
 const backups=path.join(process.env.CLOUD_HUG_STATE_DIR,'skill-backups');assert.ok(fs.readdirSync(backups).some(n=>fs.existsSync(path.join(backups,n,'SKILL.md'))));
 assert.equal(fs.existsSync(dest+'.install-lock'),false);
});
test('canonical source, doctor and negative CLI contracts',()=>{
 const src=JSON.parse(cli('skill','source','--json').stdout);assert.equal(src.source,source);
 const doctor=JSON.parse(cli('doctor','--json').stdout);assert.equal(doctor.ok,true);assert.equal(doctor.generation.runtimeTested,false);
 assert.notEqual(cli('skill','install','--agent','other').status,0);
 assert.notEqual(cli('skill','install','--root').status,0);
 assert.notEqual(cli('update','install').status,0);
 assert.notEqual(cli('unknown').status,0);
});
test('asset manifest verifies all published bytes and approved provenance hashes',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(repo,'npm/integrity.json')));assert.deepEqual(inventory(source),manifest);
 const approved=JSON.parse(fs.readFileSync(path.join(source,'assets/approved/detail-final-20261016/sources.json')));
 for(const item of approved.items)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(source,item.path))).digest('hex'),item.sha256);
 const model=JSON.parse(fs.readFileSync(path.join(source,'references/model-generation.json')));
 assert.equal(manifest[model.bundled_output],model.sha256);assert.equal(model.user_confirmation,undefined);
});
test('offline or wrong registry preserves current package',async()=>{
 assert.equal((await checkUpdate(async()=>{throw Error('offline');})).code,'REGISTRY_UNAVAILABLE');
 assert.equal((await checkUpdate(async()=>({ok:true,json:async()=>({name:'other',version:'9.0.0'})}))).ok,false);
});
test('stable update version ordering and ownership',()=>{
 assert.equal(newer('0.2.0','0.1.0'),true);assert.equal(newer('0.1.0','0.1.0'),false);assert.equal(newer('0.2.0-beta.1','0.1.0'),false);assert.equal(globalPrefix(repo),null);
});
