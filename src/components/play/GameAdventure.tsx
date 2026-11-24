'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import CrewArt from '@/components/CrewArt';
import Board3D, { startOf } from '@/components/lessons/Board3D';
import GameTop from './GameTop';
import Ambient from './Ambient';
import Buddy, { type BuddyEvent } from './Buddy';
import { useMusic } from './music';
import { StoryGate, storySeen } from './Cutscene';
import CodeEditor, { type EditorApi } from './CodeEditor';
import { OopsBubble, TutorCard, WinCard, saveRun, usePlayback } from './GameParts';
import { localProgress, sfx, speak } from './fx';
import { checkScript, type ScriptResult } from '@/lib/vincscript';
import { lessonXp, playStars, unlockedFrom } from '@/lib/playcore';
import type { GameLevel, GameUser } from './types';

type Adv = Extract<GameLevel, { kind: 'adventure' }>;

/* Command buttons grow chapter by chapter. */
const SNIPPETS: { label: string; text: string; from: number }[] = [
  { label: 'step(1)', text: 'step(1)', from: 1 }, { label: 'turn_left()', text: 'turn_left()', from: 1 }, { label: 'turn_right()', text: 'turn_right()', from: 1 },
  { label: 'jump()', text: 'jump()', from: 2 }, { label: 'for … range', text: 'for i in range(3):\n    ', from: 2 },
  { label: 'while not at_spark()', text: 'while not at_spark():\n    ', from: 3 }, { label: 'if blocked()', text: 'if blocked():\n    ', from: 3 },
  { label: 'elif crate_ahead()', text: 'elif crate_ahead():\n    ', from: 3 }, { label: 'else', text: 'else:\n    ', from: 3 },
  { label: 'sparks_left() > 0', text: 'while sparks_left() > 0:\n    ', from: 3 }, { label: 'def', text: 'def my_move():\n    ', from: 4 }
];

