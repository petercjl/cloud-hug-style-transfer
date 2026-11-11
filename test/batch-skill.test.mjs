import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'../skills/cloud-hug-batch-style-transfer');
const walk=(dir,at='')=>fs.readdirSync(path.join(dir,at),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir,at+e.name+'/'):[at+e.name]);
const run=(script,args,cwd)=>spawnSync(process.execPath,[path.join(root,'scripts',script),...args],{cwd,encoding:'utf8',timeout:20000});
const temp=t=>{const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cloud-hug-batch-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};

test('independent batch Skill inventory and local reference links remain complete',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'INTEGRITY.json'),'utf8'));
 const files=walk(root).filter(f=>f!=='INTEGRITY.json');
 assert.equal(manifest.algorithm,'sha256');
 assert.deepEqual([...files].sort(),Object.keys(manifest.files).sort());
 for(const file of files){
  const bytes=fs.readFileSync(path.join(root,file));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),manifest.files[file],file);
  if(!file.endsWith('.md'))continue;
  for(const match of bytes.toString('utf8').matchAll(/\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)){
   if(/^(?:[a-z]+:|#|<)/i.test(match[1]))continue;
   const target=decodeURIComponent(match[1].split('#')[0]);
   if(target)assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),target)),file+': '+target);
  }
 }
});

test('batch media discovery uses only the selected installed runtime and disables updates',t=>{
 const dir=temp(t),skill=path.join(dir,'installed'),runtime=path.join(skill,'.runtime'),canonical=path.join(runtime,'skills/sealseek-media');
 fs.mkdirSync(canonical,{recursive:true});fs.mkdirSync(path.join(skill,'scripts'));
 fs.writeFileSync(path.join(skill,'SKILL.md'),'---\nname: sealseek-media\n---\n');
 fs.writeFileSync(path.join(canonical,'SKILL.md'),'---\nname: sealseek-media\n---\n');
 fs.writeFileSync(path.join(runtime,'package.json'),JSON.stringify({name:'@petercjl/sealseek-media-cli',version:'0.6.8'}));
 fs.writeFileSync(path.join(skill,'scripts/run.mjs'),`if(JSON.stringify(process.argv.slice(2))!==JSON.stringify(['skill','source','--json'])||process.env.SEALSEEK_MEDIA_AUTO_UPDATE!=='0')process.exit(1);console.log(JSON.stringify(${JSON.stringify({ok:true,name:'sealseek-media',version:'0.6.8',source:canonical})}));`);
 const args=['--skill-root',skill,'--agent','codex'];
 const result=run('check-media.mjs',args,dir);assert.equal(result.status,0,result.stderr);
 const body=JSON.parse(result.stdout);assert.equal(body.canonical_source,canonical);assert.equal(body.invocation.command,process.execPath);assert.deepEqual(body.invocation.binding_args,['--agent','codex','--skill-path',skill]);assert.equal(body.generation_tested,false);
 fs.writeFileSync(path.join(runtime,'package.json'),JSON.stringify({name:'unrelated-package',version:'0.6.8'}));
 const wrong=run('check-media.mjs',args,dir);assert.equal(wrong.status,1);assert.equal(JSON.parse(wrong.stderr).code,'DEPENDENCY_IDENTITY_MISMATCH');
 const unknown=run('check-media.mjs',['--unknown'],dir);assert.equal(unknown.status,1);assert.equal(JSON.parse(unknown.stderr).code,'INVALID_ARGUMENTS');
});

test('batch comparison helper runs outside its Skill directory without submitting media',t=>{
 const dir=temp(t),input=path.join(dir,'row.json');
 fs.writeFileSync(input,'\uFEFF'+JSON.stringify({run_id:'batch',row_index:2,source:{url:'https://example.com/old.png',width:600,height:1200},result:{url:'https://example.com/new.png',width:600,height:1200}}));
 const result=run('canvas-row.mjs',['--input',input],dir);assert.equal(result.status,0,result.stderr);
 const body=JSON.parse(result.stdout);assert.equal(body.batch.media.length,2);assert.equal(body.next_top,992);assert.equal(body.batch.media[0].id,'batch-row-2-source');assert.equal(body.batch.media[1].placement.positions[0].x,504);
});
