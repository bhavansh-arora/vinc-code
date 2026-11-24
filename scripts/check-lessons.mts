/**
 * Proves every lesson: the model solution passes and the starter code does not.
 * Block lessons (Classes 3–4) run with src/lib/blocks.ts; Python lessons (Classes 5–8) need python3.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { LESSONS, LESSON_GRADES, parOf } = await import('../src/data/lessons');
const { checkBlocks, parseBlocks, countBlocks, blockStars } = await import('../src/lib/blocks');
const { CREW } = await import('../src/lib/crew');

let bad = 0;
const fail = (id: string, msg: string) => { bad++; console.log('✗', id, msg); };
const ids = new Set<string>();
for (const l of LESSONS) { if (ids.has(l.id)) fail(l.id, 'duplicate id'); ids.add(l.id); }
for (const g of LESSON_GRADES) {
  const n = LESSONS.filter(l => l.grade === g).length;
  if (n < 12) fail(`Class ${g}`, `has only ${n} lessons`);
  if (!LESSONS.some(l => l.grade === g && l.type === 'Boss')) fail(`Class ${g}`, 'has no boss lesson');
}
const crewIds = new Set(CREW.map(c => c.id));

const blocks = LESSONS.filter(l => l.check.kind === 'blocks');
for (const l of blocks) {
  if (l.check.kind !== 'blocks') continue;
  if (l.guide && !crewIds.has(l.guide)) fail(l.id, 'unknown guide ' + l.guide);
  const widths = l.check.maps.map(m => new Set(m.map(r => r.length)).size);
  if (widths.some(w => w !== 1)) fail(l.id, 'a board has rows of different lengths');
  for (const m of l.check.maps) if (m.join('').replace(/[^\^>v<]/g, '').length !== 1) fail(l.id, 'a board needs exactly one Vinc');
  const sol = parseBlocks(l.solution), start = parseBlocks(l.starter);
  const used = new Set([...l.solution.matchAll(/(step|turnLeft|turnRight|jump|repeat)/g)].map(m => m[1]));
  for (const u of used) if (!l.palette?.includes(u as never)) fail(l.id, `solution uses ${u}, which is not in the palette`);
  const rs = checkBlocks(l.check, sol);
  if (!rs.passed) fail(l.id, 'model solution fails: ' + (rs.missing.join(' ') || rs.error));
  else if (blockStars(rs.blocks, parOf(l)) !== 3) fail(l.id, 'model solution does not earn 3 stars');
  const rt = checkBlocks(l.check, start);
  if (rt.passed) fail(l.id, 'starter already passes');
  if (l.example) parseBlocks(l.example.code);
  void countBlocks;
}
console.log(`${blocks.length} block lessons checked`);

const py = LESSONS.filter(l => l.check.kind !== 'blocks');
const file = path.join(os.tmpdir(), 'vinc-lessons.json');
fs.writeFileSync(file, JSON.stringify(py));
try {
  execFileSync('python3', [path.join(import.meta.dirname, 'verify_lessons.py'), file], { stdio: 'inherit' });
} catch { bad++; }
if (bad) { console.log(`\n${bad} problem(s)`); process.exit(1); }
console.log('All lessons OK');
