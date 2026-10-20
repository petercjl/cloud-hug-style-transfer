import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { metadataPlan } from './metadata.mjs';
import { stateRoot } from './update.mjs';
import { root, pkg, fail } from './runtime.mjs';

export const source = path.join(root, 'skills', 'cloud-hug-style-transfer');
const marker = '.cloud-hug-style-transfer-managed.json';
const metadata = 'agents/openai.yaml';
function exists(file) { try { return fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
export function inventory(dir) {
  const result = {};
  function walk(at, prefix = '') {
    for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
      if (entry.name === marker) continue;
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) throw fail('SKILL_UNSAFE_TARGET', 'Skill files must not contain symlinks.');
      if (entry.isDirectory()) walk(path.join(at, entry.name), relative + '/');
      else result[relative] = crypto.createHash('sha256').update(fs.readFileSync(path.join(at, entry.name))).digest('hex');
    }
  }
  walk(dir);
  return result;
}
export function resolveTarget(agent='codex', targetRoot) {
  if (!['codex', 'sealseek', 'workbuddy'].includes(agent)) throw fail('INVALID_AGENT', 'Choose --agent codex, sealseek or workbuddy.');
  const envName={codex:'CODEX_SKILLS_DIR',sealseek:'SEALSEEK_SKILLS_DIR',workbuddy:'WORKBUDDY_SKILLS_DIR'}[agent];
  const homeBase=agent==='codex' ? path.join(process.env.CODEX_HOME || path.join(os.homedir(),'.codex'),'skills') : agent==='sealseek' ? path.join(os.homedir(),'.sealseek','workspaces','default','skills') : path.join(os.homedir(),'.workbuddy','skills');
  const candidates=[targetRoot&&{source:'--root',root:targetRoot},process.env[envName]&&{source:envName,root:process.env[envName]},{source:agent==='codex'&&process.env.CODEX_HOME?'CODEX_HOME':'agent-default',root:homeBase}].filter(Boolean).map(v=>({...v,root:path.resolve(v.root)}));
  const selected=candidates[0];
  return {agent,target:path.join(selected.root,'cloud-hug-style-transfer'),root:selected.root,resolvedFrom:selected.source,candidates,warnings:[...new Set(candidates.filter(c=>c.root!==selected.root).map(c=>`${selected.source} takes precedence over ${c.source}.`))]};
}
export const targetPath=(agent,targetRoot)=>resolveTarget(agent,targetRoot).target;
export function skillMetadata(target) {
  const file=path.join(target,metadata);
  if(!exists(file))return {valid:false,changed:false,missing:true,warnings:['Skill UI metadata is missing.']};
  return metadataPlan(fs.readFileSync(file,'utf8'));
}
export function status(target) {
  const st = exists(target);
  if (!st) return { installed: false, managed: false, current: false, target };
  if (st.isSymbolicLink() || !st.isDirectory()) return { installed: true, managed: false, current: false, target };
  let record;
  try { record = JSON.parse(fs.readFileSync(path.join(target, marker), 'utf8')); } catch { return { installed: true, managed: false, current: false, target }; }
  if (record.package !== pkg.name || !record.files || typeof record.files !== 'object') return { installed: true, managed: false, current: false, target };
  if (Object.keys(record.files).some(file => !file || path.isAbsolute(file) || file.includes('\\') || file.split('/').some(part => ['.', '..', ''].includes(part)))) throw fail('SKILL_UNSAFE_TARGET', 'Invalid managed-file path in Skill ownership record.');
  const files = inventory(target);
  const edited = Object.entries(record.files).some(([file, hash]) => file !== metadata && files[file] !== hash);
  const expected = inventory(source);
  const ui=skillMetadata(target);
  const current = record.version === pkg.version && ui.valid && !edited && Object.entries(expected).every(([file, hash]) => file === metadata || files[file] === hash);
  return { installed: true, managed: true, current, edited, target, version: record.version, metadata:{valid:ui.valid,migrationRequired:ui.changed,warnings:ui.warnings}, record };
}
export function install(target) {
  const started=performance.now();
  let state = status(target);
  if (state.installed && !state.managed) throw fail('SKILL_UNMANAGED', 'An existing user-owned Skill occupies this target; preserve it and choose a new root or explicitly migrate it.');
  if (state.edited) throw fail('SKILL_EDITED', 'Managed Skill files contain local edits; preserve and reconcile those edits before updating.');
  const registry = path.join(stateRoot(), 'skill-targets');
  fs.mkdirSync(registry, { recursive: true });
  const registration = path.join(registry, crypto.createHash('sha256').update(target).digest('hex') + '.json');
  if (!exists(registration)) fs.writeFileSync(registration, JSON.stringify({ target }), { flag: 'wx', mode: 0o600 });
  const receipt={package:pkg.name,source,owner:'package-managed',verified:true};
  if (state.current && state.version === pkg.version) return { ...state, record: undefined, ...receipt, ok: true, changed: false, timingsMs:{total:performance.now()-started} };
  const expected = inventory(source);
  for (const file of Object.keys(expected)) {
    if (state.installed && exists(path.join(target, file)) && !(file in state.record.files) && file !== metadata) throw fail('SKILL_UNMANAGED_FILE', 'A new bundled file would overwrite a user-owned file.');
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const lock = target + '.install-lock';
  let lockfd;
  try { lockfd = fs.openSync(lock, 'wx', 0o600); } catch (e) { if (e.code === 'EEXIST') throw fail('SKILL_BUSY', 'Another Skill installation holds the lock.'); throw e; }
  let backup;
  try {
    state=status(target);
    if(state.installed&&!state.managed)throw fail('SKILL_UNMANAGED','Target ownership changed while waiting for the lock.');
    if(state.edited)throw fail('SKILL_EDITED','Target changed while waiting for the lock.');
    for(const file of Object.keys(expected))if(state.installed&&exists(path.join(target,file))&&!(file in state.record.files)&&file!==metadata)throw fail('SKILL_UNMANAGED_FILE','Target file ownership changed before the lock.');
    const ui=state.installed?skillMetadata(target):null;
    if (state.installed) {
      backup = path.join(stateRoot(), 'skill-backups', crypto.randomUUID());
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.cpSync(target, backup, { recursive: true, errorOnExist: true, force: false });
    } else fs.mkdirSync(target);
    // In-place updates support hosts holding a directory handle open. Backup is recoverable.
    for (const file of Object.keys(expected)) {
      if (file === metadata && exists(path.join(target, file))) { if(ui.changed)fs.writeFileSync(path.join(target,file),ui.text); continue; }
      fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
      fs.copyFileSync(path.join(source, file), path.join(target, file));
    }
    for (const file of Object.keys(state.record?.files || {})) {
      if (file !== metadata && !(file in expected)) fs.unlinkSync(path.join(target, file));
    }
    const actual = inventory(target);
    if (Object.entries(expected).some(([file, hash]) => file !== metadata && actual[file] !== hash)) throw fail('SKILL_VERIFY_FAILED', 'Installed Skill hashes differ from the package.');
    if(!skillMetadata(target).valid)throw fail('SKILL_VERIFY_FAILED','Skill UI metadata validation failed.');
    fs.writeFileSync(path.join(target, marker), JSON.stringify({ package: pkg.name, version: pkg.version, files: expected }, null, 2));
    return { ...receipt, metadata:{valid:true,migrated:ui?.changed||false}, warnings:ui?.warnings||[], timingsMs:{total:performance.now()-started}, ok: true, installed: true, managed: true, current: true, changed: true, target, version: pkg.version, backup: backup || null };
  } catch (e) {
    throw Object.assign(fail('SKILL_INSTALL_FAILED', `Skill installation failed; ${backup ? 'restore from ' + backup : 'inspect the partial target at ' + target}.`),{causeCode:e.code,backup:backup||null,target});
  } finally { fs.closeSync(lockfd); fs.unlinkSync(lock); }
}
