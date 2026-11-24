'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CrewArt from '@/components/CrewArt';
import Board3D from '@/components/lessons/Board3D';
import { runPython, usePythonStatus, type PyResult } from '@/components/lessons/python';
import GameTop from './GameTop';
import Ambient from './Ambient';
import Buddy, { type BuddyEvent } from './Buddy';
import CodeEditor, { type EditorApi } from './CodeEditor';
import { OopsBubble, TutorCard, WinCard, usePlayback } from './GameParts';
import { localProgress, saveLocal, sfx, speak } from './fx';
import { useMusic } from './music';
import { StoryGate, storySeen } from './Cutscene';
import { lessonXp, unlockedFrom } from '@/lib/playcore';
import type { GameLevel, GameUser } from './types';

type Py = Extract<GameLevel, { kind: 'python' }>;
const STAGE = ['.....', '..>..', '.....'];

const SNIPS: Record<number, [string, string][]> = {
  5: [['step()', 'step()'], ['turn_left()', 'turn_left()'], ['turn_right()', 'turn_right()'], ['jump()', 'jump()'], ['if blocked():', 'if blocked():\n    '], ['else:', 'else:\n    '], ['while not at_spark():', 'while not at_spark():\n    ']],
  6: [['print()', 'print("")'], ['input()', 'input("")'], ['int()', 'int()'], ['while', 'while n > 0:\n    '], ['for … range', 'for i in range(3):\n    '], ['if', 'if x > 0:\n    '], ['else:', 'else:\n    ']],
  7: [['def', 'def my_move():\n    '], ['return', 'return '], ['print()', 'print()'], ['for … range', 'for i in range(3):\n    '], ['if', 'if x > 0:\n    '], ['step()', 'step()'], ['turn_left()', 'turn_left()']],
  8: [['[ ] list', 'items = []'], ['.append()', '.append()'], ['for x in', 'for x in items:\n    '], ['{ } dict', 'data = {}'], ['len()', 'len()'], ['def', 'def name():\n    '], ['return', 'return ']]
};

function Rich({ text }: { text: string }) {
  return <>{text.split('`').map((part, i) => (i % 2 ? <code key={i} className="py-code">{part}</code> : <span key={i}>{part}</span>))}</>;
}
/** Types text out one character at a time, like an old computer screen. */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(text.length); return; }
    // Time-based, so slow devices still finish quickly: about 110 characters a second.
    setN(0); const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => { const k = Math.ceil((t - t0) / 9); setN(k); if (k < text.length) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return <>{text.slice(0, n)}<span className="mx-caret">▌</span></>;
}

