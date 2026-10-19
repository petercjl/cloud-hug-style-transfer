#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { root, pkg, fail } from './runtime.mjs';
import { source, targetPath, status, install, inventory } from './skills.mjs';
import { checkUpdate, installUpdate } from './update.mjs';
const args=process.argv.slice(2);
const option=name=>{const i=args.indexOf(name);if(i<0)return undefined;if(!args[i+1]||args[i+1].startsWith('--'))throw fail('INVALID_ARGUMENT',`${name} needs a value.`);return args[i+1];};
const out=value=>console.log(JSON.stringify(value,null,2));
try {
 if(args[0]==='version'||args[0]==='--version') out({ok:true,name:pkg.name,version:pkg.version});
 else if(args[0]==='capabilities') out(JSON.parse(fs.readFileSync(path.join(root,'capabilities.json'),'utf8')));
 else if(args[0]==='skill') {
  const action=args[1];
  if(action==='source')out({ok:true,package:pkg.name,version:pkg.version,source});
  else {
   const target=targetPath(option('--agent')||'codex',option('--root'));
   if(action==='status')out({...status(target),record:undefined});
   else if(['install','update'].includes(action))out(install(target));
   else throw fail('INVALID_COMMAND','Use skill source/status/install/update.');
  }
 } else if(args[0]==='doctor') {
  const files=inventory(source), expected=JSON.parse(fs.readFileSync(path.join(root,'npm','integrity.json'),'utf8'));
  const problems=Object.entries(expected).filter(([name,hash])=>files[name]!==hash).map(([name])=>name);
  const capabilities=JSON.parse(fs.readFileSync(path.join(root,'capabilities.json'),'utf8'));
  const result={ok:Number(process.versions.node.split('.')[0])>=22&&problems.length===0,package:pkg.name,version:pkg.version,node:process.versions.node,source,files:Object.keys(files).length,integrity:{ok:problems.length===0,problems},installationReady:problems.length===0,hostCapabilityDependencies:capabilities.requirements.host_capability_skills,generation:{state:'requires-host-preflight',runtimeTested:false,requiredFeatures:['image-inspection','multiple-reference-edit','local-reference-input','viewable-output']}};
  if(option('--agent'))result.installation={...status(targetPath(option('--agent'),option('--root'))),record:undefined};
  out(result);if(!result.ok)process.exitCode=1;
 } else if(args[0]==='update') {
  if(!['check','install'].includes(args[1]))throw fail('INVALID_COMMAND','Use update check/install.');
  if(args[1]==='install'&&!args.includes('--yes'))throw fail('PERMISSION_REQUIRED','Package update requires --yes.');
  const check=await checkUpdate();
  if(args[1]==='check'){out(check);if(!check.ok)process.exitCode=1;}
  else {if(!check.ok)throw fail(check.code,'Registry unavailable; installed version retained.');out(check.updateAvailable?installUpdate(check):{ok:true,changed:false,version:pkg.version});}
 } else if(!args.length||['--help','help','-h'].includes(args[0])) console.log('cloud-hug-style-transfer\nversion | capabilities --json | doctor --json [--agent AGENT]\nskill source/status/install/update [--agent codex|sealseek|workbuddy] [--root SKILLS_DIRECTORY]\nupdate check | update install --yes\nNode.js 22+. Updates are explicit; business calls never auto-update.');
 else throw fail('INVALID_COMMAND','Unknown command; use --help.');
} catch(e){out({ok:false,code:e.code||'COMMAND_FAILED',message:e.message});process.exitCode=1;}
