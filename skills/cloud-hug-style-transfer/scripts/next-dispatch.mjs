import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Read-only advice. The caller owns real authorization, task submission and state.
export function nextDispatch(input) {
  const {mode = 'stepwise', authorized, awaiting_user, pages} = input ?? {};
  if (!['stepwise', 'batch'].includes(mode)) throw Error('Invalid mode');
  if (typeof authorized !== 'boolean' || typeof awaiting_user !== 'boolean' || !Array.isArray(pages)) throw Error('Explicit authorization, waiting state and pages required');
  const states = new Set(['pending', 'queued', 'running', 'unknown', 'succeeded', 'failed']);
  const ids = new Set();
  for (const page of pages) {
    if (!page || typeof page.page_id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(page.page_id) || ids.has(page.page_id) || !states.has(page.state)) throw Error('Invalid or duplicate page');
    ids.add(page.page_id);
  }
  const max_in_flight = mode === 'batch' ? 5 : 1;
  const active = pages.filter(p => ['queued', 'running', 'unknown'].includes(p.state));
  const blocked = !authorized ? 'not-authorized' : awaiting_user ? 'awaiting-user' : pages.some(p => p.state === 'unknown') ? 'recover-unknown' : active.length >= max_in_flight ? 'capacity' : null;
  const next_page_ids = blocked ? [] : pages.filter(p => p.state === 'pending').slice(0, max_in_flight - active.length).map(p => p.page_id);
  return {ok:true, mode, max_in_flight, in_flight:active.length, blocked, next_page_ids, submits:false};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4 || process.argv[2] !== '--input') throw Error('Usage: next-dispatch.mjs --input DISPATCH.json');
    console.log(JSON.stringify(nextDispatch(JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))), null, 2));
  } catch (e) {
    console.error(JSON.stringify({ok:false,code:'INVALID_INPUT',message:e.message}));
    process.exitCode = 1;
  }
}
