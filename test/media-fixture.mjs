import fs from 'node:fs';
import path from 'node:path';
export function mediaFixture(root,{version='0.1.1',repeatable=true,missingCommand}={}) {
 fs.mkdirSync(path.join(root,'.runtime/dist'),{recursive:true});
 fs.writeFileSync(path.join(root,'SKILL.md'),'---\nname: toapiscli\ndescription: Test fixture\n---\n');
 fs.writeFileSync(path.join(root,'.runtime/package.json'),JSON.stringify({name:'@petercjl/toapiscli',version}));
 const definitions={
  'image generate':['--model','--prompt-file','--resolution','--aspect','--reference','--out-directory','--submit','--wait'],
  'task get':['--directory'],'task wait':['--directory'],
  'auth status':['--json'],'models list':['--json'],'models docs':['--model'],'prepare':['--json']
 };
 const commandContracts=Object.fromEntries(Object.entries(definitions).map(([cmd,options])=>[cmd,{options:Object.fromEntries(options.map(o=>[o,{type:'string'}]))}]));
 commandContracts['image generate'].options['--reference'].repeatable=repeatable;
 if(missingCommand)delete commandContracts[missingCommand];
 const manifest={ok:true,package:'@petercjl/toapiscli',version,skills:['toapiscli'],commandContracts};
 fs.writeFileSync(path.join(root,'.runtime/dist/cli.mjs'),`if(process.argv.slice(2).join(' ')!=='capabilities --json')process.exit(7);console.log(${JSON.stringify(JSON.stringify(manifest))});`);
 return root;
}
