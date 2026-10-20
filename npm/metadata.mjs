import { parseDocument } from 'yaml';
import { fail } from './runtime.mjs';
const allowed=new Set(['chatgpt','codex','atlas','CHATGPT','CODEX','ATLAS']);
export function metadataPlan(text) {
 const doc=parseDocument(text,{uniqueKeys:true});
 if(doc.errors.length)throw fail('SKILL_METADATA_INVALID','Invalid agents/openai.yaml; preserve and repair the YAML before updating.');
 const value=doc.toJS();
 if(!value||typeof value!=='object'||Array.isArray(value))throw fail('SKILL_METADATA_INVALID','Skill metadata must be a mapping.');
 if(value.interface!==undefined&&(!value.interface||typeof value.interface!=='object'||Array.isArray(value.interface)||Object.values(value.interface).some(v=>typeof v!=='string')))throw fail('SKILL_METADATA_INVALID','Skill interface values must be strings.');
 if(value.policy!==undefined&&(!value.policy||typeof value.policy!=='object'||Array.isArray(value.policy)))throw fail('SKILL_METADATA_INVALID','Skill policy must be a mapping.');
 const policy=value.policy;
 if(policy?.allow_implicit_invocation!==undefined&&typeof policy.allow_implicit_invocation!=='boolean')throw fail('SKILL_METADATA_INVALID','allow_implicit_invocation must be boolean.');
 const products=policy?.products;
 if(products!==undefined&&(!Array.isArray(products)||products.some(p=>!allowed.has(p)&&p!=='api')))throw fail('SKILL_METADATA_INVALID','Unsupported policy.products; preserve and resolve the custom policy before updating.');
 const changed=products?.includes('api')||false;
 if(changed){const valid=products.filter(p=>p!=='api');if(!valid.length)throw fail('SKILL_METADATA_INVALID','Removing api would leave an empty custom product policy.');doc.setIn(['policy','products'],valid);}
 return {valid:!changed,changed,text:changed?doc.toString():text,warnings:changed?['Removed unsupported legacy api product; custom interface and other policy fields preserved.']:[]};
}
