import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const packageName='@petercjl/product-asset-set';
const inside=(root,file)=>{const relative=path.relative(root,file);return relative!==''&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative);};
const failure=(code,message)=>({ok:false,code,package:packageName,message,action:'pause-asset-stage',installPrompt:'请在当前 Agent 安装或更新 @petercjl/product-asset-set，并同步其配套 Skill。'});
function invoke(entry,args,env){return spawnSync(process.execPath,[entry,...args],{encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,windowsHide:true,env:{...env,AGENT_PACKAGE_UPDATE_CHECK:'0'}});}
export function assetDependency({skillRoot,env=process.env}={}){
 const candidate=skillRoot||env.CLOUD_HUG_PRODUCT_ASSET_SKILL_ROOT||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../product-asset-set');
 if(!fs.existsSync(candidate))return failure('DEPENDENCY_MISSING','Current-host product-asset-set Skill is missing.');
 try{
  const source=fs.realpathSync(candidate);
  if(!/^name:\s*product-asset-set\s*$/m.test(fs.readFileSync(path.join(source,'SKILL.md'),'utf8')))return failure('DEPENDENCY_INVALID','Expected exact product-asset-set Skill.');
  const runtime=fs.realpathSync(path.join(source,'.runtime')),pkg=JSON.parse(fs.readFileSync(path.join(runtime,'package.json')));
  if(!inside(source,runtime)||pkg.name!==packageName)return failure('DEPENDENCY_INVALID','Asset runtime must belong to the selected Skill.');
  if(!/^\d+\.\d+\.\d+$/.test(pkg.version))return failure('DEPENDENCY_INCOMPATIBLE','Stable product-asset-set >=0.1.3 required.');
  const [major,minor,patch]=pkg.version.split('.').map(Number);
  if(major===0&&minor===0||major===0&&minor===1&&patch<3)return failure('DEPENDENCY_INCOMPATIBLE','Asset-format v2 reader requires product-asset-set >=0.1.3.');
  const entry=fs.realpathSync(path.join(runtime,'bin/product-asset-set.mjs'));
  if(!inside(runtime,entry))return failure('DEPENDENCY_INVALID','Asset entry escapes its runtime.');
  const run=invoke(entry,['capabilities','--json'],env),caps=JSON.parse(run.stdout||'null');
  if(run.status!==0||!caps?.ok||caps.package!==packageName||caps.version!==pkg.version||!caps.skills?.includes('product-asset-set'))return failure('DEPENDENCY_INVALID','Asset capability identity check failed.');
  if(!caps.commandContracts?.['asset check']?.options?.['--guide']||!caps.commandContracts?.['skill source']?.options?.['--json'])return failure('DEPENDENCY_INCOMPATIBLE','Required asset check/source contract missing.');
  return {ok:true,package:packageName,version:pkg.version,source,entry,invocation:{command:process.execPath,args:[entry]},requiredRoles:['overall','scale','texture'],generationRoute:'callee-owned',visualAcceptance:'not-attested'};
 }catch{return failure('DEPENDENCY_INVALID','Could not verify selected asset Skill/runtime.');}
}
export function inspectAssetSet(guide,options={}){
 const dependency=assetDependency(options);if(!dependency.ok)return dependency;
 if(typeof guide!=='string'||!guide)return {ok:false,code:'ASSET_GUIDE_REQUIRED',message:'An explicit asset guide is required.'};
 const run=invoke(dependency.entry,['asset','check','--guide',path.resolve(guide),'--json'],options.env||process.env);
 let result;try{result=JSON.parse(run.stdout||run.stderr);}catch{}
 if(run.status!==0||result?.ok!==true)return {ok:false,code:'ASSET_GUIDE_INVALID',message:'The owning product-asset-set reader rejected this guide or its files.',dependency};
 const images=result.images;
 if(!Array.isArray(images)||!['overall','scale','texture'].every(role=>images.some(i=>i.role===role)))return {ok:false,code:'ASSET_SET_INCOMPLETE',message:'A new complete set requires overall, scale and texture.',dependency};
 try{
  const directory=fs.realpathSync(path.dirname(path.resolve(guide))),ids=new Set();
  for(const i of images){if(typeof i.id!=='string'||ids.has(i.id)||typeof i.path!=='string'||!inside(directory,fs.realpathSync(i.path))||!/^([a-f0-9]{64})$/.test(i.hash))throw Error('Invalid asset mapping');ids.add(i.id);}
  return {...result,dependency,requiredRoles:dependency.requiredRoles,visualAcceptance:'requires-image-review-and-user-confirmation'};
 }catch{return {ok:false,code:'ASSET_GUIDE_INVALID',message:'Asset identity/path mapping is invalid.',dependency};}
}
export function selectAssetReferences(set,ids){
 if(!set?.ok)return set;
 if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)return {ok:false,code:'INVALID_ASSET_SELECTION',message:'Select distinct explicit asset ids in reference order.'};
 const references=ids.map(id=>set.images.find(i=>i.id===id));
 if(references.some(i=>!i))return {ok:false,code:'INVALID_ASSET_SELECTION',message:'Selected asset id is absent from the verified guide.'};
 if(!references.some(i=>i.role==='scale'))return {ok:false,code:'SCALE_ASSET_REQUIRED',message:'Every detail-page request requires an applicable scale asset.'};
 if(!references.some(i=>['overall','structure','texture','marking','use'].includes(i.role)))return {ok:false,code:'PRODUCT_ASSET_REQUIRED',message:'Select a product appearance/detail asset in addition to scale.'};
 return {ok:true,guide:set.guide,product:set.product,assetVersion:set.version,references:references.map((i,index)=>({...i,referenceIndex:index+1})),visualAcceptance:set.visualAcceptance};
}
