/** Proves every lesson: the model solution passes and the starter code does not. Needs python3. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { LESSONS, LESSON_GRADES } = await import('../src/data/lessons');

const ids = new Set<string>();
for (const l of LESSONS) { if (ids.has(l.id)) throw new Error('Duplicate lesson id ' + l.id); ids.add(l.id); }
for (const g of LESSON_GRADES) {
  const n = LESSONS.filter(l => l.grade === g).length;
  if (n < 12) throw new Error(`Class ${g} has only ${n} lessons`);
}
const file = path.join(os.tmpdir(), 'vinc-lessons.json');
fs.writeFileSync(file, JSON.stringify(LESSONS));
try {
  execFileSync('python3', [path.join(import.meta.dirname, 'verify_lessons.py'), file], { stdio: 'inherit' });
} catch { process.exit(1); }
