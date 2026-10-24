import * as lifecycle from '../lifecycle/engine.mjs';
export const stateRoot=()=>process.env.CLOUD_HUG_STATE_DIR||lifecycle.root;
export const globalPrefix=()=>null;
export const newer=lifecycle.newer;
export const checkUpdate=()=>Promise.resolve(lifecycle.checkUpdate());
export const installUpdate=(check,services={})=>{if(!services.resolution)throw lifecycle.fail('TARGET_PATH_REQUIRED','Resolve the selected Skill destination.');return lifecycle.update(services.resolution,{yes:true,version:check.available});};
