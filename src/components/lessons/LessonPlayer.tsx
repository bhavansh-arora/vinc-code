'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lessonXp, type Check, type Lesson } from '@/data/lessons';
import CrewArt from '@/components/CrewArt';
import Board3D from './Board3D';
import BlockEditor, { BlockStack } from './BlockEditor';
import Celebration from './Celebration';
import { blocksToText, blockStars, checkBlocks, flatten, parseBlocks, type Block, type BoardRun } from '@/lib/blocks';
import { buddyOf, crewMember, type CharId } from '@/lib/crew';
import { rankOf } from '@/lib/xp';

type PublicLesson = Omit<Lesson, 'solution'> & { solution?: string; par: number };
type Result = { passed: boolean; missing?: string[]; runs: BoardRun[]; stdout: string; error: string | null; line: number | null; blocks?: number };

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

function usePythonStatus(enabled: boolean) {
  const [s, setS] = useState(status);
  useEffect(() => {
    if (!enabled) return;
    if (!worker) startWorker();
    setS(status); listeners.add(setS); return () => { listeners.delete(setS); };
  }, [enabled]);
  return enabled ? s : 'ready';
}

/* ---------------- helpers ---------------- */
function Rich({ text }: { text: string }) {
  return <>{text.split('`').map((part, i) => (i % 2 ? <code key={i} className="ls-code">{part}</code> : <span key={i}>{part}</span>))}</>;
}
function safeParse(text: string): Block[] { try { return parseBlocks(text); } catch { return []; } }
const Stars = ({ n, label }: { n: number; label?: string }) => (
  <span className="ls-stars" aria-label={label ?? `${n} of 3 stars`}>{[1, 2, 3].map(i => <span key={i} className={i <= n ? 'on' : ''} aria-hidden="true">★</span>)}</span>
);

const SNIPPETS: [string, string][] = [
  ['step()', 'step()'], ['turn_left()', 'turn_left()'], ['turn_right()', 'turn_right()'], ['jump()', 'jump()'],
  ['if blocked():', 'if blocked():\n    '], ['else:', 'else:\n    '], ['while not at_spark():', 'while not at_spark():\n    ']
];

