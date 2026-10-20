import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const name = '@petercjl/sealseek-media-cli';
const prompt = `请安装 npm 包 ${name}。`;

// Invoke the verified package entry with the active Node runtime, including on
// Windows where an npm .cmd shim is not a directly executable program.
export function mediaDependency({ env = process.env, packageRoot } = {}) {
 const missing = (code, message) => ({ok:false,code,package:name,message,installPrompt:prompt,action:'pause'});
 const roots=[];
 if(packageRoot || env.CLOUD_HUG_MEDIA_ROOT) roots.push(packageRoot || env.CLOUD_HUG_MEDIA_ROOT);
 else {
  try { roots.push(path.dirname(createRequire(import.meta.url).resolve(`${name}/package.json`))); } catch {}
  for(const dir of (env.PATH || '').split(path.delimiter).filter(Boolean)) {
   roots.push(path.join(dir,'node_modules',...name.split('/')),path.join(dir,'..','lib','node_modules',...name.split('/')));
   try {
    const entry=fs.realpathSync(path.join(dir,'sealseek-media'));
    roots.push(path.resolve(path.dirname(entry),'..'));
   } catch {}
  }
 }
 for(const candidate of [...new Set(roots)]) {
  if(!fs.existsSync(path.join(candidate,'package.json'))) continue;
  try {
   const root=fs.realpathSync(candidate),pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
   if(pkg.name!==name) continue;
   const parts=pkg.version?.split('.').map(Number);
   if(!/^\d+\.\d+\.\d+$/.test(pkg.version)||!(parts[0]>0||parts[1]>6||(parts[1]===6&&parts[2]>=1))) return missing('DEPENDENCY_INCOMPATIBLE','sealseek-media-cli >=0.6.1 is required; update the package.');
   if(typeof pkg.bin?.['sealseek-media']!=='string') return missing('DEPENDENCY_INVALID','Media CLI entry is missing.');
   const entry=fs.realpathSync(path.resolve(root,pkg.bin['sealseek-media']));
   if(!entry.startsWith(root+path.sep)) return missing('DEPENDENCY_INVALID','Media CLI entry must belong to its package.');
   const result=spawnSync(process.execPath,[entry,'skill','source','--json'],{encoding:'utf8',timeout:15000,maxBuffer:1024*1024,env:{...env,SEALSEEK_MEDIA_AUTO_UPDATE:'0'}});
   const data=JSON.parse(result.stdout||'null');
   if(result.status!==0||data?.ok!==true||data.name!=='sealseek-media'||data.version!==pkg.version||typeof data.source!=='string') return missing('DEPENDENCY_INVALID','Media CLI canonical Skill discovery failed.');
   const source=fs.realpathSync(data.source);
   if(!source.startsWith(root+path.sep)||!/^name: sealseek-media\s*$/m.test(fs.readFileSync(path.join(source,'SKILL.md'),'utf8'))) return missing('DEPENDENCY_INVALID','Media companion Skill identity is invalid.');
   const contract=JSON.parse(fs.readFileSync(path.join(source,'capabilities.json'),'utf8'));
   const generate=contract.capabilities?.find(c=>c.id==='media.generate');
   if(!['image','reference-image','dry-run','task-record','local-artifact'].every(f=>generate?.required_features?.includes(f))) return missing('DEPENDENCY_INCOMPATIBLE','Media generation contract is incomplete.');
   return {ok:true,package:name,version:pkg.version,entry,source,invocation:{command:process.execPath,args:[entry]},serviceAccess:'requires-live-preflight',generationTested:false};
  } catch { return missing('DEPENDENCY_INVALID','Media package, CLI or canonical Skill could not be verified.'); }
 }
 return missing('DEPENDENCY_MISSING','Required sealseek-media-cli package was not detected. Pause the Skill until it is installed and verified.');
}
