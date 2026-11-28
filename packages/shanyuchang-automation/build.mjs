import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const dist = path.join(here, 'dist');
const check = process.argv[2] === '--check';
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'package.json'), 'utf8'));
const { name, version, skillLifecycle } = manifest;
const skill = `skills/${skillLifecycle.skill}`;
const components = [
  '2026-11-28-shanyuchang-zidonghua',
  '2026-11-24-shanyuchang-pinpai-diaoxing',
  '2026-11-28-shanyuchang-banshi',
];
const packageFiles = ['bin', 'skills', 'lifecycle', 'capabilities.json', 'README.md', 'INSTALL.md', 'UPDATE.md', 'LICENSE', 'release-integrity.json'];
const json = (body) => JSON.stringify(body, null, 2) + '\n';
const digest = (data) => createHash('sha256').update(data).digest('hex');
const payload = new Map();

function include(file, data, mode = 0o644) {
  if (payload.has(file)) throw Error('Duplicate package member: ' + file);
  payload.set(file, { data: Buffer.from(data), mode });
}

function sourceFile(file, destination = file, transform) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error('Expected a regular source file: ' + file);
  const data = fs.readFileSync(file);
  include(destination, transform ? transform(data.toString('utf8')) : data, stat.mode & 0o111 ? 0o755 : 0o644);
}

