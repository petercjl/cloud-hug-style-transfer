import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { packReceipt } from './pack.mjs';
import { source, resolveTarget, status } from './skills.mjs';
import { root, pkg, fail } from './runtime.mjs';

export const stateRoot = () => process.env.CLOUD_HUG_STATE_DIR || (process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'cloud-hug-style-transfer') : path.join(os.homedir(), '.local', 'state', 'cloud-hug-style-transfer'));
export function newer(a, b) {
  if (!/^\d+\.\d+\.\d+$/.test(a)) return false;
  const x=a.split('.').map(Number), y=b.split('.').map(Number);
  for(let i=0;i<3;i++) { if(x[i]!==y[i]) return x[i]>y[i]; }
  return false;
}
export function globalPrefix(location=root, platform=process.platform) {
  const modules=path.dirname(path.dirname(location));
  if(path.basename(modules)!=='node_modules' || fs.existsSync(path.join(location,'.git'))) return null;
  if(platform==='win32') return path.dirname(modules);
  return path.basename(path.dirname(modules))==='lib' ? path.dirname(path.dirname(modules)) : null;
}
export async function checkUpdate(registry=fetch, options={}) {
  try {
    const r=await registry(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/latest`,{signal:AbortSignal.timeout(options.timeoutMs||8000)});
    if(!r.ok) throw Error('Registry unavailable');
    const data=await r.json();
    if(data.name!==pkg.name || !/^\d+\.\d+\.\d+$/.test(data.version)) throw Error('Invalid stable package');
    return {ok:true,current:pkg.version,available:data.version,updateAvailable:newer(data.version,pkg.version),tag:'latest'};
  } catch { return {ok:false,code:'REGISTRY_UNAVAILABLE',current:pkg.version,updateAvailable:false,offline:'keep-current'}; }
}
function npm(args) {
  let cli=process.env.npm_execpath;
  if(!cli?.endsWith('npm-cli.js')) {
    const found=spawnSync(process.platform==='win32'?'where':'which',[process.platform==='win32'?'npm.cmd':'npm'],{encoding:'utf8',timeout:10000});
    const launcher=found.stdout?.trim().split(/\r?\n/)[0];
    cli=launcher && (process.platform==='win32' ? path.join(path.dirname(launcher),'node_modules','npm','bin','npm-cli.js') : fs.realpathSync(launcher));
  }
  if(!cli || !fs.existsSync(cli)) throw fail('NPM_UNAVAILABLE','npm is required for updates.');
  const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:180000});
  if(r.status!==0) throw fail('UPDATE_FAILED','npm update failed; check npm connectivity and installation permissions.');
  return r.stdout;
}
export function installUpdate(check, services={}) {
  if(!check.ok)throw fail(check.code||'REGISTRY_UNAVAILABLE','Registry check failed; installation retained.');
  const started=performance.now(), prefix=services.prefix || globalPrefix();
  const state=stateRoot();fs.mkdirSync(state,{recursive:true});
  const lock=path.join(state,'update.lock');
  try {fs.mkdirSync(lock);}catch{throw fail('UPDATE_BUSY','Another update is running. Retry after it finishes.');}
  const run=services.npm||npm, spawn=services.spawn||spawnSync;
  const entry=path.join(root,'npm','cli.mjs'), targets=[], skills=[];
  const sync=target=>{
    const r=spawn(process.execPath,[entry,'skill','update','--agent',target.agent||'codex','--root',path.dirname(target.target),'--json'],{encoding:'utf8',timeout:30000,env:{...process.env,CLOUD_HUG_AUTO_UPDATE:'0'}});
    let receipt;try{receipt=JSON.parse(r.stdout);}catch{/* malformed receipt is a failure */}
    if(r.status!==0||!receipt?.ok||!receipt.current||!receipt.verified)throw Object.assign(fail('SKILL_SYNC_FAILED','Managed Skill reconciliation failed.'),{details:{target:target.target,result:receipt||null}});
    return {...receipt,resolution:target};
  };
  let archivePath,mutated=false,version;
  try {
    const live=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
    const packageChanged=newer(check.available,live.version);
    if(packageChanged&&!prefix)throw fail('UPDATE_OWNER_REQUIRED','This installation is managed by its source checkout or parent package.');
    if(services.resolution)targets.push(services.resolution);
    else {
      const known=[resolveTarget('codex'),resolveTarget('sealseek'),resolveTarget('workbuddy')];
      const registered=path.join(state,'skill-targets');
      for(const file of fs.existsSync(registered)?fs.readdirSync(registered):[]) {
        try{const r=JSON.parse(fs.readFileSync(path.join(registered,file),'utf8'));if(typeof r.target==='string'&&path.isAbsolute(r.target)&&path.basename(r.target)==='cloud-hug-style-transfer')known.push({target:r.target,resolvedFrom:'managed-registration'});}catch{/* invalid registration is ignored */}
      }
      for(const r of known)if(!targets.some(t=>t.target===r.target)&&status(r.target).managed)targets.push(r);
    }
    // Ownership, local edits and metadata conflicts are checked before replacing the package.
    for(const t of targets){const s=status(t.target);if(s.installed&&!s.managed)throw fail('SKILL_UNMANAGED','Selected Skill is user-owned.');if(s.edited)throw fail('SKILL_EDITED','Managed Skill contains local edits; reconcile before updating.');}
    const preflightMs=performance.now()-started;
    if(packageChanged) {
      const backup=path.join(state,'package-backups',crypto.randomUUID());fs.mkdirSync(backup,{recursive:true});
      const archive=packReceipt(run(['pack',root,'--ignore-scripts','--pack-destination',backup,'--json']));
      if(!archive?.filename||path.basename(archive.filename)!==archive.filename)throw fail('UPDATE_BACKUP_FAILED','Invalid package backup receipt.');
      archivePath=path.join(backup,archive.filename);
      if(!fs.statSync(archivePath).size)throw fail('UPDATE_BACKUP_FAILED','Package backup is empty.');
      mutated=true;
      run(['install','--global','--prefix',prefix,'--prefer-online','--ignore-scripts','--no-audit','--no-fund',`${pkg.name}@${check.available}`]);
    }
    version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
    if(version!==(packageChanged?check.available:live.version))throw fail('UPDATE_VERIFY_FAILED','Installed package version mismatch.');
    const packageMs=performance.now()-started-preflightMs;
    for(const t of targets)skills.push(sync(t));
    if(skills.some(r=>r.version!==version))throw fail('SKILL_VERIFY_FAILED','Package and Skill versions differ.');
    return {ok:true,package:pkg.name,source,entry:{node:process.execPath,cli:entry},owner:prefix?'global-npm':'source-or-parent',from:live.version,version,packageChanged,changed:packageChanged||skills.some(r=>r.changed),skills,verified:true,backup:archivePath||null,warnings:targets.length?[]:['No managed Skill target discovered; use an explicit --agent to install one.'],timingsMs:{preflight:preflightMs,package:packageMs,skills:performance.now()-started-preflightMs-packageMs,total:performance.now()-started}};
  } catch(e) {
    if(mutated) {
      try{run(['install','--global','--prefix',prefix,'--ignore-scripts',archivePath]);const restored=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;if(restored!==pkg.version)throw Error('Rollback version mismatch');}
      catch{throw Object.assign(fail('ROLLBACK_REQUIRED','Restore the package archive before continuing.'),{backup:archivePath});}
      for(const t of targets)try{sync(t);}catch{throw Object.assign(fail('ROLLBACK_SYNC_REQUIRED','Package restored; restore affected Skill backups or reconcile local edits.'),{backup:archivePath,details:{skills,cause:e.details||e.message}});}
    }
    if(archivePath)e.backup=archivePath;
    throw e;
  } finally {fs.rmdirSync(lock);}
}
