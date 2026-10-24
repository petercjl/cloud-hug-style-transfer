import fs from 'node:fs';
import path from 'node:path';
import * as lifecycle from '../lifecycle/engine.mjs';
import {metadataPlan} from './metadata.mjs';
export const source=lifecycle.source;
export const inventory=dir=>lifecycle.inventory(dir,{skip:['.agent-package.json','.runtime','.cloud-hug-style-transfer-managed.json']});
export const resolveTarget=(agent='generic',targetRoot)=>lifecycle.resolveTarget({agent,root:targetRoot});
export const targetPath=(agent,targetRoot)=>resolveTarget(agent,targetRoot).target;
export const status=target=>lifecycle.status(lifecycle.resolveTarget({path:target}));
export const install=target=>lifecycle.install(lifecycle.resolveTarget({path:target}));
export function skillMetadata(target){const p=path.join(target,'agents/openai.yaml');return fs.existsSync(p)?metadataPlan(fs.readFileSync(p,'utf8')):{valid:false,missing:true};}
