/**
 * VincScript: the small, Python-shaped language of the Adventure game (Classes 5 to 8).
 *
 *   step(3)               # move 3 squares         turn_left() / turn_right() / jump()
 *   for i in range(4):    # loops                  while not at_spark():
 *   if blocked(): ... elif crate_ahead(): ... else: ...
 *   def hop(n): ...       # functions with up to two numbers
 *   n = 3                 # whole-number variables, + - * // and comparisons
 *
 * It is real Python syntax, so everything here also runs in Python. It runs instantly in the browser,
 * on the server (to check a level before saving it) and in `npm run check:lessons`.
 * Board symbols match src/lib/blocks.ts: "." floor, "#" crate, "*" spark, ^ > v < Vinc.
 */
import type { BoardRun, TraceStep } from './blocks';

export const MAX_ACTIONS = 400;
const MAX_TICKS = 20000;
const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];

/* ---------------- errors ---------------- */
export class VsError extends Error { constructor(msg: string, public line: number | null) { super(msg); } }
const fail = (line: number, msg: string): never => { throw new VsError(`Line ${line}: ${msg}`, line); };

/* ---------------- tokens ---------------- */
type Tok = { t: 'num' | 'name' | 'op' | 'str'; v: string };
function tokenize(src: string, line: number): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t') { i++; continue; }
    if (ch === '#') break;
    const rest = src.slice(i);
    let m = rest.match(/^\d+/);
    if (m) { out.push({ t: 'num', v: m[0] }); i += m[0].length; continue; }
    m = rest.match(/^[A-Za-z_]\w*/);
    if (m) { out.push({ t: 'name', v: m[0] }); i += m[0].length; continue; }
    m = rest.match(/^("[^"]*"|'[^']*')/);
    if (m) { out.push({ t: 'str', v: m[0].slice(1, -1) }); i += m[0].length; continue; }
    m = rest.match(/^(\/\/|==|!=|<=|>=|\+=|-=|[-+*<>=():,])/);
    if (m) { out.push({ t: 'op', v: m[0] }); i += m[0].length; continue; }
    fail(line, `Vinc does not understand "${ch}" here.`);
  }
  return out;
}

/* ---------------- AST ---------------- */
type Expr =
  | { k: 'num'; v: number } | { k: 'bool'; v: boolean } | { k: 'var'; name: string }
  | { k: 'call'; name: string; args: Expr[] }
  | { k: 'bin'; op: string; a: Expr; b: Expr } | { k: 'not'; a: Expr };
type Stmt = { line: number } & (
  | { k: 'expr'; e: Expr }
  | { k: 'assign'; name: string; op: string; e: Expr }
  | { k: 'for'; v: string; n: Expr; body: Stmt[] }
  | { k: 'while'; c: Expr; body: Stmt[] }
  | { k: 'if'; arms: { c: Expr | null; body: Stmt[]; line: number }[] }
  | { k: 'def'; name: string; params: string[]; body: Stmt[] }
  | { k: 'return' } | { k: 'pass' }
);

export const ACTIONS = ['step', 'jump', 'turn_left', 'turn_right'];
export const SENSORS = ['blocked', 'at_spark', 'spark_ahead', 'crate_ahead', 'sparks_left'];
const KEYWORDS = ['for', 'in', 'range', 'while', 'if', 'elif', 'else', 'def', 'not', 'and', 'or', 'True', 'False', 'return', 'pass'];

