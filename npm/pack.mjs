import path from 'node:path';
import { pkg, fail } from './runtime.mjs';
export function packReceipt(text) {
 let value;try{value=JSON.parse(text);}catch{throw fail('UPDATE_BACKUP_FAILED','npm pack did not return valid JSON.');}
 const receipt=Array.isArray(value)&&value.length===1?value[0]:value?.[pkg.name];
 if(!receipt||typeof receipt.filename!=='string'||!receipt.filename.endsWith('.tgz')||receipt.filename.includes('\\')||path.basename(receipt.filename)!==receipt.filename||(receipt.name&&receipt.name!==pkg.name))throw fail('UPDATE_BACKUP_FAILED','Invalid npm pack receipt.');
 return receipt;
}
