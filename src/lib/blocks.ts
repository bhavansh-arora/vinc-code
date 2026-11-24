/**
 * Vinc's block language for Classes 3 and 4. One block per line, two spaces inside a repeat:
 *
 *   step()
 *   repeat 3:
 *     step()
 *     turnLeft()
 *
 * The same code runs in the browser (to animate the board), on the server (to check a lesson before saving it)
 * and in `npm run check:lessons`, so all three always agree. Rules match public/lessons/harness.py:
 * Vinc must collect every spark on every board and never bump into a crate or the edge.
 */

export type Move = 'step' | 'turnLeft' | 'turnRight' | 'jump';
export type BlockName = Move | 'repeat';
export type Block = { id: string; t: Move } | { id: string; t: 'repeat'; n: number; body: Block[] };

export interface BlockRequire { uses?: BlockName[]; maxBlocks?: number }
export interface BlocksCheck { kind: 'blocks'; maps: string[][]; require?: BlockRequire }

export type TraceStep = { a: 'step' | 'jump' | 'turn' | 'bump'; r: number; c: number; d: number; line: number | null; got: number; hop?: number };
export type BoardRun = { map: string[]; ok: boolean; trace: TraceStep[]; error: string | null; line: number | null; stdout: string; sparks: number; total: number };
export type BlocksResult = { passed: boolean; missing: string[]; runs: BoardRun[]; stdout: string; error: string | null; line: number | null; blocks: number };

export const MAX_ACTIONS = 400;
export const MAX_REPEAT = 12;
const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];

let uid = 0;
export const newId = () => 'b' + (++uid).toString(36) + Math.random().toString(36).slice(2, 6);

export const BLOCK_LABEL: Record<BlockName, string> = { step: 'step()', turnLeft: 'turnLeft()', turnRight: 'turnRight()', jump: 'jump()', repeat: 'repeat' };

/** Text → blocks. Throws an Error with a friendly message on a line it cannot read. */
export function parseBlocks(text: string): Block[] {
  const root: Block[] = [];
  const stack: { depth: number; body: Block[] }[] = [{ depth: -1, body: root }];
  const lines = text.replace(/\r/g, '').split('\n');
  lines.forEach((raw, i) => {
    if (!raw.trim()) return;
    const depth = Math.floor((raw.length - raw.trimStart().length) / 2), s = raw.trim();
    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    const parent = stack[stack.length - 1].body;
    const rep = s.match(/^repeat\s+(\d+)\s*:?$/);
    if (rep) {
      const b: Block = { id: newId(), t: 'repeat', n: Math.max(1, Math.min(MAX_REPEAT, +rep[1])), body: [] };
      parent.push(b); stack.push({ depth, body: b.body }); return;
    }
    const m = s.match(/^(step|turnLeft|turnRight|jump)\(\)$/);
    if (!m) throw new Error(`Line ${i + 1}: Vinc does not know "${s}".`);
    parent.push({ id: newId(), t: m[1] as Move });
  });
  return root;
}

/** Blocks → text (the "show as code" view and what gets saved). */
export function blocksToText(prog: Block[], depth = 0): string {
  return prog.map(b => '  '.repeat(depth) + (b.t === 'repeat' ? `repeat ${b.n}:` + (b.body.length ? '\n' + blocksToText(b.body, depth + 1) : '') : b.t + '()')).join('\n');
}

/** Every block in reading order. Its position + 1 is its line number. */
export function flatten(prog: Block[]): Block[] {
  const out: Block[] = [];
  const walk = (list: Block[]) => list.forEach(b => { out.push(b); if (b.t === 'repeat') walk(b.body); });
  walk(prog);
  return out;
}
export const countBlocks = (prog: Block[]) => flatten(prog).length;

class Stop extends Error { constructor(msg: string, public line: number | null) { super(msg); } }

