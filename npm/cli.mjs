#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { root, pkg, fail } from './runtime.mjs';
import { source, resolveTarget, status, install, inventory, skillMetadata } from './skills.mjs';
import { checkUpdate, installUpdate, globalPrefix } from './update.mjs';
import { mediaDependency } from './media-dependency.mjs';
import { comparisonRow } from './canvas-layout.mjs';
import { parse, manifest } from './arguments.mjs';
const started=performance.now();
const out=value=>console.log(JSON.stringify(value,null,2));
try {
 const {command,options:o,contract}=parse(process.argv.slice(2));
 const identity={package:pkg.name,version:pkg.version,source,entry:{node:process.execPath,cli:path.join(root,'npm/cli.mjs')},owner:globalPrefix()?'global-npm':'source-or-parent'};
 if(command==='help')out({ok:true,...identity,commands:manifest.commandContracts});
 else if(o['--help'])out({ok:true,command,...contract});
 else if(command==='version')out({ok:true,name:pkg.name,...identity});
 else if(command==='capabilities')out({...manifest,...identity});
 else if(command==='canvas row')out(comparisonRow(JSON.parse(fs.readFileSync(o['--input'],'utf8'))));
 else if(command==='skill source')out({ok:true,...identity});
 else if(command.startsWith('skill ')) {
  const resolution=resolveTarget(o['--agent']||'codex',o['--root']);
  const result=command==='skill status'?{ok:true,...status(resolution.target),record:undefined}:install(resolution.target);
  out({...identity,...result,resolution});
 } else if(command==='doctor') {
  const files=inventory(source),expected=JSON.parse(fs.readFileSync(path.join(root,'npm/integrity.json'),'utf8'));
  const problems=Object.entries(expected).filter(([name,hash])=>files[name]!==hash).map(([name])=>name);
  const media=mediaDependency();const metadata=skillMetadata(source);
  const result={ok:Number(process.versions.node.split('.')[0])>=22&&!problems.length&&metadata.valid&&media.ok,...identity,node:process.versions.node,files:Object.keys(files).length,integrity:{ok:!problems.length,problems},metadata:{valid:metadata.valid},installationReady:!problems.length&&metadata.valid,dependencies:{media},hostCapabilityDependencies:manifest.requirements.host_capability_skills,generation:{provider:'@petercjl/sealseek-media-cli',state:media.ok?'requires-live-preflight':'paused',runtimeTested:false,requiredFeatures:['image-inspection','multiple-reference-edit','local-reference-input','viewable-output']}};
  if(!media.ok){result.code=media.code;result.action='pause';result.installPrompt=media.installPrompt;}
  if(o['--agent']){result.resolution=resolveTarget(o['--agent'],o['--root']);result.installation={...status(result.resolution.target),record:undefined};if(!result.installation.current){result.ok=false;result.code||='SKILL_RECONCILIATION_REQUIRED';}}
  out({...result,timingsMs:{total:performance.now()-started}});if(!result.ok)process.exitCode=1;
 } else if(command.startsWith('update ')) {
  const resolution=o['--agent']?resolveTarget(o['--agent'],o['--root']):undefined;
  const registryStarted=performance.now();const check=await checkUpdate();const registryMs=performance.now()-registryStarted;
  if(command==='update check'){out({...check,...identity,...(resolution?{resolution,installation:{...status(resolution.target),record:undefined}}:{}),timingsMs:{total:performance.now()-started}});if(!check.ok)process.exitCode=1;}
  else {if(!check.ok)throw fail(check.code,'Registry unavailable; installed version retained.');const result=installUpdate(check,{resolution});out({...result,timingsMs:{...result.timingsMs,registry:registryMs,total:performance.now()-started}});}
 }
} catch(e){out({ok:false,code:e.code||'COMMAND_FAILED',message:e.message,...(e.causeCode?{causeCode:e.causeCode}:{}),...(e.backup?{backup:e.backup}:{}),...(e.details?{details:e.details}:{}),timingsMs:{total:performance.now()-started}});process.exitCode=1;}