function dist(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function suggest(name: string, known: string[]) {
  const best = known.map(k => [k, dist(name.toLowerCase(), k.toLowerCase())] as const).sort((x, y) => x[1] - y[1])[0];
  return best && best[1] <= 2 ? ` Did you mean ${best[0]}?` : '';
}

class ExprParser {
  i = 0;
  constructor(public toks: Tok[], public line: number) {}
  peek(v?: string) { const t = this.toks[this.i]; return v === undefined ? t : t && t.v === v ? t : undefined; }
  eat(v: string) { if (!this.peek(v)) fail(this.line, v === ')' ? 'a bracket ) is missing.' : `"${v}" is missing.`); this.i++; }
  done() { return this.i >= this.toks.length; }
  or(): Expr { let a = this.and(); while (this.peek('or')) { this.i++; a = { k: 'bin', op: 'or', a, b: this.and() }; } return a; }
  and(): Expr { let a = this.not(); while (this.peek('and')) { this.i++; a = { k: 'bin', op: 'and', a, b: this.not() }; } return a; }
  not(): Expr { if (this.peek('not')) { this.i++; return { k: 'not', a: this.not() }; } return this.cmp(); }
  cmp(): Expr {
    const a = this.sum(); const t = this.peek();
    if (t && ['==', '!=', '<', '>', '<=', '>='].includes(t.v)) { this.i++; return { k: 'bin', op: t.v, a, b: this.sum() }; }
    if (t && t.v === '=') fail(this.line, 'use == to compare two things (= stores a value).');
    return a;
  }
  sum(): Expr { let a = this.prod(); for (let t = this.peek(); t && (t.v === '+' || t.v === '-'); t = this.peek()) { this.i++; a = { k: 'bin', op: t.v, a, b: this.prod() }; } return a; }
  prod(): Expr { let a = this.atom(); for (let t = this.peek(); t && (t.v === '*' || t.v === '//'); t = this.peek()) { this.i++; a = { k: 'bin', op: t.v, a, b: this.atom() }; } return a; }
  atom(): Expr {
    const t = this.toks[this.i++];
    if (!t) fail(this.line, 'something is missing at the end of this line.');
    if (t.t === 'num') return { k: 'num', v: Number(t.v) };
    if (t.v === '-' ) return { k: 'bin', op: '-', a: { k: 'num', v: 0 }, b: this.atom() };
    if (t.v === '(') { const e = this.or(); this.eat(')'); return e; }
    if (t.t === 'str') fail(this.line, 'Vinc only uses numbers here, not text in quotes.');
    if (t.t === 'name') {
      if (t.v === 'True' || t.v === 'False') return { k: 'bool', v: t.v === 'True' };
      if (this.peek('(')) {
        this.i++; const args: Expr[] = [];
        if (!this.peek(')')) { args.push(this.or()); while (this.peek(',')) { this.i++; args.push(this.or()); } }
        this.eat(')');
        return { k: 'call', name: t.v, args };
      }
      return { k: 'var', name: t.v };
    }
    return fail(this.line, `"${t.v}" is in the wrong place.`);
  }
}

type Line = { n: number; indent: number; text: string; toks: Tok[] };

/** Code → statements. Throws VsError with a friendly message. */
export function parse(code: string): Stmt[] {
  const lines: Line[] = [];
  code.replace(/\r/g, '').split('\n').forEach((raw, i) => {
    const text = raw.replace(/\t/g, '    ');
    const body = text.replace(/#.*/, '').trimEnd();
    if (!body.trim()) return;
    lines.push({ n: i + 1, indent: body.length - body.trimStart().length, text: body.trim(), toks: tokenize(body, i + 1) });
  });
  let p = 0;
  function block(indent: number, header: Line): Stmt[] {
    if (p >= lines.length || lines[p].indent <= indent) fail(header.n, 'put at least one line under this, moved in by 4 spaces.');
    const inner = lines[p].indent, out: Stmt[] = [];
    while (p < lines.length && lines[p].indent > indent) {
      if (lines[p].indent !== inner) fail(lines[p].n, lines[p].indent > inner ? 'this line is moved in too far.' : 'this line does not line up with the lines above it.');
      out.push(stmt(inner));
    }
    return out;
  }
  function colon(l: Line) { if (l.toks[l.toks.length - 1]?.v !== ':') fail(l.n, 'put a colon : at the end of this line.'); }
  function stmt(indent: number): Stmt {
    const l = lines[p++], t = l.toks, w = t[0]?.v;
    const ex = (from: number, to: number) => { const ep = new ExprParser(t.slice(from, to), l.n); const e = ep.or(); if (!ep.done()) fail(l.n, `"${ep.peek()!.v}" is in the wrong place.`); return e; };
    if (w === 'for') {
      colon(l);
      if (t[1]?.t !== 'name' || t[2]?.v !== 'in' || t[3]?.v !== 'range' || t[4]?.v !== '(') fail(l.n, 'write a for loop like this: for i in range(3):');
      if (t[t.length - 2]?.v !== ')') fail(l.n, 'a bracket ) is missing before the colon.');
      return { line: l.n, k: 'for', v: t[1].v, n: ex(5, t.length - 2), body: block(indent, l) };
    }
    if (w === 'while') { colon(l); return { line: l.n, k: 'while', c: ex(1, t.length - 1), body: block(indent, l) }; }
    if (w === 'if') {
      colon(l);
      const arms: { c: Expr | null; body: Stmt[]; line: number }[] = [{ c: ex(1, t.length - 1), body: block(indent, l), line: l.n }];
      while (p < lines.length && lines[p].indent === indent && (lines[p].toks[0]?.v === 'elif' || lines[p].toks[0]?.v === 'else')) {
        const e = lines[p++]; colon(e);
        if (e.toks[0].v === 'elif') { const ep = new ExprParser(e.toks.slice(1, -1), e.n); arms.push({ c: ep.or(), body: block(indent, e), line: e.n }); }
        else { if (e.toks.length !== 2) fail(e.n, 'write else: on its own.'); arms.push({ c: null, body: block(indent, e), line: e.n }); break; }
      }
      return { line: l.n, k: 'if', arms };
    }
    if (w === 'elif' || w === 'else') fail(l.n, `${w} needs an if above it, lined up with it.`);
    if (w === 'def') {
      colon(l);
      if (t[1]?.t !== 'name' || t[2]?.v !== '(' || t[t.length - 2]?.v !== ')') fail(l.n, 'write a function like this: def hop():');
      if ([...ACTIONS, ...SENSORS].includes(t[1].v)) fail(l.n, `${t[1].v} is already one of Vinc's commands. Pick another name.`);
      const params = t.slice(3, -2).filter(x => x.v !== ',').map(x => x.v);
      return { line: l.n, k: 'def', name: t[1].v, params, body: block(indent, l) };
    }
    if (w === 'return') return { line: l.n, k: 'return' };
    if (w === 'pass') return { line: l.n, k: 'pass' };
    if (t[0]?.t === 'name' && t[1] && ['=', '+=', '-='].includes(t[1].v)) {
      if (KEYWORDS.includes(w!) || ACTIONS.includes(w!)) fail(l.n, `${w} cannot be used as a variable name.`);
      return { line: l.n, k: 'assign', name: w!, op: t[1].v, e: ex(2, t.length) };
    }
    if (t[0]?.t === 'name' && t[1]?.t === 'num' && t.length === 2) fail(l.n, `write ${w}(${t[1].v}) with brackets.`);
    if (t[0]?.t === 'name' && t.length === 1 && !KEYWORDS.includes(w!)) fail(l.n, `add brackets: ${w}()`);
    if (l.toks[l.toks.length - 1]?.v === ':') fail(l.n, 'Vinc does not know this kind of line.');
    return { line: l.n, k: 'expr', e: ex(0, t.length) };
  }
  const out: Stmt[] = [];
  while (p < lines.length) {
    if (lines[p].indent !== 0) fail(lines[p].n, 'this line is moved in, but there is no loop, if or def above it.');
    out.push(stmt(0));
  }
  return out;
}

/* ---------------- running ---------------- */
class Return { }

/** Runs code on one board and records every move for the animation. */
export function runScript(map: string[], prog: Stmt[]): BoardRun {
  const h = map.length, w = map[0].length;
  let r = 0, c = 0, d = 1;
  const sparks = new Set<string>(), crates = new Set<string>(), got = new Set<string>();
  map.forEach((row, ri) => [...row].forEach((ch, ci) => {
    if (ch === '#') crates.add(ri + ',' + ci); else if (ch === '*') sparks.add(ri + ',' + ci);
    else if ('^>v<'.includes(ch)) { r = ri; c = ci; d = '^>v<'.indexOf(ch); }
  }));
  const trace: TraceStep[] = [];
  let actions = 0, ticks = 0, depth = 0;
  const funcs = new Map<string, Extract<Stmt, { k: 'def' }>>();
  const log = (a: TraceStep['a'], line: number, hop?: number) => trace.push({ a, r, c, d, line, got: got.size, ...(hop ? { hop } : {}) });
  const free = (rr: number, cc: number) => rr >= 0 && rr < h && cc >= 0 && cc < w && !crates.has(rr + ',' + cc);
  const tick = (line: number) => { if (++ticks > MAX_TICKS) fail(line, 'this loop never stops, so Vinc gave up. Check that something in the loop changes.'); };
  function move(hop: number, line: number) {
    if (++actions > MAX_ACTIONS) fail(line, `Vinc got tired after ${MAX_ACTIONS} moves. Is there a loop that never ends?`);
    const nr = r + DR[d] * hop, nc = c + DC[d] * hop;
    if (!free(nr, nc)) {
      log('bump', line, hop);
      const off = nr < 0 || nr >= h || nc < 0 || nc >= w;
      throw new VsError(`Line ${line}: ` + (hop === 2 ? (off ? 'Vinc jumped right off the board!' : 'Vinc landed on a crate!') : `Vinc bumped into ${off ? 'the edge of the board' : 'a crate'}!`), line);
    }
    r = nr; c = nc; if (sparks.has(r + ',' + c)) got.add(r + ',' + c);
    log(hop === 2 ? 'jump' : 'step', line);
  }
  function num(v: unknown, line: number, what: string): number {
    if (typeof v !== 'number') fail(line, `${what} needs a number.`);
    return v as number;
  }
  function evalE(e: Expr, env: Map<string, number | boolean>, line: number): number | boolean {
    switch (e.k) {
      case 'num': case 'bool': return e.v;
      case 'var': {
        if (env.has(e.name)) return env.get(e.name)!;
        if ([...ACTIONS, ...SENSORS].includes(e.name) || funcs.has(e.name)) return fail(line, `add brackets: ${e.name}()`);
        return fail(line, `Vinc does not know "${e.name}".` + suggest(e.name, [...env.keys(), ...ACTIONS, ...SENSORS, ...funcs.keys()]));
      }
      case 'not': return !evalE(e.a, env, line);
      case 'bin': {
        if (e.op === 'and') return !!evalE(e.a, env, line) && !!evalE(e.b, env, line);
        if (e.op === 'or') return !!evalE(e.a, env, line) || !!evalE(e.b, env, line);
        const a = evalE(e.a, env, line), b = evalE(e.b, env, line);
        switch (e.op) {
          case '==': return a === b; case '!=': return a !== b;
          case '<': return num(a, line, '<') < num(b, line, '<'); case '>': return num(a, line, '>') > num(b, line, '>');
          case '<=': return num(a, line, '<=') <= num(b, line, '<='); case '>=': return num(a, line, '>=') >= num(b, line, '>=');
          case '+': return num(a, line, '+') + num(b, line, '+'); case '-': return num(a, line, '-') - num(b, line, '-');
          case '*': return num(a, line, '*') * num(b, line, '*');
          case '//': { const bb = num(b, line, '//'); if (bb === 0) fail(line, 'you cannot divide by 0.'); return Math.floor(num(a, line, '//') / bb); }
        }
        return fail(line, 'Vinc does not understand this sum.');
      }
      case 'call': return call(e, env, line);
    }
  }
  function call(e: Extract<Expr, { k: 'call' }>, env: Map<string, number | boolean>, line: number): number | boolean {
    const args = e.args.map(a => evalE(a, env, line));
    const want = (n: number) => { if (args.length > n) fail(line, `${e.name}() takes ${n === 0 ? 'nothing inside the brackets' : `${n} number`}.`); };
    switch (e.name) {
      case 'step': {
        want(1); const n = args.length ? num(args[0], line, 'step()') : 1;
        if (n < 0 || n > 50) fail(line, 'step() needs a number from 0 to 50.');
        for (let i = 0; i < n; i++) move(1, line);
        return 0;
      }
      case 'jump': want(0); move(2, line); return 0;
      case 'turn_left': case 'turn_right':
        want(0); if (++actions > MAX_ACTIONS) fail(line, `Vinc got tired after ${MAX_ACTIONS} moves. Is there a loop that never ends?`);
        d = (d + (e.name === 'turn_left' ? 3 : 1)) % 4; log('turn', line); return 0;
      case 'blocked': want(0); return !free(r + DR[d], c + DC[d]);
      case 'crate_ahead': want(0); return crates.has((r + DR[d]) + ',' + (c + DC[d]));
      case 'at_spark': want(0); return sparks.has(r + ',' + c);
      case 'spark_ahead': { want(0); const k = (r + DR[d]) + ',' + (c + DC[d]); return sparks.has(k) && !got.has(k); }
      case 'sparks_left': want(0); return sparks.size - got.size;
      case 'range': return fail(line, 'use range() inside a for loop: for i in range(3):');
      case 'print': return 0;
    }
    const f = funcs.get(e.name);
    if (!f) { const hint = suggest(e.name, [...ACTIONS, ...SENSORS, ...funcs.keys()]); return fail(line, `Vinc does not know "${e.name}()".` + (hint || ' If it is your own function, write its def above this line.')); }
    if (args.length !== f.params.length) fail(line, `${e.name}() needs ${f.params.length} number${f.params.length === 1 ? '' : 's'} in the brackets.`);
    if (++depth > 40) fail(line, 'this function keeps calling itself and never stops.');
    const local = new Map<string, number | boolean>(f.params.map((p, i) => [p, args[i]]));
    try { exec(f.body, local); } catch (x) { if (!(x instanceof Return)) throw x; } finally { depth--; }
    return 0;
  }
  function exec(list: Stmt[], env: Map<string, number | boolean>) {
    for (const s of list) {
      tick(s.line);
      switch (s.k) {
        case 'expr': evalE(s.e, env, s.line); break;
        case 'assign': {
          const v = evalE(s.e, env, s.line);
          if (s.op === '=') env.set(s.name, v);
          else { if (!env.has(s.name)) fail(s.line, `"${s.name}" needs a value first, like ${s.name} = 0.`); env.set(s.name, num(env.get(s.name), s.line, s.op) + (s.op === '+=' ? 1 : -1) * num(v, s.line, s.op)); }
          break;
        }
        case 'for': {
          const n = num(evalE(s.n, env, s.line), s.line, 'range()');
          for (let i = 0; i < n; i++) { tick(s.line); env.set(s.v, i); exec(s.body, env); }
          break;
        }
        case 'while': while (evalE(s.c, env, s.line)) { tick(s.line); exec(s.body, env); } break;
        case 'if': for (const a of s.arms) { if (a.c === null || evalE(a.c, env, a.line)) { exec(a.body, env); break; } } break;
        case 'def': funcs.set(s.name, s); break;
        case 'return': throw new Return();
        case 'pass': break;
      }
    }
  }
  let error: string | null = null, line: number | null = null;
  try { exec(prog, new Map()); } catch (x) {
    if (x instanceof VsError) { error = x.message; line = x.line; }
    else if (x instanceof Return) { error = 'return can only be used inside a def.'; }
    else throw x;
  }
  const ok = !error && got.size === sparks.size;
  if (!error && !ok) error = `Vinc stopped with ${got.size} of ${sparks.size} sparks.`;
  return { map, ok, trace, error, line, stdout: '', sparks: got.size, total: sparks.size };
}

/* ---------------- checking a level ---------------- */
export type Uses = 'for' | 'while' | 'if' | 'def' | 'jump' | 'variable';
export interface ScriptCheck { kind: 'script'; maps: string[][]; require?: { uses?: Uses[]; maxLines?: number } }
export type ScriptResult = { passed: boolean; missing: string[]; runs: BoardRun[]; stdout: string; error: string | null; line: number | null; blocks: number };

/** Lines of code, not counting blank lines and comments. */
export const countLines = (code: string) => code.split('\n').filter(l => l.replace(/#.*/, '').trim()).length;

function uses(prog: Stmt[]): Set<Uses> {
  const found = new Set<Uses>();
  const walkE = (e: Expr) => { if (e.k === 'call') { if (e.name === 'jump') found.add('jump'); e.args.forEach(walkE); } else if (e.k === 'bin') { walkE(e.a); walkE(e.b); } else if (e.k === 'not') walkE(e.a); };
  const walk = (l: Stmt[]) => l.forEach(s => {
    if (s.k === 'for') { found.add('for'); walk(s.body); }
    else if (s.k === 'while') { found.add('while'); walkE(s.c); walk(s.body); }
    else if (s.k === 'if') { found.add('if'); s.arms.forEach(a => { if (a.c) walkE(a.c); walk(a.body); }); }
    else if (s.k === 'def') { found.add('def'); walk(s.body); }
    else if (s.k === 'assign') { found.add('variable'); walkE(s.e); }
    else if (s.k === 'expr') walkE(s.e);
  });
  walk(prog);
  return found;
}
const USE_MSG: Record<Uses, string> = { for: 'Use a for loop.', while: 'Use a while loop.', if: 'Use an if.', def: 'Make your own function with def.', jump: 'Use jump().', variable: 'Use a variable.' };

export function checkScript(check: ScriptCheck, code: string): ScriptResult {
  const n = countLines(code);
  let prog: Stmt[];
  try { prog = parse(code); } catch (e) {
    if (e instanceof VsError) return { passed: false, missing: [], runs: [], stdout: '', error: e.message, line: e.line, blocks: n };
    throw e;
  }
  const runs = check.maps.map(m => runScript(m, prog));
  const found = uses(prog), missing: string[] = [];
  for (const u of check.require?.uses ?? []) if (!found.has(u)) missing.push(USE_MSG[u]);
  if (check.require?.maxLines && n > check.require.maxLines) missing.push(`Use at most ${check.require.maxLines} lines. You used ${n}.`);
  if (!n) missing.push('Write some code first!');
  const bad = runs.find(r => !r.ok);
  return { passed: !bad && !missing.length, missing, runs, stdout: '', error: bad?.error ?? null, line: bad?.line ?? null, blocks: n };
}

/** Syntax colours for the editor: [text, class] pieces for one line. */
export function highlight(line: string): [string, string][] {
  const out: [string, string][] = [];
  const re = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+\b)|(\b[A-Za-z_]\w*\b)|(\s+)|([^\sA-Za-z_\d#"']+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [tok, com, str, numb, name] = m;
    if (com) out.push([tok, 'hl-com']);
    else if (str) out.push([tok, 'hl-str']);
    else if (numb) out.push([tok, 'hl-num']);
    else if (name) out.push([tok, KEYWORDS.includes(name) ? 'hl-kw' : ACTIONS.includes(name) ? 'hl-act' : SENSORS.includes(name) ? 'hl-sen' : 'hl-name']);
    else out.push([tok, '']);
  }
  return out;
}
