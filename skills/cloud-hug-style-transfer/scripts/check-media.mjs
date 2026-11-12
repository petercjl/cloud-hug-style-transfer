import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {mediaDependency} from './media-dependency.mjs';
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--skill-root' && args[1])) {
 console.error(JSON.stringify({ok:false,code:'INVALID_ARGUMENTS',message:'Usage: node check-media.mjs [--skill-root EXACT_TOAPIS_SKILL_DIRECTORY]'}));
 process.exit(1);
}
const self = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const result = mediaDependency({skillRoot:args[1] || process.env.CLOUD_HUG_TOAPIS_SKILL_ROOT || path.resolve(self,'../toapiscli')});
console.log(JSON.stringify(result,null,2));
process.exitCode = result.ok ? 0 : 1;
