import {assetDependency,inspectAssetSet,selectAssetReferences} from './asset-set.mjs';
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i+=2){if(!['--skill-root','--guide','--ids'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--')||options[args[i]]){console.log(JSON.stringify({ok:false,code:'INVALID_ARGUMENT',message:'Use --skill-root PATH, --guide FILE and optional --ids A01,A02.'}));process.exit(1);}options[args[i]]=args[i+1];}
let result=options['--guide']?inspectAssetSet(options['--guide'],{skillRoot:options['--skill-root']}):assetDependency({skillRoot:options['--skill-root']});
if(options['--ids'])result=options['--guide']?selectAssetReferences(result,options['--ids'].split(',')):{ok:false,code:'ASSET_GUIDE_REQUIRED'};
console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