function copyComponents() {
  const files = execFileSync('git', ['ls-files', '-z', '--', ...components.map((id) => 'skills/' + id)], { cwd: repo })
    .toString('utf8').split('\0').filter(Boolean);
  for (const component of components) {
    if (!files.includes(`skills/${component}/SKILL.md`)) throw Error('Missing tracked component ' + component);
  }
  for (const file of files) {
    const relative = file.slice('skills/'.length);
    // The bundle's chapters are served through the single public Skill entry.
    if (relative.includes('/agents/')) continue;
    const destination = `${skill}/bundle/${relative.replace(/\/SKILL\.md$/, '/workflow.md')}`;
    const transform = /\.(md|json)$/.test(file) ? (text) => text
      .replace(/\/SKILL\.md(?=[#)])/g, '/workflow.md')
      .replaceAll('madao_approved_positive_example', 'brand_approved_positive_example')
      .replaceAll('madao 原话', '品牌调性要求')
      .replaceAll('madao', '品牌负责人') : undefined;
    sourceFile(path.join(repo, file), destination, transform);
  }
}

function writePayload(directory) {
  for (const [file, entry] of payload) {
    const destination = path.join(directory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, entry.data, { mode: entry.mode, flag: 'wx' });
  }
}

function installedBuildInventory(directory) {
  const found = [];
  function readDirectory(prefix = '') {
    for (const item of fs.readdirSync(path.join(directory, prefix), { withFileTypes: true })) {
      const member = prefix ? prefix + '/' + item.name : item.name;
      if (item.isDirectory()) readDirectory(member);
      else if (item.isFile()) found.push(member);
      else throw Error('Unexpected generated entry: ' + member);
    }
  }
  readDirectory();
  return found.sort();
}

function currentBuild() {
  let stat;
  try { stat = fs.lstatSync(dist); } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('Preserving non-directory dist target');
  const files = installedBuildInventory(dist);
  if (JSON.stringify(files) !== JSON.stringify([...payload.keys()].sort())) return false;
  return files.every((file) => fs.readFileSync(path.join(dist, file)).equals(payload.get(file).data));
}

function verifyPreviousBuild() {
  const marker = '.generated-shanyuchang';
  const integrity = 'release-integrity.json';
  const files = installedBuildInventory(dist);
  if (!files.includes(marker) || fs.readFileSync(path.join(dist, marker), 'utf8') !== name + '\n' ||
      !files.includes(integrity)) throw Error('Preserving unmanaged dist directory.');
  const previous = JSON.parse(fs.readFileSync(path.join(dist, integrity), 'utf8'));
  const members = files.filter((file) => ![marker, integrity].includes(file));
  if (previous.package !== name || JSON.stringify(members) !== JSON.stringify(Object.keys(previous.files).sort()) ||
      members.some((file) => digest(fs.readFileSync(path.join(dist, file))) !== previous.files[file])) {
    throw Error('Preserving edited dist directory.');
  }
}

const distribution = { ...manifest, files: packageFiles };
delete distribution.private;
distribution.scripts = {
  check: 'node ../build.mjs --check && node lifecycle/validate-release.mjs',
  test: 'node --test ../test/*.test.mjs',
  prepack: 'node ../build.mjs --check && node lifecycle/validate-release.mjs',
  postinstall: 'node lifecycle/notice.mjs',
};
include('package.json', json(distribution));
for (const file of ['README.md', 'INSTALL.md', 'UPDATE.md', skillLifecycle.entry]) sourceFile(path.join(here, file), file);
for (const file of ['LICENSE', 'lifecycle/engine.mjs', 'lifecycle/validate-release.mjs', 'lifecycle/notice.mjs']) {
  sourceFile(path.join(repo, file), file);
}
sourceFile(path.join(here, 'SKILL.template.md'), skill + '/SKILL.md', (text) => text.replace('__PACKAGE_VERSION__', version));
sourceFile(path.join(here, 'agents.yaml'), skill + '/agents/openai.yaml');
sourceFile(path.join(repo, 'skills', components[0], 'assets/icon.svg'), skill + '/assets/icon.svg');
include(skill + '/scripts/run.mjs', `#!/usr/bin/env node
await import('../.runtime/${skillLifecycle.entry}');
`, 0o755);
copyComponents();

// Import the shared lifecycle against this package's declaration without duplicating its schema.
const scratch = check ? undefined : fs.mkdtempSync(path.join(here, '.build-'));
try {
  const metadataRoot = scratch || dist;
  for (const file of ['package.json', 'lifecycle/engine.mjs']) {
    const destination = path.join(metadataRoot, file);
    if (check) {
      if (!fs.existsSync(destination) || !fs.readFileSync(destination).equals(payload.get(file).data)) {
        throw Error('Distribution differs from source. Run npm run build in the package source.');
      }
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, payload.get(file).data, { flag: 'wx' });
    }
  }
  const lifecycle = await import(pathToFileURL(path.join(metadataRoot, 'lifecycle/engine.mjs')).href);
  const common = { '--json': { type: 'boolean' }, '--help': { type: 'boolean' } };
  const python = { '--python': { type: 'string', description: 'Current Agent Python executable.' } };
  const capabilities = {
    schemaVersion: 1, package: name, package_version: version,
    skills: [skillLifecycle.skill],
    target_platforms: ['generic'],
    host_resolution: { fallback_adapter: 'generic', explicit_target_path_required: true },
    installationLifecycle: lifecycle.installationLifecycle,
    discoveryContract: lifecycle.discoveryContract(),
    maintenanceContract: lifecycle.maintenanceContract,
    commandContracts: {
      version: { options: common, sideEffects: 'none' },
      capabilities: { options: common, sideEffects: 'none' },
      doctor: { options: { ...common, ...python }, sideEffects: 'none' },
      'task preflight': {
        options: { ...common, ...python },
        sideEffects: 'package-and-skill-update',
        writeCondition: 'Caches bounded detection by default. Replaces only a resolved target with standing authorization and a compatible stable release.',
      },
      ...lifecycle.commandContracts(),
    },
    dependencies: {
      management: ['Node.js >=22', 'npm'],
      offlineLayout: ['Python >=3.9', 'Pillow', 'NumPy'],
      imageGeneration: ['toapiscli'],
    },
    automaticUpdates: {
      enabledByDefault: true,
      defaultMode: 'notify',
      intervalHours: 24,
      timeoutMs: 2000,
      trigger: 'task preflight',
      configuration: 'update policy --mode off|notify|auto --yes --path EXACT_SKILL_DIR',
      disable: 'SHANYUCHANG_AUTOMATION_AUTO_UPDATE=0',
      installation: 'explicit-standing-authorization',
      recovery: 'Inspect update operation and resume the recorded candidate.',
    },
  };
  include('capabilities.json', json(capabilities));
  include(skill + '/capabilities.json', json(capabilities));
  include(skill + '/adapters/generic.json', json({
    agent: 'generic',
    target: { resolution: 'current-agent', option: '--path', kind: 'skill-directory' },
    discovery: 'current-agent-native',
    dependencies: capabilities.dependencies,
  }));
  const hashes = Object.fromEntries([...payload].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([file, entry]) => [file, digest(entry.data)]));
  include('release-integrity.json', json({ package: name, version, files: hashes }));
  include('.generated-shanyuchang', name + '\n');
  if (currentBuild()) {
    console.log(`${name}@${version} distribution is current.`);
  } else if (check) {
    throw Error('Distribution differs from source. Run npm run build in the package source.');
  } else {
    const staged = path.join(scratch, 'dist');
    writePayload(staged);
    const previous = path.join(scratch, 'previous');
    if (fs.existsSync(dist)) {
      verifyPreviousBuild();
      fs.renameSync(dist, previous);
    }
    try { fs.renameSync(staged, dist); } catch (error) {
      if (fs.existsSync(previous)) fs.renameSync(previous, dist);
      throw error;
    }
    console.log(`${name}@${version} built (${payload.size - 1} package files).`);
  }
} finally {
  if (scratch) fs.rmSync(scratch, { recursive: true, force: true });
}