/** Runs a program on one board and records every move for the animation. */
export function runOnBoard(map: string[], prog: Block[]): BoardRun {
  const h = map.length, w = map[0].length;
  let r = 0, c = 0, d = 1;
  const sparks = new Set<string>(), crates = new Set<string>(), got = new Set<string>();
  map.forEach((row, ri) => [...row].forEach((ch, ci) => {
    if (ch === '#') crates.add(ri + ',' + ci);
    else if (ch === '*') sparks.add(ri + ',' + ci);
    else if ('^>v<'.includes(ch)) { r = ri; c = ci; d = '^>v<'.indexOf(ch); }
  }));
  const lineOf = new Map(flatten(prog).map((b, i) => [b.id, i + 1]));
  const trace: TraceStep[] = [];
  let actions = 0;
  const log = (a: TraceStep['a'], line: number | null, hop?: number) => trace.push({ a, r, c, d, line, got: got.size, ...(hop ? { hop } : {}) });
  const exec = (list: Block[]) => {
    for (const b of list) {
      const line = lineOf.get(b.id) ?? null;
      if (b.t === 'repeat') { for (let i = 0; i < b.n; i++) exec(b.body); continue; }
      if (++actions > MAX_ACTIONS) throw new Stop(`Vinc got tired after ${MAX_ACTIONS} moves.`, line);
      if (b.t === 'turnLeft' || b.t === 'turnRight') { d = (d + (b.t === 'turnLeft' ? 3 : 1)) % 4; log('turn', line); continue; }
      const hop = b.t === 'jump' ? 2 : 1, nr = r + DR[d] * hop, nc = c + DC[d] * hop;
      const off = nr < 0 || nr >= h || nc < 0 || nc >= w;
      if (off || crates.has(nr + ',' + nc)) {
        log('bump', line, hop);
        throw new Stop(hop === 2 ? (off ? 'Vinc jumped right off the board!' : 'Vinc landed on a crate!') : `Vinc bumped into ${off ? 'the edge of the board' : 'a crate'}!`, line);
      }
      r = nr; c = nc;
      if (sparks.has(r + ',' + c)) got.add(r + ',' + c);
      log(hop === 2 ? 'jump' : 'step', line);
    }
  };
  let error: string | null = null, line: number | null = null;
  try { exec(prog); } catch (e) { if (e instanceof Stop) { error = e.message; line = e.line; } else throw e; }
  const ok = !error && got.size === sparks.size;
  if (!error && !ok) error = `Vinc stopped with ${got.size} of ${sparks.size} sparks.`;
  return { map, ok, trace, error, line, stdout: '', sparks: got.size, total: sparks.size };
}

const USE_MSG: Record<BlockName, string> = {
  repeat: 'Use a repeat block.', jump: 'Use a jump() block.', step: 'Use a step() block.', turnLeft: 'Use a turnLeft() block.', turnRight: 'Use a turnRight() block.'
};

/** Runs every board and checks the lesson's rules. */
export function checkBlocks(check: BlocksCheck, prog: Block[]): BlocksResult {
  const runs = check.maps.map(m => runOnBoard(m, prog));
  const all = flatten(prog), n = all.length, missing: string[] = [];
  for (const u of check.require?.uses ?? []) if (!all.some(b => b.t === u)) missing.push(USE_MSG[u]);
  if (check.require?.maxBlocks && n > check.require.maxBlocks) missing.push(`Use at most ${check.require.maxBlocks} blocks. You used ${n}.`);
  if (!n) missing.push('Add some blocks first!');
  const bad = runs.find(r => !r.ok);
  return { passed: !bad && !missing.length, missing, runs, stdout: '', error: bad?.error ?? null, line: bad?.line ?? null, blocks: n };
}

/** 3 stars at or under par (the model solution's size), 2 stars within two blocks of it, otherwise 1. */
export function blockStars(blocks: number, par: number) { return blocks <= par ? 3 : blocks <= par + 2 ? 2 : 1; }
