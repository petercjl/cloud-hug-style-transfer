import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Modified for WorkBuddy migration: honor explicitly requested directions.
const keyPattern = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const fail = message => { throw new Error(message); };

// Enumerates files only. It neither infers products nor grants generation approval.
export function planInventory(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Expected an input object.');
  const {groups, mode = 'assets', selected_pages, directions = ['A', 'B', 'C']} = input;
  if (!Array.isArray(directions) || !directions.length || new Set(directions).size !== directions.length || directions.some(v => typeof v !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(v))) fail('directions must be a nonempty list of unique safe names.');
  if (!['assets', 'pages'].includes(mode)) fail('mode must be assets or pages.');
  if (!Array.isArray(groups) || !groups.length) fail('groups must contain at least one confirmed shape group.');
  const seenGroups = new Set(), seenVariants = new Set();
  for (const group of groups) {
    if (!group || typeof group.id !== 'string' || !keyPattern.test(group.id) || seenGroups.has(group.id)) fail('Each group needs a unique ASCII id.');
    seenGroups.add(group.id);
    if (!Array.isArray(group.variants) || !group.variants.length) fail('Each group needs at least one variant id.');
    for (const variant of group.variants) {
      if (typeof variant !== 'string' || !keyPattern.test(variant) || seenVariants.has(variant)) fail('Variant ids must be unique ASCII keys.');
      seenVariants.add(variant);
    }
  }
  const single = id => ({page_id:id, template:id, group_id:null, slots:['main']});
  const pages = [
    ...['03','04','05','06'].map(single),
    ...groups.map(group => ({page_id:`07_${group.id}`, template:'07-10', group_id:group.id, slots:['top','bottom-left','bottom-right']})),
    single('11'),
    {page_id:'12', template:'12', group_id:null, slots:['top-left','top-right','bottom-left','bottom-right']},
    ...['13','14','15'].map(single)
  ];
  const allowed = new Set(pages.map(page => page.page_id));
  let requested = allowed;
  if (selected_pages !== undefined) {
    if (!Array.isArray(selected_pages) || !selected_pages.length || new Set(selected_pages).size !== selected_pages.length) fail('selected_pages must be a nonempty list of unique page ids.');
    for (const id of selected_pages) if (!allowed.has(id)) fail(`Unknown or excluded page: ${id}`);
    requested = new Set(selected_pages);
  }
  const selected = pages.filter(page => requested.has(page.page_id));
  const outputs = [];
  for (const page of selected) {
    for (const direction of directions) {
      for (const slot of mode === 'pages' ? ['page'] : page.slots) {
        outputs.push({page_id:page.page_id, template:page.template, group_id:page.group_id, direction, slot, file_key:`${page.page_id}_${direction}_${slot}`});
      }
    }
  }
  return {
    ok:true,
    generation_authorized:false,
    note:'Inventory only; require confirmed products, approved plans and selected generation scope before execution.',
    mode,
    shape_groups:groups.length,
    product_cards:seenVariants.size,
    all_page_count:pages.length,
    selected_page_count:selected.length,
    selected_photo_slots:selected.reduce((sum, page) => sum + page.slots.length, 0),
    output_count:outputs.length,
    excluded_templates:['01','02','16','17','18','19'],
    pages:selected,
    outputs
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== '--input') fail('Usage: node plan-inventory.mjs --input INVENTORY.json');
    const input = JSON.parse(fs.readFileSync(args[1], 'utf8').replace(/^\uFEFF/, ''));
    console.log(JSON.stringify(planInventory(input), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ok:false, code:'INVALID_INPUT', message:error.message}));
    process.exitCode = 1;
  }
}
