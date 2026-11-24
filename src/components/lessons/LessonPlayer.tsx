'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Check, Lesson } from '@/data/lessons';
import VincArt from '@/components/VincArt';

type PublicLesson = Omit<Lesson, 'solution'> & { solution?: string };
type Step = { a: 'step' | 'jump' | 'turn' | 'bump'; r: number; c: number; d: number; line: number | null; got: number };
type Run = { map?: string[]; ok: boolean; trace?: Step[]; error: string | null; line: number | null; stdout: string; sparks?: number; total?: number };
type Result = { passed: boolean; missing?: string[]; runs: Run[]; stdout: string; error: string | null; line: number | null };

/* ---------------- Python runner (one Web Worker per page, restarted if a run hangs) ---------------- */
let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let seq = 0;
const waiting = new Map<number, (r: Result) => void>();
const listeners = new Set<(s: 'loading' | 'ready' | 'error') => void>();
let status: 'loading' | 'ready' | 'error' = 'loading';
function setStatus(s: typeof status) { status = s; listeners.forEach(f => f(s)); }

function startWorker() {
  setStatus('loading');
  worker = new Worker('/lessons/worker.js');
  ready = new Promise<void>((resolve, reject) => {
    worker!.onmessage = e => {
      const m = e.data;
      if (m.type === 'ready') { setStatus('ready'); resolve(); }
      else if (m.type === 'fatal') { setStatus('error'); reject(new Error(m.error)); }
      else if (m.type === 'result') { waiting.get(m.id)?.(m.result); waiting.delete(m.id); }
    };
    worker!.onerror = () => { setStatus('error'); reject(new Error('Python could not start.')); };
  });
  ready.catch(() => {});
}

async function runPython(code: string, check: Check): Promise<Result> {
  if (!worker) startWorker();
  try { await ready; } catch { return { passed: false, runs: [], stdout: '', line: null, error: 'Python could not load. Check your internet connection and reload the page.' }; }
  const id = ++seq;
  return new Promise<Result>(resolve => {
    const timer = setTimeout(() => {
      waiting.delete(id); worker?.terminate(); worker = null; startWorker();
      resolve({ passed: false, runs: [], stdout: '', line: null, error: 'Your program ran for too long, so it was stopped. Is there a loop that never ends?' });
    }, 12000);
    waiting.set(id, r => { clearTimeout(timer); resolve(r); });
    worker!.postMessage({ id, code, check });
  });
}

function usePythonStatus() {
  const [s, setS] = useState(status);
  useEffect(() => { if (!worker) startWorker(); setS(status); listeners.add(setS); return () => { listeners.delete(setS); }; }, []);
  return s;
}

/* ---------------- helpers ---------------- */
function Rich({ text }: { text: string }) {
  return <>{text.split('`').map((part, i) => (i % 2 ? <code key={i} className="ls-code">{part}</code> : <span key={i}>{part}</span>))}</>;
}

const ARROW = ['▲', '▶', '▼', '◀'];
const TILE: Record<string, string> = { r: 'red', g: 'green', b: 'blue' };

function Board({ map, trace, frame }: { map: string[]; trace: Step[]; frame: number }) {
  const start = useMemo(() => {
    for (let r = 0; r < map.length; r++) for (let c = 0; c < map[r].length; c++) { const i = '^>v<'.indexOf(map[r][c]); if (i >= 0) return { r, c, d: i }; }
    return { r: 0, c: 0, d: 1 };
  }, [map]);
  const cur = frame >= 0 && trace[frame] ? trace[frame] : { ...start, a: 'start' as const };
  const visited = useMemo(() => { const s = new Set<string>(); for (let i = 0; i <= frame && i < trace.length; i++) s.add(trace[i].r + ',' + trace[i].c); return s; }, [trace, frame]);
  return (
    <div className="ls-board" style={{ gridTemplateColumns: `repeat(${map[0].length}, minmax(0, 40px))` }} role="img" aria-label="Vinc's board">
      {map.map((row, r) => row.split('').map((ch, c) => {
        const here = cur.r === r && cur.c === c;
        const k = r + ',' + c;
        const spark = ch === '*' && !visited.has(k);
        return (
          <span key={k} className={'ls-cell' + (ch === '#' ? ' crate' : '') + (TILE[ch] ? ' t-' + TILE[ch] : '') + (here ? ' vinc' + (cur.a === 'bump' ? ' bump' : '') : '')}>
            {here ? ARROW[cur.d] : spark ? '✦' : ch === '#' ? '' : ''}
          </span>
        );
      }))}
    </div>
  );
}

const SNIPPETS: [string, string][] = [
  ['step()', 'step()'], ['turn_left()', 'turn_left()'], ['turn_right()', 'turn_right()'], ['jump()', 'jump()'],
  ['if blocked():', 'if blocked():\n    '], ['else:', 'else:\n    '], ['while not at_spark():', 'while not at_spark():\n    ']
];