export default function GamePython({ level, user, saved, xp }: { level: Py; user: GameUser | null; saved: { code: string | null; stars: number } | null; xp: number }) {
  const student = user?.role === 'student', staff = !!user && user.role !== 'student' && user.role !== 'parent';
  const py = usePythonStatus(true);
  const [code, setCode] = useState(saved?.code ?? level.starter);
  const [phase, setPhase] = useState<'intro' | 'edit' | 'run' | 'won' | 'lost' | 'locked'>('intro');
  const [result, setResult] = useState<PyResult | null>(null);
  const [best, setBest] = useState(saved?.stars ?? 0);
  const [win, setWin] = useState<{ stars: number; xp: number } | null>(null);
  const [hints, setHints] = useState(0);
  const [learn, setLearn] = useState(true);
  const [view, setView] = useState(0);
  const [pulse, setPulse] = useState<{ kind: 'win' | 'oops'; n: number } | null>(null);
  const [bev, setBev] = useState<{ kind: BuddyEvent; n: number } | null>(null);
  const react = useCallback((kind: BuddyEvent) => setBev(b => ({ kind, n: (b?.n ?? 0) + 1 })), []);
  const ed = useRef<EditorApi>(null);
  const pb = usePlayback();
  const isBoard = level.check.kind === 'vinc';
  const mapHref = '/play?track=python';
  void xp;
  useMusic(level.theme);
  const [story, setStory] = useState(false);
  useEffect(() => { if (level.levelNo === 1 && !storySeen(level.chapterKey)) setStory(true); }, [level]);

  useEffect(() => {
    if (user) return;
    if (!unlockedFrom(level.trackChapters, new Set(Object.keys(localProgress())), true).open.has(level.id)) setPhase('locked');
  }, [user, level]);

  const run = useCallback(async () => {
    if (phase === 'run') { pb.stop(); setPhase('edit'); return; }
    if (py !== 'ready') return;
    sfx('pop'); setWin(null); setPhase('run'); react('start');
    const r = await runPython(code, level.check);
    setResult(r);
    let ok = r.passed;
    if (isBoard && r.runs.length) { const res = await pb.play(r.runs, react); ok = ok && res.ok; }
    else await new Promise(res => setTimeout(res, 900));
    if (!ok) {
      setPhase('lost'); sfx('lose'); setPulse(p => ({ kind: 'oops', n: (p?.n ?? 0) + 1 }));
      speak(r.error?.split('\n')[0] ?? r.missing?.[0] ?? 'Not yet!'); return;
    }
    const stars = hints === 0 ? 3 : hints === 1 ? 2 : 1, newBest = Math.max(best, stars);
    const gained = student ? lessonXp(level.xpType, newBest) - lessonXp(level.xpType, best) : 0;
    if (!isBoard) setPulse(p => ({ kind: 'win', n: (p?.n ?? 0) + 1 }));
    let saving: Promise<number | null> = Promise.resolve(null);
    if (student) saving = fetch('/api/play/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: level.id, code, passed: true, hints }) })
      .then(x => (x.ok ? x.json() : null)).then(j => j?.best ?? null).catch(() => null);
    else saveLocal(level.id, stars, code);
    await new Promise(res => setTimeout(res, 1100));
    sfx('win'); react('win'); setWin({ stars, xp: gained }); setPhase('won');
    setBest((await saving) ?? newBest);
  }, [phase, py, code, level, isBoard, pb, react, hints, best, student]);

  const board = phase === 'run' || phase === 'lost' || phase === 'won' ? pb.board : view;
  const map = isBoard ? (level.maps[board] ?? level.maps[0]) : STAGE;
  const errLine = phase === 'lost' ? (result?.runs?.[pb.board]?.line ?? result?.line ?? null) : null;
  const step = pb.trace[pb.frame];
  const activeLine = phase === 'run' && step?.line ? step.line : null;
  const lastBoard = result ? pb.board === result.runs.length - 1 : false;
  const err = phase === 'lost' && result ? (result.runs?.[pb.board]?.error ?? result.error ?? result.missing?.[0] ?? 'Not yet!') : null;
  const out = result?.stdout ?? '';
  const inputs = level.check.kind === 'output' ? (level.check.cases?.map(c => c.inputs ?? []) ?? (level.check.inputs ? [level.check.inputs] : [])) : [];

  if (phase === 'locked') return (
    <div className={'gm gm-theme-' + level.theme}>
      <GameTop user={user} back={{ href: mapHref, label: 'Map' }}><b>{level.chapterTitle}</b></GameTop>
      <div className="gm-locked"><span>🔒</span><h1>This level is locked</h1><p>Finish the levels before it first.</p><Link className="gm-bigbtn" href={mapHref}>Back to the map</Link></div>
    </div>
  );

  return (
    <div className={'gm ga gp gm-theme-' + level.theme}>
      <GameTop user={user} back={{ href: mapHref, label: 'Map' }}>
        <span className="gm-badge">{level.grade}-{level.levelNo}</span><b>{level.title}</b>
        {best > 0 && <span className="gm-best" aria-label={`Best: ${best} stars`}>{'★'.repeat(best)}{'☆'.repeat(3 - best)}</span>}
      </GameTop>
      <div className="ga-main">
        <div className="gm-stage">
          <Ambient theme={level.theme} layer="bg" />
          <Board3D map={map} trace={isBoard && phase !== 'edit' && phase !== 'intro' ? pb.trace : []} frame={isBoard && phase !== 'edit' && phase !== 'intro' ? pb.frame : -1}
            won={!!result?.passed && lastBoard && isBoard} stepMs={pb.stepMs} theme={level.theme} className="gm-board" hint={false} pulse={pulse} />
          <Ambient theme={level.theme} layer="fg" />
          {!isBoard && (
            <div className={'mx-screen' + (phase === 'run' ? ' busy' : '') + (phase === 'won' ? ' good' : '') + (phase === 'lost' ? ' bad' : '')}>
              <div className="mx-head"><span>🖥️ Vinc’s screen</span><span className="mx-dots"><i /><i /><i /></span></div>
              {inputs.length > 0 && <p className="mx-in">Answers typed in for you: {inputs.map((x, i) => <code key={i}>{x.join(', ')}</code>)}</p>}
              <pre className="mx-out">{phase === 'run' && !result ? 'Running…' : out ? <Typed text={out} /> : result ? '(nothing printed)' : 'Press RUN to see what your program does.'}</pre>
              {level.check.kind === 'output' && level.check.cases && result && (
                <ul className="mx-cases">{level.check.cases.map((c, i) => <li key={i} className={result.runs?.[i]?.ok ? 'ok' : 'no'}>{result.runs?.[i]?.ok ? '✓' : '✗'} Test {i + 1}{c.inputs ? `: ${c.inputs.join(', ')}` : ''}</li>)}</ul>
              )}
              {level.check.kind === 'tests' && result && <p className={'mx-check ' + (result.passed ? 'ok' : 'no')}>{result.passed ? '✓ Every check passed!' : '✗ A check did not pass yet.'}</p>}
            </div>
          )}
          {isBoard && level.maps.length > 1 && (
            <div className="gm-boards" role="tablist" aria-label="Boards">
              {level.maps.map((_, i) => <button key={i} type="button" role="tab" aria-selected={i === board} className={i === board ? 'on' : ''} disabled={phase === 'run'} onClick={() => { pb.stop(); setPhase('edit'); setView(i); }}>Board {i + 1}{result?.runs?.[i] ? (result.runs[i].ok ? ' ✓' : ' ✗') : ''}</button>)}
            </div>
          )}
          {phase !== 'intro' && phase !== 'lost' && <Buddy who={level.tutor} event={bev} />}
          {err && <OopsBubble text={err} onRetry={() => { pb.stop(); setPhase('edit'); }} />}
        </div>
        <section className="ga-panel">
          <div className="ga-goal">
            <CrewArt id={level.tutor} className="gm-goal-art" label="" />
            <p><b>Mission:</b> <Rich text={level.task} /></p>
            <button type="button" className="gm-round small" onClick={() => speak(`${level.intro} ${level.task}`, true)} aria-label="Read it to me">🔊</button>
          </div>
          <details className="py-learn" open={learn} onToggle={e => setLearn((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>📜 Learn: how it works</summary>
            {level.explain.map((p, i) => <p key={i}><Rich text={p} /></p>)}
            {level.example && <div className="py-example"><span>Example</span><pre>{level.example.code}</pre>{level.example.note && <small>{level.example.note}</small>}</div>}
            {level.check.require?.uses && <p className="py-must">Your code must use: {level.check.require.uses.map(u => <code key={u} className="py-code">{u}</code>)}</p>}
          </details>
          <div className="ga-snips" aria-label="Insert code">
            {(SNIPS[level.grade] ?? SNIPS[6]).map(([label, t]) => <button key={label} type="button" className="ga-snip" onClick={() => { ed.current?.insert(t); sfx('click'); }} disabled={phase === 'run'}>{label}</button>)}
          </div>
          <CodeEditor ref={ed} value={code} onChange={v => { setCode(v); if (phase === 'lost' || phase === 'won') { pb.stop(); setPhase('edit'); } }} onRun={run} activeLine={activeLine} errorLine={errLine} disabled={phase === 'run'} />
          {phase === 'lost' && result?.missing && result.missing.length > 0 && <ul className="ga-missing">{result.missing.map(m => <li key={m}>{m}</li>)}</ul>}
          {hints > 0 && <div className="gm-hint inline" role="status">{level.hints.slice(0, hints).map((h, i) => <p key={i}><b>💡 Hint {i + 1}:</b> <Rich text={h} /></p>)}</div>}
          <div className="ga-actions">
            <button type="button" className="ga-run" onClick={run} disabled={py === 'error'}>{phase === 'run' ? '■ Stop' : py === 'loading' ? '⏳ Loading Python…' : '▶ RUN!'}</button>
            <button type="button" className="gm-round" onClick={() => { pb.stop(); setCode(level.starter); setPhase('edit'); setResult(null); sfx('pop'); }} aria-label="Start again">↺</button>
            {hints < level.hints.length && <button type="button" className="gm-round" onClick={() => { setHints(h => h + 1); speak(level.hints[hints].replace(/`/g, '')); react('hint'); }} aria-label={`Show hint ${hints + 1} (costs a star)`}>💡</button>}
            {staff && level.solution && <button type="button" className="gm-round" onClick={() => { pb.stop(); setCode(level.solution!); setPhase('edit'); }} aria-label="Show the answer (teachers only)">👁</button>}
            <span className="ga-count">{hints === 0 ? '★★★ no hints used' : hints === 1 ? '★★ one hint used' : '★ hints used'}</span>
          </div>
          {py === 'loading' && phase !== 'intro' && <p className="py-loading">Starting Python. The first time takes a few seconds…</p>}
        </section>
      </div>
      {story && <StoryGate id={level.chapterKey} resumeTheme={level.theme} onDone={() => setStory(false)} />}
      {phase === 'intro' && !story && <TutorCard tutor={level.tutor} title={level.title} text={level.intro} button="Let's go" onGo={() => setPhase('edit')} />}
      {phase === 'won' && win && <WinCard stars={win.stars} par={0} unit="" xpGained={win.xp} next={level.next} mapHref={mapHref} guest={!user}
        onReplay={() => { pb.stop(); setPhase('edit'); setWin(null); }} />}
    </div>
  );
}
