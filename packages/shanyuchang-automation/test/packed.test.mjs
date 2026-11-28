import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const dist = path.resolve(import.meta.dirname, '../dist');
const repo = path.resolve(import.meta.dirname, '../../..');
const pkg = JSON.parse(fs.readFileSync(path.join(dist, 'package.json'), 'utf8'));
const npm = process.env.npm_execpath;
const python = process.env.SHANYUCHANG_AUTOMATION_PYTHON || 'python3';
const env = {
  ...process.env,
  SHANYUCHANG_AUTOMATION_AUTO_UPDATE: '0',
  npm_config_fetch_retries: '0',
};
const srcLayout = path.join(repo, 'skills/2026-11-28-shanyuchang-banshi');
const smoke = path.join(import.meta.dirname, 'layout_smoke.py');

function invoke(executable, args, expected = 0, extra = {}) {
  const result = spawnSync(executable, args, { encoding: 'utf8', env, timeout: 45000, ...extra });
  assert.equal(result.status, expected, result.error?.message || result.stderr + result.stdout);
  return result.stdout;
}
function npmRun(args, cwd) {
  return invoke(process.execPath, [npm, ...args], 0, { cwd });
}
function receipt(entry, args, expected = 0, extra) {
  return JSON.parse(invoke(process.execPath, [entry, ...args, '--json'], expected, extra));
}
function pack(cwd, target) {
  const response = JSON.parse(npmRun(['pack', '--ignore-scripts', '--json', '--pack-destination', target], cwd));
  return (Array.isArray(response) ? response[0] : response[pkg.name]);
}

test('project sources produce detail and commercial images', () => {
  assert.match(invoke(python, [smoke, srcLayout]), /"detail": 7/);
});

