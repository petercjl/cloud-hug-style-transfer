import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const name = '@petercjl/toapiscli';
const supported = value => {
 if (!/^\d+\.\d+\.\d+$/.test(value || '')) return false;
 const [major, minor, patch] = value.split('.').map(Number);
 return major > 0 || minor > 1 || (minor === 1 && patch >= 1);
};
const contained = (root, entry) => {
 const rel = path.relative(root, entry);
 return rel !== '' && !rel.startsWith('..'+path.sep) && rel !== '..' && !path.isAbsolute(rel);
};

// Select this host's managed Skill, never an unrelated global/PATH installation.
// Discovery reads capabilities only, without opening credentials.
export function mediaDependency({ env = process.env, skillRoot } = {}) {
 const missing = (code, message) => ({ok:false,code,package:name,message,
  installPrompt:'请在当前 Agent 安装并配置 @petercjl/toapiscli；非同级目录通过 CLOUD_HUG_TOAPIS_SKILL_ROOT 指向其 Skill 目录。',action:'pause-generation'});
 const candidate = skillRoot || env.CLOUD_HUG_TOAPIS_SKILL_ROOT;
 if (!candidate || !fs.existsSync(candidate)) return missing('DEPENDENCY_MISSING','Current-host toapiscli Skill was not found. Resolve its exact directory before generation.');
 try {
  const source = fs.realpathSync(candidate);
  if (!/^name:\s*toapiscli\s*$/m.test(fs.readFileSync(path.join(source,'SKILL.md'),'utf8'))) return missing('DEPENDENCY_INVALID','Expected the toapiscli companion Skill.');
  const runtime = fs.realpathSync(path.join(source,'.runtime'));
  if (!contained(source,runtime)) return missing('DEPENDENCY_INVALID','The runtime must belong to this Skill installation.');
  const pkg = JSON.parse(fs.readFileSync(path.join(runtime,'package.json'),'utf8'));
  if (pkg.name !== name) return missing('DEPENDENCY_INVALID','Unexpected media package identity.');
  if (!supported(pkg.version)) return missing('DEPENDENCY_INCOMPATIBLE','Stable toapiscli >=0.1.1 is required.');
  const entry = fs.realpathSync(path.join(runtime,'dist/cli.mjs'));
  if (!contained(runtime,entry)) return missing('DEPENDENCY_INVALID','The CLI entry must belong to its runtime.');
  const result = spawnSync(process.execPath,[entry,'capabilities','--json'],{
   encoding:'utf8',timeout:15000,maxBuffer:1024*1024,
   env:{...env,TOAPISCLI_UPDATE_CHECK:'0',TOAPISCLI_AUTO_UPDATE:'0'}
  });
  const contract = JSON.parse(result.stdout || 'null');
  if (result.status !== 0 || contract?.ok !== true || contract.package !== name || contract.version !== pkg.version || !contract.skills?.includes('toapiscli')) return missing('DEPENDENCY_INVALID','Media runtime identity or capability discovery failed.');
  const commands = contract.commandContracts || {};
  const required = {
   'image generate':['--model','--prompt-file','--resolution','--aspect','--reference','--out-directory','--submit','--wait'],
   'task get':['--directory'], 'task wait':['--directory'],
   'auth status':['--json'], 'models list':['--json'], 'models docs':['--model'], 'prepare':['--json']
  };
  const complete = Object.entries(required).every(([cmd,options]) => options.every(option => commands[cmd]?.options?.[option]));
  if (!complete || commands['image generate'].options['--reference'].repeatable !== true) return missing('DEPENDENCY_INCOMPATIBLE','Required image-reference or directory-based recovery contract is missing.');
  return {ok:true,package:name,version:pkg.version,entry,source,
   invocation:{command:process.execPath,args:[entry]},serviceAccess:'requires-live-preflight',generationTested:false,
   recovery:'task get/wait --directory ORIGINAL_OUTPUT_DIRECTORY',delivery:'images-and-manifest'};
 } catch {
  return missing('DEPENDENCY_INVALID','The installed toapiscli Skill, isolated runtime or CLI could not be verified.');
 }
}
