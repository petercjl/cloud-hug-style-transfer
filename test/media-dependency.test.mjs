import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mediaDependency } from '../npm/media-dependency.mjs';
import { mediaFixture } from './media-fixture.mjs';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-media-'));
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
test('missing media package pauses doctor before any generation',()=>{
 const env={...process.env,CLOUD_HUG_MEDIA_ROOT:path.join(tmp,'absent')};
 assert.equal(mediaDependency({env}).code,'DEPENDENCY_MISSING');
 const r=spawnSync(process.execPath,[fileURLToPath(new URL('../npm/cli.mjs',import.meta.url)),'doctor','--json'],{encoding:'utf8',env});
 const d=JSON.parse(r.stdout);assert.equal(r.status,1);assert.equal(d.code,'DEPENDENCY_MISSING');assert.equal(d.generation.state,'paused');assert.equal(d.action,'pause');assert.equal(d.integrity.ok,true);
});
test('verified package invokes active Node and resolves canonical Skill without a PATH runtime',()=>{
 const root=mediaFixture(path.join(tmp,'valid'));
 const d=mediaDependency({packageRoot:root,env:{...process.env,PATH:tmp}});
 assert.equal(d.ok,true);assert.equal(d.invocation.command,process.execPath);assert.equal(d.source,path.join(fs.realpathSync(root),'skills/sealseek-media'));assert.equal(d.serviceAccess,'requires-live-preflight');assert.equal(d.generationTested,false);
});
test('missing companion Skill, old version and incomplete media contract stop execution',()=>{
 const root=mediaFixture(path.join(tmp,'no-skill'));fs.unlinkSync(path.join(root,'skills/sealseek-media/SKILL.md'));
 assert.equal(mediaDependency({packageRoot:root}).code,'DEPENDENCY_INVALID');
 assert.equal(mediaDependency({packageRoot:mediaFixture(path.join(tmp,'old'),{version:'0.5.9'})}).code,'DEPENDENCY_INCOMPATIBLE');
 assert.equal(mediaDependency({packageRoot:mediaFixture(path.join(tmp,'features'),{features:['image']})}).code,'DEPENDENCY_INCOMPATIBLE');
});
test('wrong package identity and failing executable cannot satisfy dependency',()=>{
 const root=mediaFixture(path.join(tmp,'wrong'));const file=path.join(root,'package.json');const p=JSON.parse(fs.readFileSync(file));p.name='other';fs.writeFileSync(file,JSON.stringify(p));
 assert.equal(mediaDependency({packageRoot:root}).ok,false);
 const broken=mediaFixture(path.join(tmp,'broken'));fs.writeFileSync(path.join(broken,'cli.mjs'),'process.exit(1)');assert.equal(mediaDependency({packageRoot:broken}).code,'DEPENDENCY_INVALID');
});
test('PATH discovers an npm prefix without relying on Windows cmd execution',()=>{
 const prefix=path.join(tmp,'npm-prefix');
 mediaFixture(path.join(prefix,'node_modules/@petercjl/sealseek-media-cli'));
 const env={...process.env,PATH:prefix};delete env.CLOUD_HUG_MEDIA_ROOT;
 const d=mediaDependency({env});assert.equal(d.ok,true);assert.equal(d.invocation.command,process.execPath);
});
