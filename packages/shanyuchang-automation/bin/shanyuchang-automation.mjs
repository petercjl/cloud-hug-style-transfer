#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import * as lifecycle from '../lifecycle/engine.mjs';

const { args, error, options, words } = parseEntry(process.argv.slice(2));
const { automatic, dispatch, pkg, resolveTarget, root } = lifecycle;

function parseEntry(args) {
  if (args[0] === '--version') args[0] = 'version';
  if (['skill', 'update'].includes(args[0])) return { args };
  try {
    return { args, ...lifecycle.parse(args) };
  } catch (error) {
    return { error };
  }
}

function readCapabilities() {
  return JSON.parse(fs.readFileSync(path.join(root, 'capabilities.json'), 'utf8'));
}

function packageVersion() {
  return { ok: true, name: pkg.name, version: pkg.version, entry: process.argv[1] };
}

function doctor(python = process.env.SHANYUCHANG_AUTOMATION_PYTHON || 'python3') {
  const probe = spawnSync(python, ['-c', 'import sys, PIL, numpy; assert sys.version_info >= (3, 9); print(sys.version.split()[0], PIL.__version__, numpy.__version__)'], {
    encoding: 'utf8', timeout: 5000, windowsHide: true,
  });
  const [pythonVersion, pillow, numpy] = (probe.stdout || '').trim().split(/\s+/);
  const layout = { ok: probe.status === 0, command: python, python: pythonVersion, pillow, numpy };
  if (!layout.ok) {
    layout.code = 'LAYOUT_DEPENDENCY_MISSING';
    layout.recovery = 'Resolve Python 3.9+ with Pillow and NumPy, then retry doctor --python EXECUTABLE.';
  }
  return {
    ...packageVersion(), ok: layout.ok, layout,
    media: { state: 'requires-current-agent-capability', capability: 'toapiscli', requiredFor: 'image generation' },
  };
}

async function run() {
  if (error) throw error;
  if (await dispatch(args)) return null;
  const command = words.join(' ');
  const capability = readCapabilities();
  if (!command || ['help', '-h'].includes(command)) {
    return { ok: true, ...capability };
  }
  const contract = capability.commandContracts[command];
  if (!contract || !['version', 'capabilities', 'doctor', 'task preflight'].includes(command)) {
    throw lifecycle.fail('INVALID_COMMAND', 'Use --help to list the management commands.');
  }
  for (const flag of Object.keys(options)) {
    if (!(Object.hasOwn(contract.options, '--' + flag))) {
      throw lifecycle.fail('INVALID_ARGUMENT', 'Unknown option --' + flag);
    }
  }
  if (options.help) return { ok: true, command, ...contract };
  if (command === 'version') return packageVersion();
  if (command === 'capabilities') return capability;
  const result = doctor(options.python);
  if (command !== 'task preflight') return result;
  const parent = path.dirname(root);
  const target = path.basename(root) === '.runtime' && fs.existsSync(path.join(parent, '.agent-package.json'))
    ? resolveTarget({ path: parent })
    : undefined;
  return { ...result, automaticUpdate: await automatic(target) };
}

try {
  const result = await run();
  if (result) {
    console.log(JSON.stringify(result, null, 2));
    if (result.ok === false) process.exitCode = 1;
  }
} catch (error) {
  console.log(JSON.stringify({ ok: false, code: error.code || 'MANAGEMENT_FAILED', message: error.message }, null, 2));
  process.exitCode = 1;
}
