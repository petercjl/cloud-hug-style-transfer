import fs from 'node:fs';
import path from 'node:path';
export function mediaFixture(root,{version='0.6.1',features=['image','reference-image','dry-run','task-record','local-artifact']}={}) {
 fs.mkdirSync(path.join(root,'skills/sealseek-media'),{recursive:true});
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'@petercjl/sealseek-media-cli',version,bin:{'sealseek-media':'cli.mjs'}}));
 fs.writeFileSync(path.join(root,'skills/sealseek-media/SKILL.md'),'---\nname: sealseek-media\ndescription: Test fixture\n---\n');
 fs.writeFileSync(path.join(root,'skills/sealseek-media/capabilities.json'),JSON.stringify({
  capabilities:[{id:'media.generate',required_features:features}],
  canvas_contract:{version:1,features:['explicit-placement','frame-batch','media-inspect'],operations:{create:'canvas create',upload:['image upload FILE --submit']},generation_options:{archive:{enum:['canvas','none']}}}
 }));
 fs.writeFileSync(path.join(root,'cli.mjs'),`console.log(JSON.stringify({ok:true,name:'sealseek-media',version:${JSON.stringify(version)},source:${JSON.stringify(path.join(root,'skills/sealseek-media'))}}));`);
 return root;
}
