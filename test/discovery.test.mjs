import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,pkg,config} from '../lifecycle/engine.mjs';
const run=(args,status=0)=>{const r=spawnSync(process.execPath,[path.join(root,config.entry),...args],{encoding:'utf8',env:{...process.env,CLOUD_HUG_AUTO_UPDATE:'0'},timeout:10000});assert.equal(r.status,status,r.stdout+r.stderr);return JSON.parse(r.stdout);};
test('discovery instructions execute complete and named source queries without changing source',()=>{
 const files=['capabilities.json','skills/'+config.skill+'/SKILL.md'];const before=files.map(f=>fs.readFileSync(path.join(root,f),'utf8'));
 const manifest=run(['--help','--json']),caps=run(['capabilities','--json']);assert.deepEqual(manifest.commandContracts,caps.commandContracts);assert.deepEqual(caps.commands,caps.commandContracts);
 const d=manifest.discoveryContract;assert.equal(d.schemaVersion,1);const version=run(d.version.argv);assert.equal(version[d.version.fields.package.field],pkg.name);assert.equal(version[d.version.fields.version.field],pkg.version);
 const all=run(d.skillCollection.enumeration.argv);assert.equal(all[d.skillCollection.enumeration.completeField],true);const sources=all[d.skillCollection.enumeration.itemsField];assert.deepEqual(sources.map(s=>s.name),caps.skills);
 for(const source of sources){assert.deepEqual(run(d.skillCollection.namedSource.map(x=>x==='{skill}'?source.name:x)),run(['skill','source','--json']));assert.equal(source.version,pkg.version);assert(fs.existsSync(path.join(source.source,'SKILL.md')));}
 for(const args of [['--all','--name',config.skill],['--name',config.skill,'--name',config.skill],['--all','--all']])assert.equal(run(['skill','source',...args,'--json'],1).code,'INVALID_ARGUMENT');
 assert.equal(run(['skill','source','--name','unknown-skill','--json'],1).code,'SKILL_NOT_FOUND');assert.deepEqual(files.map(f=>fs.readFileSync(path.join(root,f),'utf8')),before);
});
