/**
 * Proves every assessment answer that can be computed, by running the code on the board.
 * Run: npm run check:content
 */
import type { Question } from '../src/data/assessments';
const { ASSESSMENTS } = await import('../src/data/assessments');

const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
type Tok = { t: string; n?: number; line?: number };

function parseCode(lines: string[]): Tok[] {
  const out: Tok[] = []; const stack: number[] = [];
  lines.forEach((raw, i) => {
    const depth = (raw.length - raw.trimStart().length) / 2, s = raw.trim();
    while (stack.length > depth) { stack.pop(); out.push({ t: 'end' }); }
    const m = s.match(/^repeat (\d+):$/);
    if (m) { out.push({ t: 'repeat', n: +m[1], line: i + 1 }); stack.push(depth); return; }
    const c = s.match(/^(step|turnLeft|turnRight|jump)\(\)$/);
    if (!c) throw new Error('Cannot parse line: ' + raw);
    out.push({ t: c[1], line: i + 1 });
  });
  while (stack.length) { stack.pop(); out.push({ t: 'end' }); }
  return out;
}
function parseOption(s: string): Tok[] { return s.split(',').map(x => ({ t: x.trim().replace('()', '') })); }

function expand(p: Tok[]): Tok[] {
  const m: Record<number, number> = {}, st: number[] = [];
  p.forEach((b, i) => { if (b.t === 'repeat') st.push(i); else if (b.t === 'end') { const o = st.pop()!; m[o] = i; } });
  const out: Tok[] = [];
  (function run(a: number, b: number) {
    for (let i = a; i < b; i++) {
      const k = p[i];
      if (k.t === 'repeat') { for (let j = 0; j < k.n!; j++) run(i + 1, m[i]); i = m[i]; }
      else if (k.t !== 'end') out.push(k);
    }
  })(0, p.length);
  return out;
}

function run(map: string[], prog: Tok[]) {
  let r = 0, c = 0, d = 0; const sparks = new Set<string>(), crates = new Set<string>();
  map.forEach((row, ri) => [...row].forEach((ch, ci) => {
    if (ch === '#') crates.add(ri + ',' + ci); else if (ch === '*') sparks.add(ri + ',' + ci);
    else if ('^>v<'.includes(ch)) { r = ri; c = ci; d = '^>v<'.indexOf(ch); }
  }));
  const got = new Set<string>(); let bump: number | null = null;
  for (const a of expand(prog)) {
    if (a.t === 'turnLeft') d = (d + 3) % 4;
    else if (a.t === 'turnRight') d = (d + 1) % 4;
    else {
      const k = a.t === 'jump' ? 2 : 1, nr = r + DR[d] * k, nc = c + DC[d] * k;
      if (nr < 0 || nr >= map.length || nc < 0 || nc >= map[0].length || crates.has(nr + ',' + nc)) { bump = a.line ?? -1; break; }
      r = nr; c = nc; if (sparks.has(r + ',' + c)) got.add(r + ',' + c);
    }
  }
  return { end: 'ABCDEFG'[c] + (r + 1), sparks: got.size, all: got.size === sparks.size, bump };
}

let problems = 0;
const fail = (where: string, msg: string) => { problems++; console.log('✗', where, msg); };

for (const a of ASSESSMENTS) {
  const ids = new Set<string>();
  for (const qn of a.questions as Question[]) {
    const where = `${a.id}/${qn.id}`;
    if (ids.has(qn.id)) fail(where, 'duplicate id'); ids.add(qn.id);
    if (qn.kind === 'mcq' && (!qn.options || qn.answer < 0 || qn.answer >= qn.options.length)) fail(where, 'answer index out of range');
    if (qn.kind === 'mcq' && qn.options && new Set(qn.options).size !== qn.options.length) fail(where, 'duplicate options');
    if (!qn.verify) continue;
    const v = qn.verify.kind;
    if (v === 'moves') {
      const n = expand(parseCode(qn.code!)).filter(x => x.t === 'step' || x.t === 'jump').length;
      if (n !== qn.answer) fail(where, `moves: code runs ${n}, answer says ${qn.answer}`);
      continue;
    }
    if (v === 'wins') {
      const winners = qn.options!.map((o, i) => (run(qn.map!, parseOption(o)).all && run(qn.map!, parseOption(o)).bump === null) ? i : -1).filter(i => i >= 0);
      if (winners.length !== 1 || winners[0] !== qn.answer) fail(where, `wins: winning options ${JSON.stringify(winners)}, answer ${qn.answer}`);
      continue;
    }
    const res = run(qn.map!, parseCode(qn.code!));
    if (v === 'end' && qn.options![qn.answer] !== res.end) fail(where, `end: Vinc stops at ${res.end}, answer says ${qn.options![qn.answer]}`);
    if (v === 'sparks' && res.sparks !== qn.answer) fail(where, `sparks: ${res.sparks} collected, answer ${qn.answer}`);
    if (v === 'bump' && res.bump !== qn.answer) fail(where, `bump: at line ${res.bump}, answer ${qn.answer}`);
    const bumpsOnPurpose = qn.verify.kind === 'sparks' && qn.verify.bumps;
    if (v !== 'bump' && !bumpsOnPurpose && res.bump !== null) fail(where, `unexpected bump at line ${res.bump}`);
    if (bumpsOnPurpose && res.bump === null) fail(where, 'expected Vinc to bump');
  }
}
const { SKILLS } = await import('../src/data/assessments');
for (const a of ASSESSMENTS) {
  if (!a.objectives?.length) fail(a.id, 'no learning objectives');
  for (const qn of a.questions) {
    if (!qn.skill || !SKILLS[a.grade].includes(qn.skill)) fail(`${a.id}/${qn.id}`, `skill "${qn.skill}" is not in the Class ${a.grade} list`);
    if (!qn.level) fail(`${a.id}/${qn.id}`, 'no level');
  }
}
const positions = [0, 0, 0, 0];
for (const qn of ASSESSMENTS.flatMap(a => a.questions)) if (qn.kind === 'mcq' && qn.options!.length === 4) positions[qn.answer]++;
const mcqs = positions.reduce((t, n) => t + n, 0);
console.log('Right answer position (A–D) across 4-option questions:', positions.join(' / '));
if (Math.max(...positions) > mcqs * 0.4) fail('answer positions', 'too many right answers in one position');
for (let g = 3; g <= 8; g++) {
  const n = ASSESSMENTS.filter(a => a.grade === g).length;
  if (n < 3) fail('class ' + g, `only ${n} assessment(s)`);
}
const verified = ASSESSMENTS.flatMap(a => a.questions).filter(x => x.verify).length;
console.log(`${ASSESSMENTS.length} assessments, ${ASSESSMENTS.reduce((s, a) => s + a.questions.length, 0)} questions, ${verified} answers proven by running the code.`);
console.log(problems ? `${problems} problem(s)` : 'All checks passed');
process.exit(problems ? 1 : 0);
