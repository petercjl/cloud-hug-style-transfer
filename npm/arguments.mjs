import fs from 'node:fs';
import path from 'node:path';
import { root, fail } from './runtime.mjs';
export const manifest=JSON.parse(fs.readFileSync(path.join(root,'capabilities.json'),'utf8'));
export function parse(args) {
 const tokens=[...args];
 if(tokens[0]==='--version')tokens[0]='version';
 if(tokens[0]==='help') {tokens.shift();tokens.push('--help');}
 const words=[];while(tokens.length&&!tokens[0].startsWith('-'))words.push(tokens.shift());
 const command=words.join(' '), contract=manifest.commandContracts[command];
 if(!command&&(!tokens.length||tokens.every(x=>['--help','-h','--json'].includes(x))))return {command:'help',options:{}};
 if(!contract)throw fail('INVALID_COMMAND','Unknown command; use --help.');
 const options={};
 while(tokens.length) {
  let flag=tokens.shift();if(flag==='-h')flag='--help';
  const spec=contract.options[flag];
  if(!spec||flag in options)throw fail('INVALID_ARGUMENT',`Unknown or duplicate option ${flag}; use ${command} --help.`);
  const value=spec.type==='boolean'?true:tokens.shift();
  if(value===undefined || (spec.type==='string'&&value.startsWith('-')))throw fail('INVALID_ARGUMENT',`${flag} needs a value.`);
  if(spec.enum&&!spec.enum.includes(value))throw fail('INVALID_AGENT',`Choose ${spec.enum.join(', ')}.`);
  options[flag]=value;
 }
 if(!options['--help']) {
  for(const [flag,spec]of Object.entries(contract.options))if(spec.required&&!options[flag])throw fail(flag==='--yes'?'PERMISSION_REQUIRED':'INVALID_ARGUMENT',`${command} requires ${flag}.`);
  if(['doctor','update check','update install'].includes(command)&&options['--root']&&!options['--agent'])throw fail('INVALID_ARGUMENT','--root requires an explicit --agent for this command.');
 }
 return {command,options,contract};
}
