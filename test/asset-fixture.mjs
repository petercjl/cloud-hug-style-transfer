import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const entry=path.resolve(import.meta.dirname,'../node_modules/@petercjl/product-asset-set/bin/product-asset-set.mjs');
export function assetFixture(root){
 const r=spawnSync(process.execPath,[entry,'skill','install','--agent','generic','--target',root,'--json'],{encoding:'utf8',env:{...process.env,AGENT_PACKAGE_UPDATE_CHECK:'0'}});
 if(r.status!==0)throw Error(r.stdout+r.stderr);return root;
}