export default function GameAdventure({ level, user, saved, xp }: { level: Adv; user: GameUser | null; saved: { code: string | null; stars: number } | null; xp: number }) {
  const student = user?.role === 'student', staff = !!user && user.role !== 'student' && user.role !== 'parent';
  const [code, setCode] = useState(saved?.code ?? level.starter);
  const [phase, setPhase] = useState<'intro' | 'edit' | 'run' | 'won' | 'lost' | 'locked'>('intro');
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [best, setBest] = useState(saved?.stars ?? 0);
  const [win, setWin] = useState<{ stars: number; xp: number } | null>(null);
  const [hint, setHint] = useState(-1);
  const [ruler, setRuler] = useState(false);
  const [measure, setMeasure] = useState<{ text: string; marks: string[] } | null>(null);
  const [view, setView] = useState(0);
  const ed = useRef<EditorApi>(null);
  const pb = usePlayback();
  const [bev, setBev] = useState<{ kind: BuddyEvent; n: number } | null>(null);
  const react = useCallback((kind: BuddyEvent) => setBev(b => ({ kind, n: (b?.n ?? 0) + 1 })), []);
  useMusic(level.theme);
  const [story, setStory] = useState(false);
  useEffect(() => { if (level.levelNo === 1 && !storySeen(level.chapterKey)) setStory(true); }, [level]);
  const mapHref = '/play?track=adventure';
  void xp;

  useEffect(() => {
    if (user) return;
    if (!unlockedFrom(level.trackChapters, new Set(Object.keys(localProgress()))).open.has(level.id)) setPhase('locked');
  }, [user, level]);

  const boardIdx = phase === 'run' || phase === 'lost' || phase === 'won' ? pb.board : view;
  const map = level.maps[boardIdx] ?? level.maps[0];

  const run = useCallback(async () => {
    if (phase === 'run') { pb.stop(); setPhase('edit'); return; }
    setMeasure(null); setRuler(false); sfx('pop');
    const r = checkScript({ kind: 'script', maps: level.maps, require: level.require }, code);
    setResult(r); setWin(null);
    if (!r.runs.length) { setPhase('lost'); sfx('lose'); react('error'); return; }
    setPhase('run');
    react('start');
    const res = await pb.play(r.runs, react);
    if (!res.ok || !r.passed) { setPhase('lost'); sfx('lose'); react('fail'); return; }
    const stars = playStars(r.blocks, level.par), newBest = Math.max(best, stars);
    const gained = student ? lessonXp(level.xpType, newBest) - lessonXp(level.xpType, best) : 0;
    const saving = saveRun(level.id, code, stars, student);
    await new Promise(res2 => setTimeout(res2, 1100));
    sfx('win'); react('win'); setWin({ stars, xp: gained }); setPhase('won');
    setBest((await saving) ?? newBest);
  }, [phase, code, level, pb, best, student]);

  // The ruler: tap a square to count the squares from Vinc.
  const onTile = useCallback((t: { r: number; c: number } | null) => {
    if (!ruler || !t) return;
    const s = startOf(map), dr = t.r - s.r, dc = t.c - s.c, marks: string[] = [];
    for (let c = Math.min(s.c, t.c); c <= Math.max(s.c, t.c); c++) marks.push(s.r + ',' + c);
    for (let r = Math.min(s.r, t.r); r <= Math.max(s.r, t.r); r++) marks.push(r + ',' + t.c);
    const parts = [dc ? `${Math.abs(dc)} ${dc > 0 ? 'right' : 'left'}` : '', dr ? `${Math.abs(dr)} ${dr > 0 ? 'down' : 'up'}` : ''].filter(Boolean);
    const text = parts.length ? parts.join(' and ') : 'That is where Vinc is';
    setMeasure({ text: (parts.length === 1 ? `${Math.abs(dc || dr)} squares ` + (dc ? (dc > 0 ? 'to the right' : 'to the left') : dr > 0 ? 'down' : 'up') : text), marks: [...new Set(marks)] });
    sfx('click');
  }, [ruler, map]);

  const err = phase === 'lost' && result ? (result.runs[pb.board]?.error ?? result.error ?? result.missing[0] ?? 'Not yet!') : null;
  const errLine = phase === 'lost' ? (result?.runs[pb.board]?.line ?? result?.line ?? null) : null;
  const step = pb.trace[pb.frame];
  const activeLine = phase === 'run' && step?.line ? step.line : null;
  const lastBoard = result ? pb.board === result.runs.length - 1 : false;
  const snippets = useMemo(() => SNIPPETS.filter(s => s.from <= level.chapter), [level.chapter]);

  if (phase === 'locked') return (
    <div className={'gm gm-theme-' + level.theme}>
      <GameTop user={user} back={{ href: mapHref, label: 'Map' }}><b>{level.chapterTitle}</b></GameTop>
      <div className="gm-locked"><span>🔒</span><h1>This level is locked</h1><p>Finish the levels before it first.</p><Link className="gm-bigbtn" href={mapHref}>Back to the map</Link></div>
    </div>
  );

  return (
    <div className={'gm ga gm-theme-' + level.theme}>
      <GameTop user={user} back={{ href: mapHref, label: 'Map' }}>
        <span className="gm-badge">{level.chapterNo}-{level.levelNo}</span><b>{level.title}</b>
        {best > 0 && <span className="gm-best" aria-label={`Best: ${best} stars`}>{'★'.repeat(best)}{'☆'.repeat(3 - best)}</span>}
      </GameTop>
      <div className="ga-main">
        <div className="gm-stage">
          <Ambient theme={level.theme} layer="bg" />
          <Board3D map={map} trace={phase === 'edit' || phase === 'intro' ? [] : pb.trace} frame={phase === 'edit' || phase === 'intro' ? -1 : pb.frame} won={!!result?.passed && lastBoard} stepMs={pb.stepMs}
            theme={level.theme} className="gm-board" hint={false} onTile={onTile} marks={measure?.marks} />
          <Ambient theme={level.theme} layer="fg" />
          {phase !== 'intro' && phase !== 'lost' && <Buddy who={level.tutor} event={bev} />}
          <div className="gm-side">
            <button type="button" className={'gm-round' + (ruler ? ' on' : '')} aria-pressed={ruler} onClick={() => { setRuler(!ruler); setMeasure(null); sfx('click'); }} aria-label="Ruler: tap a square to measure">📏</button>
          </div>
          {ruler && <div className="gm-ruler" role="status">📏 {measure ? <b>{measure.text}</b> : 'Tap a square to count the squares from Vinc.'}</div>}
          {level.maps.length > 1 && (
            <div className="gm-boards" role="tablist" aria-label="Boards">
              {level.maps.map((_, i) => <button key={i} type="button" role="tab" aria-selected={i === boardIdx} className={i === boardIdx ? 'on' : ''} disabled={phase === 'run'} onClick={() => { pb.stop(); setPhase('edit'); setView(i); }}>Board {i + 1}{result?.runs[i] ? (result.runs[i].ok ? ' ✓' : ' ✗') : ''}</button>)}
            </div>
          )}
          {err && <OopsBubble text={err} onRetry={() => { pb.stop(); setPhase('edit'); }} />}
        </div>
        <section className="ga-panel">
          <div className="ga-goal">
            <CrewArt id={level.tutor} className="gm-goal-art" label="" />
            <p><b>Goal:</b> {level.goal}</p>
            <button type="button" className="gm-round small" onClick={() => speak(`${level.say} ${level.goal}`, true, level.tutor)} aria-label="Read it to me">🔊</button>
          </div>
          <div className="ga-snips" aria-label="Insert a command">
            {snippets.map(s => <button key={s.label} type="button" className="ga-snip" onClick={() => { ed.current?.insert(s.text); sfx('click'); }} disabled={phase === 'run'}>{s.label}</button>)}
          </div>
          <CodeEditor ref={ed} value={code} onChange={v => { setCode(v); if (phase === 'lost' || phase === 'won') { pb.stop(); setPhase('edit'); } }} onRun={run} activeLine={activeLine} errorLine={errLine} disabled={phase === 'run'} />
          {result && !result.passed && result.missing.length > 0 && phase === 'lost' && <ul className="ga-missing">{result.missing.map(m => <li key={m}>{m}</li>)}</ul>}
          {hint >= 0 && <div className="gm-hint inline" role="status"><b>💡 Hint</b> {level.hints[hint]}<button type="button" className="gm-x" onClick={() => setHint(-1)} aria-label="Close hint">✕</button></div>}
          <div className="ga-actions">
            <button type="button" className="ga-run" onClick={run}>{phase === 'run' ? '■ Stop' : '▶ RUN!'}</button>
            <button type="button" className="gm-round" onClick={() => { pb.stop(); setCode(level.starter); setPhase('edit'); setResult(null); sfx('pop'); }} aria-label="Start again">↺</button>
            {level.hints.length > 0 && <button type="button" className="gm-round" onClick={() => { const h = (hint + 1) % level.hints.length; setHint(h); speak(level.hints[h], false, level.tutor); react('hint'); }} aria-label="Show a hint">💡</button>}
            {staff && level.solution && <button type="button" className="gm-round" onClick={() => { pb.stop(); setCode(level.solution!); setPhase('edit'); }} aria-label="Show the answer (teachers only)">👁</button>}
            <span className="ga-count">{(n => `${n} ${n === 1 ? 'line' : 'lines'}`)(code.split('\n').filter(l => l.replace(/#.*/, '').trim()).length)} · 3★ at {level.par}</span>
          </div>
        </section>
      </div>
      {story && <StoryGate id={level.chapterKey} resumeTheme={level.theme} onDone={() => setStory(false)} />}
      {phase === 'intro' && !story && <TutorCard tutor={level.tutor} title={level.title} text={level.say} button="OK" onGo={() => setPhase('edit')} />}
      {phase === 'won' && win && <WinCard stars={win.stars} par={level.par} unit="lines" xpGained={win.xp} next={level.next} mapHref={mapHref} guest={!user}
        onReplay={() => { pb.stop(); setPhase('edit'); setWin(null); }} />}
    </div>
  );
}
