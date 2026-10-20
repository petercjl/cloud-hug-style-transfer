import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, pkg, fail } from './runtime.mjs';
import { stateRoot, checkUpdate, installUpdate, globalPrefix, newer } from './update.mjs';

const defaultPolicy={mode:'notify',intervalHours:24,timeoutMs:2000,offlineRetryMs:300000};
export const automaticPaths=()=>{
 const key=crypto.createHash('sha256').update(root).digest('hex');
 const dir=path.join(stateRoot(),'automatic-update',key);
 return {dir,policy:path.join(dir,'policy.json'),cache:path.join(dir,'cache.json'),lock:path.join(dir,'check.lock')};
};
function readOwned(file) {
 let st;try{st=fs.lstatSync(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}
 if(!st.isFile()||st.isSymbolicLink())throw fail('AUTO_STATE_INVALID','Automatic update state must be a regular managed file.');
 let value;try{value=JSON.parse(fs.readFileSync(file,'utf8'));}catch{throw fail('AUTO_STATE_INVALID','Invalid automatic update state; preserve and reconcile it.');}
 if(value?.package!==pkg.name||value.schemaVersion!==1)throw fail('AUTO_STATE_INVALID','Automatic update state ownership mismatch.');
 return value;
}
function saveOwned(file,value) {
 const old=readOwned(file);fs.mkdirSync(path.dirname(file),{recursive:true});let backup=null;
 if(old){backup=file+'.backup-'+crypto.randomUUID();fs.copyFileSync(file,backup,fs.constants.COPYFILE_EXCL);if(!fs.statSync(backup).size)throw fail('AUTO_STATE_INVALID','State backup is empty.');}
 const temporary=file+'.tmp-'+crypto.randomUUID();
 fs.writeFileSync(temporary,JSON.stringify({schemaVersion:1,package:pkg.name,...value},null,2)+'\n',{flag:'wx',mode:0o600});
 try{fs.renameSync(temporary,file);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
 return backup;
}
export function updatePolicy(changes) {
 const file=automaticPaths().policy,stored=readOwned(file);
 const policy={...defaultPolicy,...(stored?.policy||{}),...changes};
 if(!['off','notify','auto'].includes(policy.mode)||!Number.isFinite(policy.intervalHours)||policy.intervalHours<1||policy.intervalHours>168||policy.timeoutMs!==2000||policy.offlineRetryMs!==300000)throw fail('AUTO_POLICY_INVALID','Choose off/notify/auto and an interval between 1 and 168 hours.');
 const authorized=policy.mode==='auto'&&(changes?.mode==='auto'||stored?.authorizedAutomaticInstall===true);
 if(policy.mode==='auto'&&!authorized)throw fail('AUTO_POLICY_INVALID','Automatic installation needs an explicitly authorized policy.');
 let backup=null;if(changes)backup=saveOwned(file,{policy,authorizedAutomaticInstall:authorized,updatedAt:new Date().toISOString()});
 return {ok:true,policy,policyFile:file,backup,changed:Boolean(changes),installationScope:root};
}
export function compatibleStable(available,current) {
 if(!newer(available,current))return false;
 const a=available.split('.').map(Number),b=current.split('.').map(Number);
 return a[0]===b[0]&&(b[0]!==0||a[1]===b[1]);
}
function acquire(file) {
 try{const fd=fs.openSync(file,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({schemaVersion:1,package:pkg.name,pid:process.pid}));fs.closeSync(fd);return true;}
 catch(e){if(e.code!=='EEXIST')throw e;}
 const old=readOwned(file);
 if(!Number.isSafeInteger(old?.pid)||old.pid<=0)throw fail('AUTO_STATE_INVALID','Invalid automatic-check lock; inspect it before retrying.');
 try{process.kill(old.pid,0);return false;}catch(e){if(e.code!=='ESRCH')return false;}
 fs.unlinkSync(file);return acquire(file);
}
export async function automaticUpdate(options={},services={}) {
 const now=(services.now||Date.now)(),paths=automaticPaths();
 const owner=services.owner|| (globalPrefix()?'global-npm':'source-or-parent');
 if(process.env.CLOUD_HUG_AUTO_UPDATE==='0')return {ok:true,state:'disabled',reason:'environment',changed:false};
 let policy;
 try{policy=updatePolicy().policy;}catch(e){return {ok:true,state:'deferred',code:e.code,message:e.message,changed:false};}
 if(policy.mode==='off')return {ok:true,state:'disabled',policy,changed:false};
 if(owner!=='global-npm')return {ok:true,state:'owner-managed',owner,policy,changed:false};
 let locked=false;
 try {
  fs.mkdirSync(paths.dir,{recursive:true});locked=acquire(paths.lock);
  if(!locked)return {ok:true,state:'busy',policy,changed:false};
  const cache=readOwned(paths.cache);
  if(cache&&(!Number.isFinite(cache.checkedAt)||cache.checkedAt>now||!cache.response||typeof cache.response.ok!=='boolean'||(cache.response.ok&&!/^\d+\.\d+\.\d+$/.test(cache.response.available))))throw fail('AUTO_STATE_INVALID','Invalid cached registry evidence; preserve and reconcile it.');
  const ttl=cache?.response.ok?policy.intervalHours*3600000:policy.offlineRetryMs;
  const cached=Boolean(!options.force&&cache&&now-cache.checkedAt<ttl);
  const check=cached?{...cache.response,current:pkg.version,updateAvailable:cache.response.ok&&newer(cache.response.available,pkg.version)}:await (services.check||checkUpdate)(services.registry||fetch,{timeoutMs:policy.timeoutMs});
  if(!cached)saveOwned(paths.cache,{checkedAt:now,response:check});
  const result={ok:true,policy,cached,check,changed:false};
  if(!check.ok)return {...result,state:'offline',retryAfterMs:policy.offlineRetryMs};
  if(policy.mode==='notify')return {...result,state:check.updateAvailable?'update-available':'up-to-date',action:check.updateAvailable?'update install --yes':null};
  if(check.updateAvailable&&!compatibleStable(check.available,pkg.version))return {...result,state:'manual-update-required',reason:'compatibility-boundary',action:'update install --yes'};
  try{
   const receipt=(services.install||installUpdate)(check,{resolution:options.resolution});
   if(!receipt?.ok||!receipt.verified)throw fail('UPDATE_VERIFY_FAILED','Automatic installer did not return verified evidence.');
   return {...result,state:receipt.changed?'updated':'up-to-date',changed:receipt.changed,packageChanged:receipt.packageChanged,receipt,reloadSkill:receipt.changed};
  }catch(e){
   const safe=['UPDATE_BUSY','SKILL_BUSY','SKILL_EDITED','SKILL_UNMANAGED','SKILL_METADATA_INVALID','UPDATE_OWNER_REQUIRED','SKILL_UNMANAGED_FILE'].includes(e.code);
   return {...result,ok:safe,state:safe?'deferred':'failed',code:e.code||'UPDATE_FAILED',message:e.message,backup:e.backup||null,details:e.details||null};
  }
 }catch(e){return {ok:true,state:'deferred',code:e.code||'AUTO_CHECK_FAILED',message:e.message,changed:false};}
 finally{if(locked)fs.unlinkSync(paths.lock);}
}
