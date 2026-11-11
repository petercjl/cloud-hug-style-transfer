import fs from 'node:fs';
import {comparisonRow} from './comparison-layout.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--input') throw new Error('Usage: node canvas-row.mjs --input ROW.json');
  const input = JSON.parse(fs.readFileSync(args[1], 'utf8').replace(/^\uFEFF/, ''));
  console.log(JSON.stringify(comparisonRow(input), null, 2));
} catch (error) {
  console.error(JSON.stringify({ok:false, code:error.code || 'INVALID_INPUT', message:error.message}));
  process.exitCode = 1;
}
