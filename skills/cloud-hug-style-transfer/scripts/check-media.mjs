import {mediaDependency} from './media-dependency.mjs';

const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--package-root' && args[1])) {
  console.error(JSON.stringify({ok:false, code:'INVALID_ARGUMENTS', message:'Usage: node check-media.mjs [--package-root VERIFIED_PACKAGE_ROOT]'}));
  process.exit(1);
}
const result = mediaDependency({packageRoot: args[1]});
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.ok ? 0 : 1;
