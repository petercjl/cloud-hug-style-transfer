import test from 'node:test';
import { packReceipt } from '../npm/pack.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
test('packed package installs its runtime dependency and executes canonical Skill lifecycle',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-packed-'));
 try {
  const npm=process.env.npm_execpath;assert.ok(npm&&fs.existsSync(npm),'Run the package suite with npm test to identify the active npm CLI.');
  const run=args=>{const r=spawnSync(process.execPath,[npm,'--dry-run=false',...args],{cwd:path.resolve(import.meta.dirname,'..'),encoding:'utf8',timeout:180000});assert.equal(r.status,0,r.stderr+r.stdout);return r.stdout;};
  const packed=packReceipt(run(['pack','--ignore-scripts','--pack-destination',dir,'--json']));
  assert.ok(packed.files.some(f=>f.path==='npm/metadata.mjs'));assert.ok(!packed.files.some(f=>/^(test|node_modules|\.git|out)\//.test(f.path)));
  const prefix=path.join(dir,'prefix');run(['install','--prefix',prefix,'--ignore-scripts','--no-audit','--no-fund',path.join(dir,packed.filename)]);
  const entry=path.join(prefix,'node_modules/@petercjl/cloud-hug-style-transfer/npm/cli.mjs');
  const invoke=args=>{const r=spawnSync(process.execPath,[entry,...args],{encoding:'utf8',env:{...process.env,CLOUD_HUG_STATE_DIR:path.join(dir,'state'),CODEX_SKILLS_DIR:path.join(dir,'target')}});assert.equal(r.status,0,r.stderr+r.stdout);return JSON.parse(r.stdout);};
  assert.equal(invoke(['version']).version,packed.version);
  const src=invoke(['skill','source']);assert.ok(src.source.startsWith(fs.realpathSync(prefix)));
  const installed=invoke(['skill','install','--agent','future-agent','--path',path.join(dir,'target'),'--json']);assert.equal(installed.verified,true);assert.equal(installed.hostDiscovery,'pending');
  assert.equal(invoke(['skill','update','--agent','future-agent','--path',path.join(dir,'target'),'--json']).changed,false);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test('npm pack receipts accept legacy arrays and npm 12 package-keyed objects, reject malformed archives',()=>{
 const name='@petercjl/cloud-hug-style-transfer',receipt={name,filename:'package.tgz',files:[]};
 for(const output of [[receipt],{[name]:receipt}])assert.deepEqual(packReceipt(JSON.stringify(output)),receipt);
 for(const output of ['{}','null','invalid',JSON.stringify([{filename:'../escape.tgz'}]),JSON.stringify([{filename:'..\\escape.tgz'}])])assert.throws(()=>packReceipt(output),{code:'UPDATE_BACKUP_FAILED'});
});
