import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Read-only identity and launcher check. Never submits, authenticates or updates.
const usage = 'node check-media.mjs --skill-root INSTALLED_SEALSEEK_SKILL --agent CURRENT_HOST_OR_GENERIC';
try {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) {
    console.log(usage);
    process.exit(0);
  }
  if (args.length !== 4 || args[0] !== '--skill-root' || !args[1] || args[2] !== '--agent' || !/^[a-z][a-z0-9_-]{0,63}$/.test(args[3])) {
    throw Object.assign(new Error(usage), {code:'INVALID_ARGUMENTS'});
  }
  const agent = args[3];
  if (Number(process.versions.node.split('.')[0]) < 22) {
    throw Object.assign(new Error('Node.js 22 or newer is required.'), {code:'NODE_UNSUPPORTED'});
  }
  const root = fs.realpathSync(args[1]);
  const skill = fs.readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  if (!/^name:\s*sealseek-media\s*$/m.test(skill)) {
    throw Object.assign(new Error('Expected the installed sealseek-media Skill.'), {code:'DEPENDENCY_IDENTITY_MISMATCH'});
  }
  const runtime = fs.realpathSync(path.join(root, '.runtime'));
  const pkg = JSON.parse(fs.readFileSync(path.join(runtime, 'package.json'), 'utf8'));
  if (pkg.name !== '@petercjl/sealseek-media-cli' || typeof pkg.version !== 'string') {
    throw Object.assign(new Error('The Skill-owned media runtime has the wrong package identity.'), {code:'DEPENDENCY_IDENTITY_MISMATCH'});
  }
  const launcher = fs.realpathSync(path.join(root, 'scripts', 'run.mjs'));
  if (!launcher.startsWith(root + path.sep)) {
    throw Object.assign(new Error('Media launcher must belong to the installed Skill.'), {code:'DEPENDENCY_IDENTITY_MISMATCH'});
  }
  const result = spawnSync(process.execPath, [launcher, 'skill', 'source', '--json'], {
    encoding:'utf8', timeout:15000, windowsHide:true, maxBuffer:1024*1024,
    env:{...process.env, SEALSEEK_MEDIA_AUTO_UPDATE:'0'}
  });
  const data = JSON.parse((result.stdout || '').replace(/^\uFEFF/, ''));
  if (result.error || result.status !== 0 || !data?.ok || data.name !== 'sealseek-media' || data.version !== pkg.version || typeof data.source !== 'string') {
    throw Object.assign(new Error('Canonical Skill discovery did not verify this installed runtime.'), {code:'DEPENDENCY_DISCOVERY_FAILED'});
  }
  const canonical = fs.realpathSync(data.source);
  if (!canonical.startsWith(runtime + path.sep) || !/^name:\s*sealseek-media\s*$/m.test(fs.readFileSync(path.join(canonical, 'SKILL.md'), 'utf8'))) {
    throw Object.assign(new Error('Canonical Skill source must belong to this runtime.'), {code:'DEPENDENCY_IDENTITY_MISMATCH'});
  }
  console.log(JSON.stringify({ok:true, package:pkg.name, version:pkg.version, skill_root:root, canonical_source:canonical,
    invocation:{command:process.execPath, args:[launcher], binding_args:['--agent',agent,'--skill-path',root]},
    service_access:'not-checked', generation_tested:false}, null, 2));
} catch (error) {
  console.error(JSON.stringify({ok:false, code:error.code || 'DEPENDENCY_INVALID', message:error.message,
    action:'Resolve the current host installed sealseek-media Skill; repair its managed runtime if missing.'}));
  process.exitCode = 1;
}