test('packed installation, cross-version update, rollback and independent runtime', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'shanyuchang-package-'));
  env.SHANYUCHANG_AUTOMATION_STATE_DIR = path.join(temp, 'state');
  try {
    const bootstrap = path.join(temp, 'bootstrap');
    const packed = pack(dist, temp);
    const tarball = path.join(temp, packed.filename);
    const files = packed.files.map(({ path: file }) => file);
    assert.deepEqual(files.filter((file) => file.endsWith('/SKILL.md')), ['skills/shanyuchang-automation/SKILL.md']);
    assert.ok(!files.some((file) => /cloud-hug-style-transfer|shanyuchang-diaodu|(?:^|\/)(?:\.git|node_modules|test)(?:\/|$)/.test(file)));
    const integrity = JSON.parse(fs.readFileSync(path.join(dist, 'release-integrity.json'), 'utf8'));
    assert.deepEqual(files.filter((file) => file !== 'release-integrity.json').sort(), Object.keys(integrity.files).sort());

    npmRun(['install', '--prefix', bootstrap, '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', tarball], temp);
    const packageRoot = path.join(bootstrap, 'node_modules', ...pkg.name.split('/'));
    const entry = path.join(packageRoot, pkg.skillLifecycle.entry);
    const spec = receipt(entry, ['capabilities']);
    assert.equal(spec.package_version, pkg.version);
    const { ok, ...help } = receipt(entry, ['--help']);
    assert.equal(ok, true);
    assert.deepEqual(help, spec);
    assert.equal(receipt(entry, ['version']).version, pkg.version);
    const selected = receipt(entry, ['skill', 'source', '--all']).sources;
    assert.deepEqual(selected.map((item) => item.name), [pkg.skillLifecycle.skill]);
    assert.equal(receipt(entry, ['skill', 'source', '--name', pkg.skillLifecycle.skill]).source, selected[0].source);
    assert.equal(receipt(entry, ['skill', 'install', '--agent', 'arbitrary-agent'], 1).code, 'TARGET_PATH_REQUIRED');

    const a = path.join(temp, 'agent-a', pkg.skillLifecycle.skill);
    const b = path.join(temp, 'agent-b', pkg.skillLifecycle.skill);
    const options = (target) => ['--agent', 'arbitrary-agent', '--path', target];
    const runA = path.join(a, 'scripts/run.mjs');
    const runB = path.join(b, 'scripts/run.mjs');
    const installA = receipt(entry, ['skill', 'install', ...options(a)]);
    assert.equal(installA.verified, true);
    assert.equal(installA.hostDiscovery, 'pending');
    assert.equal(receipt(entry, ['skill', 'install', ...options(a)]).changed, false);
    assert.equal(receipt(entry, ['skill', 'install', ...options(b)]).verified, true);
    assert.equal(fs.lstatSync(a).isSymbolicLink(), false);
    assert.notEqual(fs.statSync(runA).ino, fs.statSync(runB).ino);
    assert.equal(receipt(runA, ['skill', 'status', ...options(a)]).current, true);
    assert.equal(receipt(runA, ['doctor', '--python', python]).layout.ok, true);
    assert.equal(receipt(runA, ['task', 'preflight', '--python', python]).automaticUpdate.state, 'disabled');
    assert.equal(receipt(runA, ['doctor', '--python', path.join(temp, 'missing-python')], 1).layout.code, 'LAYOUT_DEPENDENCY_MISSING');
    const updateProbe = path.join(temp, 'mock-registry.mjs');
    fs.writeFileSync(updateProbe, `
      globalThis.fetch = async (url) => {
        if (String(url) !== 'https://registry.npmjs.org/' + encodeURIComponent(${JSON.stringify(pkg.name)}) + '/latest') {
          throw Error('Unexpected request');
        }
        return Response.json({ name: ${JSON.stringify(pkg.name)}, version: '99.0.0' });
      };
    `, { flag: 'wx' });
    const automaticEnv = {
      ...env, SHANYUCHANG_AUTOMATION_AUTO_UPDATE: '1',
      NODE_OPTIONS: `--import ${JSON.stringify(updateProbe)}`,
    };
    const preflight = ['task', 'preflight', '--python', python];
    assert.equal(receipt(runA, preflight, 0, { env: automaticEnv }).automaticUpdate.state, 'update-available');
    assert.equal(receipt(runA, preflight, 0, { env: automaticEnv }).automaticUpdate.state, 'cached');
    assert.equal(receipt(runA, ['version']).version, pkg.version);

    const unmanaged = path.join(temp, 'unmanaged');
    fs.mkdirSync(unmanaged);
    fs.writeFileSync(path.join(unmanaged, 'snapshot'), 'user data', { flag: 'wx' });
    assert.equal(receipt(entry, ['skill', 'install', ...options(unmanaged)], 1).code, 'UNMANAGED_TARGET');

    const edited = path.join(a, 'SKILL.md');
    const original = fs.readFileSync(edited);
    fs.appendFileSync(edited, '\nlocal edit\n');
    assert.equal(receipt(runA, ['update', 'install', '--yes', '--candidate', tarball, ...options(a)], 1).code, 'LOCAL_EDITS');
    fs.writeFileSync(edited, original);

    const candidate = path.join(temp, 'candidate');
    fs.cpSync(dist, candidate, { recursive: true });
    const next = pkg.version.replace(/\.(\d+)$/, (_, patch) => '.' + (Number(patch) + 1));
    const candidateFiles = ['package.json', 'capabilities.json', 'skills/shanyuchang-automation/SKILL.md', 'skills/shanyuchang-automation/capabilities.json'];
    for (const file of candidateFiles) {
      const full = path.join(candidate, file);
      const body = fs.readFileSync(full, 'utf8').replaceAll(pkg.version, next);
      fs.writeFileSync(full, body);
      integrity.files[file] = createHash('sha256').update(body).digest('hex');
    }
    fs.writeFileSync(path.join(candidate, 'release-integrity.json'), JSON.stringify({ ...integrity, version: next }));
    const candidateTarball = path.join(temp, pack(candidate, temp).filename);
    receipt(runA, ['update', 'install', '--yes', '--candidate', candidateTarball, ...options(a)]);
    assert.equal(receipt(runA, ['version']).version, next);
    assert.equal(receipt(runB, ['version']).version, pkg.version);
    const operation = receipt(runA, ['update', 'operation', ...options(a)]);
    assert.ok(operation.backup);
    receipt(runA, ['update', 'rollback', '--yes', '--operation', operation.id, ...options(a)]);
    assert.equal(receipt(runA, ['version']).version, pkg.version);
    fs.rmSync(bootstrap, { recursive: true });
    fs.rmSync(b, { recursive: true });
    assert.equal(receipt(runA, ['skill', 'status', ...options(a)]).current, true);
    const layout = path.join(a, 'bundle', '2026-11-28-shanyuchang-banshi');
    assert.match(invoke(python, [smoke, layout]), /"detail": 7/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