/* ---------------- the player ---------------- */
export default function LessonPlayer({ lesson, mode, savedCode, done, bestStars = 0, xp = 0, next, back }: {
  lesson: PublicLesson; mode: 'student' | 'preview'; savedCode?: string | null; done?: boolean; bestStars?: number; xp?: number;
  next?: { href: string; title: string } | null; back: string;
}) {
  const isBlocks = lesson.check.kind === 'blocks';
  const py = usePythonStatus(!isBlocks);
  const [code, setCode] = useState(savedCode ?? lesson.starter);
  const [prog, setProg] = useState<Block[]>(() => (isBlocks ? safeParse(savedCode ?? lesson.starter) : []));
  const [asCode, setAsCode] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [hints, setHints] = useState(0);
  const [board, setBoard] = useState(0);
  const [frame, setFrame] = useState(-1);
  const [passedOnce, setPassedOnce] = useState(!!done);
  const [best, setBest] = useState(bestStars);
  const [xpNow, setXpNow] = useState(xp);
  const [pending, setPending] = useState<{ stars: number; before: number; gained: number } | null>(null);
  const [cel, setCel] = useState<{ stars: number; before: number; gained: number } | null>(null);
  const [saved, setSaved] = useState('');
  const [armReset, setArmReset] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const gutter = useRef<HTMLDivElement>(null);

  const maps = lesson.check.kind === 'vinc' || lesson.check.kind === 'blocks' ? lesson.check.maps : [];
  const hasBoard = maps.length > 0;
  const runOf = (i: number) => result?.runs?.[i];
  const trace = useMemo(() => runOf(board)?.trace ?? [], [result, board]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeLine = frame >= 0 && trace[frame] ? trace[frame].line : null;
  const errLine = result && !result.passed ? result.line : null;
  const lineCount = code.split('\n').length;
  const flat = useMemo(() => flatten(prog), [prog]);
  const blockCount = flat.length;
  const stepMs = Math.max(90, Math.min(420, 7000 / Math.max(1, trace.length)));
  const guide: CharId = lesson.guide ?? (lesson.type === 'Catch Glitch' ? 'glitch' : 'vinc');
  const buddy = buddyOf(lesson.grade);
  const starRule = isBlocks
    ? `★★★ for ${lesson.par} blocks or fewer · ★★ for up to ${lesson.par + 2} · ★ for any program that works`
    : '★★★ with no hints · ★★ with one hint · ★ with more hints';
  const rank = rankOf(xpNow);

  // Animate the selected board's trace.
  useEffect(() => {
    if (!trace.length) { setFrame(-1); return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setFrame(trace.length - 1); return; }
    setFrame(-1);
    let i = -1;
    const t = setInterval(() => { i++; setFrame(i); if (i >= trace.length - 1) clearInterval(t); }, stepMs);
    return () => clearInterval(t);
  }, [trace, stepMs]);

  // Celebrate once Vinc has finished moving.
  useEffect(() => {
    if (!pending) return;
    if (hasBoard && trace.length && frame < trace.length - 1) return;
    const t = setTimeout(() => { setCel(pending); setPending(null); }, hasBoard ? 1100 : 300);
    return () => clearTimeout(t);
  }, [pending, frame, trace, hasBoard]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true); setResult(null); setCel(null); setPending(null);
    let r: Result, stars = 0;
    if (lesson.check.kind === 'blocks') {
      const c = checkBlocks(lesson.check, prog);
      r = c; stars = c.passed ? blockStars(c.blocks, lesson.par) : 0;
    } else {
      r = await runPython(code, lesson.check);
      stars = r.passed ? (hints === 0 ? 3 : hints === 1 ? 2 : 1) : 0;
    }
    setResult(r); setRunning(false);
    const bad = r.runs?.findIndex(x => !x.ok) ?? -1;
    setBoard(bad >= 0 ? bad : 0);
    if (r.passed) {
      const newBest = Math.max(best, stars);
      const gained = mode === 'student' ? lessonXp(lesson.type, newBest) - lessonXp(lesson.type, best) : 0;
      setPending({ stars, before: xpNow, gained });
      setPassedOnce(true); setBest(newBest); setXpNow(x => x + gained);
    }
    if (mode === 'student') {
      try {
        const res = await fetch('/api/lessons/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lesson.id, code: isBlocks ? blocksToText(prog) : code, passed: r.passed, hints }) });
        setSaved(res.ok ? 'Saved' : res.status === 401 ? 'Logged out: your work was not saved' : 'Could not save');
      } catch { setSaved('Could not save. Check your internet.'); }
    }
  }, [code, prog, lesson, mode, running, hints, best, xpNow, isBlocks]);

  function editBlocks(v: Block[]) { setProg(v); if (result) { setResult(null); setFrame(-1); } }

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
      setCode(value.slice(0, s) + '    ' + value.slice(en)); requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = el;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const line = value.slice(lineStart, s);
      let indent = line.match(/^ */)![0];
      if (line.trimEnd().endsWith(':')) indent += '    ';
      setCode(value.slice(0, s) + '\n' + indent + value.slice(en)); requestAnimationFrame(() => el.setSelectionRange(s + 1 + indent.length, s + 1 + indent.length));
    }
  }

  function reset() {
    if (!armReset) { setArmReset(true); setTimeout(() => setArmReset(false), 3000); return; }
    if (isBlocks) setProg(safeParse(lesson.starter)); else setCode(lesson.starter);
    setResult(null); setArmReset(false);
  }
  function showSolution() {
    if (!lesson.solution) return;
    if (isBlocks) setProg(safeParse(lesson.solution)); else setCode(lesson.solution);
    setResult(null);
  }

  const runLabel = running ? 'Running…' : py === 'loading' ? 'Loading Python…' : '▶ Run';
  const exampleBlocks = isBlocks && lesson.example ? safeParse(lesson.example.code) : null;

  return (
    <div className={'ls' + (isBlocks ? ' ls-blocks' : '')}>
      <section className="ls-info">
        <a href={back} className="small">← All lessons</a>
        {mode === 'student' && (
          <div className="ls-hud" aria-label="Your progress">
            <span className="ls-rank"><span aria-hidden="true">{rank.icon}</span> {rank.name}</span>
            <span className="ls-xpbar" title={`${xpNow} XP`}><span style={{ width: `${Math.round(rank.progress * 100)}%` }} /></span>
            <span className="mono small">{xpNow} XP</span>
          </div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <span className="eyebrow">Class {lesson.grade} · Lesson {lesson.n}</span>
          <span className={'ls-type t-' + lesson.type.replace(/\s|:/g, '').toLowerCase()}>{lesson.type}</span>
          {passedOnce && <Stars n={best} label={`Best: ${best} of 3 stars`} />}
        </div>
        <h1>{lesson.title}</h1>
        <div className={'ls-intro speaker-' + guide}>
          <CrewArt id={guide} className="ls-avatar" label="" />
          <div><span className="ls-who">{crewMember(guide).name}</span><p>{lesson.intro}</p></div>
        </div>
        <div className="ls-learn">
          <div className="ls-learn-head"><CrewArt id={buddy.id} className="ls-mini" label="" still /><span>{buddy.name} explains</span></div>
          {lesson.explain.map((p, i) => <p key={i} className="ls-p"><Rich text={p} /></p>)}
        </div>
        {lesson.example && (
          <div className="ls-example"><span className="label">Example</span>
            {exampleBlocks ? <BlockStack blocks={exampleBlocks} /> : <pre>{lesson.example.code}</pre>}
            {lesson.example.note && <p className="small muted">{lesson.example.note}</p>}
          </div>
        )}
        <div className="ls-task"><b>🎯 Your task</b><p><Rich text={lesson.task} /></p>
          {lesson.check.require?.uses && <p className="small muted">Your program must use: {lesson.check.require.uses.map(u => <code className="ls-code" key={u}>{u}</code>)}</p>}
          {lesson.check.kind === 'blocks' && lesson.check.require?.maxBlocks && <p className="small muted">At most {lesson.check.require.maxBlocks} blocks.</p>}
          <p className="small muted ls-rule">{starRule}</p>
        </div>
        <div className="ls-hints">
          {lesson.hints.slice(0, hints).map((h, i) => <p key={i} className="ls-hint"><b>Hint {i + 1}:</b> <Rich text={h} /></p>)}
          {hints < lesson.hints.length && <button type="button" className="btn small quiet" onClick={() => setHints(h => h + 1)}>💡 Show a hint ({hints + 1} of {lesson.hints.length}){!isBlocks && hints < 2 ? ' · costs a star' : ''}</button>}
        </div>
      </section>

      <section className="ls-work">
        <div className="ls-toolbar">
          <button type="button" className="btn primary ls-run" onClick={run} disabled={running || py === 'error'}>{runLabel}</button>
          <button type="button" className="btn small quiet" onClick={reset}>{armReset ? 'Tap again to reset' : isBlocks ? 'Start again' : 'Reset code'}</button>
          {isBlocks && <button type="button" className="btn small quiet" aria-pressed={asCode} onClick={() => setAsCode(v => !v)}>{asCode ? 'Hide code' : 'Show as code'}</button>}
          {mode === 'preview' && lesson.solution && <button type="button" className="btn small quiet" onClick={showSolution}>Show model solution</button>}
          <span className="small muted ls-saved">{saved || (isBlocks ? `${blockCount} ${blockCount === 1 ? 'block' : 'blocks'} · par ${lesson.par}` : py === 'loading' ? 'Starting Python (first time takes a few seconds)…' : 'Ctrl + Enter also runs')}</span>
        </div>

        {isBlocks ? (
          <>
            <BlockEditor value={prog} onChange={editBlocks} palette={lesson.palette ?? ['step', 'turnLeft', 'turnRight']}
              activeId={activeLine ? flat[activeLine - 1]?.id : null} errorId={errLine ? flat[errLine - 1]?.id : null} disabled={running} />
            {asCode && <pre className="bk-code" aria-label="Your blocks as code">{blocksToText(prog) || '(no blocks yet)'}</pre>}
          </>
        ) : (
          <>
            {lesson.check.kind === 'vinc' && <div className="ls-snips" aria-label="Insert code">{SNIPPETS.map(([label, t]) => <button type="button" key={label} className="ls-snip" onClick={() => insert(t)}>{label}</button>)}</div>}
            <div className="ls-editor">
              <div className="ls-gutter" ref={gutter} aria-hidden="true">
                {Array.from({ length: lineCount }, (_, i) => <div key={i} className={i + 1 === activeLine ? 'on' : i + 1 === errLine ? 'err' : ''}>{i + 1}</div>)}
              </div>
              <textarea ref={ta} value={code} onChange={e => setCode(e.target.value)} onKeyDown={onKey} spellCheck={false} autoCapitalize="none" autoCorrect="off" aria-label="Your Python code"
                onScroll={e => { if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop; }} rows={Math.max(8, lineCount + 1)} />
            </div>
          </>
        )}

        {result && (
          <div className={'ls-result ' + (result.passed ? 'pass' : 'fail')} role="status">
            {result.passed ? (
              <>
                <b>✓ Lesson complete!</b>
                <span>{mode === 'student' ? 'Your work is saved.' : 'The check passes.'}</span>
                {next ? <a className="btn primary small" href={next.href}>Next: {next.title} →</a> : <a className="btn small" href={back}>Back to all lessons</a>}
              </>
            ) : (
              <>
                <div className="ls-glitch"><CrewArt id="glitch" className="ls-mini" label="" /><b>{isBlocks ? 'Not yet!' : 'Not yet.'} {result.line ? (isBlocks ? `Look at block ${result.line}.` : `Look at line ${result.line}.`) : ''}</b></div>
                {result.error && <pre className="ls-err">{result.error}</pre>}
                {result.missing && result.missing.length > 0 && <ul>{result.missing.map(m => <li key={m}>{m}</li>)}</ul>}
              </>
            )}
          </div>
        )}
        {hasBoard && (
          <div className="ls-boards">
            {maps.length > 1 && (
              <div className="ls-board-tabs" role="tablist" aria-label="Boards">
                {maps.map((_, i) => {
                  const r = runOf(i);
                  return <button type="button" role="tab" key={i} aria-selected={board === i} className={r ? (r.ok ? 'ok' : 'bad') : ''} onClick={() => setBoard(i)}>Board {i + 1}{r ? (r.ok ? ' ✓' : ' ✗') : ''}</button>;
                })}
              </div>
            )}
            <Board3D map={maps[board]} trace={trace} frame={frame} won={!!runOf(board)?.ok && !!result?.passed} stepMs={stepMs} />
            {runOf(board) && <p className="small muted">Sparks: {runOf(board)!.sparks} of {runOf(board)!.total}{runOf(board)!.error ? ` · ${runOf(board)!.error}` : ''}</p>}
          </div>
        )}

        {!isBlocks && (result?.stdout || (!hasBoard && result)) && (
          <div className="ls-console"><span className="label">Output</span><pre>{result?.stdout || '(nothing printed)'}</pre></div>
        )}
      </section>

      {cel && (
        <Celebration stars={cel.stars} starRule={starRule} xpBefore={cel.before} xpGained={cel.gained} guide={guide === 'glitch' ? buddy.id : guide}
          next={next ?? null} back={back} student={mode === 'student'} onClose={() => setCel(null)} onRetry={isBlocks ? () => { setCel(null); setResult(null); } : null} />
      )}
    </div>
  );
}