/* ---------------- the player ---------------- */
export default function LessonPlayer({ lesson, mode, savedCode, done, next, back }: {
  lesson: PublicLesson; mode: 'student' | 'preview'; savedCode?: string | null; done?: boolean;
  next?: { href: string; title: string } | null; back: string;
}) {
  const py = usePythonStatus();
  const [code, setCode] = useState(savedCode ?? lesson.starter);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [hints, setHints] = useState(0);
  const [board, setBoard] = useState(0);
  const [frame, setFrame] = useState(-1);
  const [passedOnce, setPassedOnce] = useState(!!done);
  const [saved, setSaved] = useState('');
  const [armReset, setArmReset] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const isVinc = lesson.check.kind === 'vinc';
  const maps = lesson.check.kind === 'vinc' ? lesson.check.maps : [];
  const runOf = (i: number) => result?.runs?.[i];
  const trace = runOf(board)?.trace ?? [];
  const activeLine = frame >= 0 && trace[frame] ? trace[frame].line : null;
  const errLine = result && !result.passed ? result.line : null;
  const lineCount = code.split('\n').length;

  // Animate the selected board's trace.
  useEffect(() => {
    if (!trace.length) { setFrame(-1); return; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setFrame(trace.length - 1); return; }
    setFrame(-1);
    const ms = Math.max(60, Math.min(260, 6000 / trace.length));
    let i = -1;
    const t = setInterval(() => { i++; setFrame(i); if (i >= trace.length - 1) clearInterval(t); }, ms);
    return () => clearInterval(t);
  }, [trace]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true); setResult(null);
    const r = await runPython(code, lesson.check);
    setResult(r); setRunning(false);
    const bad = r.runs?.findIndex(x => !x.ok) ?? -1;
    setBoard(bad >= 0 ? bad : 0);
    if (r.passed) setPassedOnce(true);
    if (mode === 'student') {
      try {
        const res = await fetch('/api/lessons/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lesson.id, code, passed: r.passed }) });
        setSaved(res.ok ? 'Saved' : res.status === 401 ? 'Logged out: your work was not saved' : 'Could not save');
      } catch { setSaved('Could not save. Check your internet.'); }
    }
  }, [code, lesson, mode, running]);

  function insert(text: string) {
    const el = ta.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const indent = value.slice(lineStart).match(/^ */)![0];
    const atBlankLine = value.slice(lineStart, s).trim() === '';
    const body = text.split('\n').map((l, i) => (i === 0 ? l : indent + l)).join('\n');
    const piece = atBlankLine ? body : '\n' + indent + body;
    const nextVal = value.slice(0, s) + piece + (text.endsWith('    ') ? '' : '\n' + indent) + value.slice(e);
    setCode(nextVal);
    const caret = s + piece.length + (text.endsWith('    ') ? 0 : indent.length + 1);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret); });
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = el;
      const v = value.slice(0, s) + '    ' + value.slice(en);
      setCode(v); requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = el;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const line = value.slice(lineStart, s);
      let indent = line.match(/^ */)![0];
      if (line.trimEnd().endsWith(':')) indent += '    ';
      const v = value.slice(0, s) + '\n' + indent + value.slice(en);
      setCode(v); requestAnimationFrame(() => el.setSelectionRange(s + 1 + indent.length, s + 1 + indent.length));
    }
  }

  const avatar = lesson.type === 'Catch Glitch'
    ? <svg viewBox="0 0 40 40" className="ls-avatar" aria-hidden="true"><ellipse cx="20" cy="23" rx="13" ry="14" fill="#C2502A" stroke="#2B1A10" strokeWidth="2.5" /><path d="M20 10 V37" stroke="#2B1A10" strokeWidth="2" /><circle cx="15" cy="13" r="3" fill="#FFF7EA" /><circle cx="25" cy="13" r="3" fill="#FFF7EA" /><circle cx="15" cy="13" r="1.4" fill="#2B1A10" /><circle cx="25" cy="13" r="1.4" fill="#2B1A10" /><circle cx="14" cy="23" r="2.6" fill="#2B1A10" /><circle cx="26" cy="28" r="2.6" fill="#2B1A10" /></svg>
    : <VincArt className="ls-avatar" label="" />;

  return (
    <div className="ls">
      <section className="ls-info">
        <a href={back} className="small">← All lessons</a>
        <div className="row" style={{ gap: 8 }}>
          <span className="eyebrow">Class {lesson.grade} · Lesson {lesson.n}</span>
          <span className={'ls-type t-' + lesson.type.replace(/\s|:/g, '').toLowerCase()}>{lesson.type}</span>
          {passedOnce && <span className="badge good">done</span>}
        </div>
        <h1>{lesson.title}</h1>
        <div className="ls-intro">{avatar}<p>{lesson.intro}</p></div>
        {lesson.explain.map((p, i) => <p key={i} className="ls-p"><Rich text={p} /></p>)}
        {lesson.example && <div className="ls-example"><span className="label">Example</span><pre>{lesson.example.code}</pre>{lesson.example.note && <p className="small muted">{lesson.example.note}</p>}</div>}
        <div className="ls-task"><b>Your task</b><p><Rich text={lesson.task} /></p>
          {lesson.check.require?.uses && <p className="small muted">Your code must use: {lesson.check.require.uses.map(u => <code className="ls-code" key={u}>{u}</code>)}</p>}
        </div>
        <div className="ls-hints">
          {lesson.hints.slice(0, hints).map((h, i) => <p key={i} className="ls-hint"><b>Hint {i + 1}:</b> <Rich text={h} /></p>)}
          {hints < lesson.hints.length && <button type="button" className="btn small quiet" onClick={() => setHints(h => h + 1)}>Show a hint ({hints + 1} of {lesson.hints.length})</button>}
        </div>
      </section>

      <section className="ls-work">
        <div className="ls-toolbar">
          <button type="button" className="btn primary" onClick={run} disabled={running || py === 'error'}>{running ? 'Running…' : py === 'loading' ? 'Loading Python…' : '▶ Run'}</button>
          <button type="button" className="btn small quiet" onClick={() => { if (!armReset) { setArmReset(true); setTimeout(() => setArmReset(false), 3000); return; } setCode(lesson.starter); setResult(null); setArmReset(false); }}>{armReset ? 'Tap again to reset' : 'Reset code'}</button>
          {mode === 'preview' && lesson.solution && <button type="button" className="btn small quiet" onClick={() => { setCode(lesson.solution!); setResult(null); }}>Show model solution</button>}
          <span className="small muted ls-saved">{saved || (py === 'loading' ? 'Starting Python (first time takes a few seconds)…' : 'Ctrl + Enter also runs')}</span>
        </div>
        {isVinc && <div className="ls-snips" aria-label="Insert code">{SNIPPETS.map(([label, t]) => <button type="button" key={label} className="ls-snip" onClick={() => insert(t)}>{label}</button>)}</div>}
        <div className="ls-editor">
          <div className="ls-gutter" ref={gutter} aria-hidden="true">
            {Array.from({ length: lineCount }, (_, i) => <div key={i} className={i + 1 === activeLine ? 'on' : i + 1 === errLine ? 'err' : ''}>{i + 1}</div>)}
          </div>
          <textarea ref={ta} value={code} onChange={e => setCode(e.target.value)} onKeyDown={onKey} spellCheck={false} autoCapitalize="none" autoCorrect="off" aria-label="Your Python code"
            onScroll={e => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }} rows={Math.max(8, lineCount + 1)} />
        </div>

        {isVinc && (
          <div className="ls-boards">
            <div className="ls-board-tabs" role="tablist" aria-label="Boards">
              {maps.map((_, i) => {
                const r = runOf(i);
                return <button type="button" role="tab" key={i} aria-selected={board === i} className={r ? (r.ok ? 'ok' : 'bad') : ''} onClick={() => setBoard(i)}>Board {i + 1}{r ? (r.ok ? ' ✓' : ' ✗') : ''}</button>;
              })}
            </div>
            <Board map={maps[board]} trace={trace} frame={frame} />
            {runOf(board) && <p className="small muted">Sparks: {runOf(board)!.sparks} of {runOf(board)!.total}{runOf(board)!.error ? ` · ${runOf(board)!.error}` : ''}</p>}
          </div>
        )}

        {result && (
          <div className={'ls-result ' + (result.passed ? 'pass' : 'fail')} role="status">
            {result.passed ? (
              <>
                <b>✓ Brilliant! Lesson complete.</b>
                <span>{mode === 'student' ? 'Your work is saved.' : 'The check passes.'}</span>
                {next ? <a className="btn primary small" href={next.href}>Next: {next.title} →</a> : <a className="btn small" href={back}>Back to all lessons</a>}
              </>
            ) : (
              <>
                <b>Not yet. {result.line ? `Look at line ${result.line}.` : ''}</b>
                {result.error && <pre className="ls-err">{result.error}</pre>}
                {result.missing && result.missing.length > 0 && <ul>{result.missing.map(m => <li key={m}>{m}</li>)}</ul>}
              </>
            )}
          </div>
        )}
        {(result?.stdout || (!isVinc && result)) && (
          <div className="ls-console"><span className="label">Output</span><pre>{result?.stdout || '(nothing printed)'}</pre></div>
        )}
      </section>
    </div>
  );
}
