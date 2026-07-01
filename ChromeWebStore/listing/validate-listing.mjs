/**
 * Validates Chrome Web Store listing text limits before submission.
 * Usage: node validate-listing.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LIMITS = [
  { file: 'short-description.txt', max: 132, label: 'Short description' }
];

let failed = false;

for (const { file, max, label } of LIMITS) {
  const text = fs.readFileSync(path.join(__dirname, file), 'utf8').trim();
  const len = text.length;

  if (len > max) {
    console.error(`✗ ${label}: ${len}/${max} chars (${len - max} over limit)`);
    console.error(`  ${text}`);
    failed = true;
  } else {
    console.log(`✓ ${label}: ${len}/${max} chars`);
  }
}

if (failed) process.exit(1);
