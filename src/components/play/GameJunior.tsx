'use client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import CrewArt from '@/components/CrewArt';
import Board3D from '@/components/lessons/Board3D';
import GameTop from './GameTop';
import Ambient from './Ambient';
import Buddy, { type BuddyEvent } from './Buddy';
import { useMusic } from './music';
import { StoryGate, storySeen } from './Cutscene';
import JuniorStrip from './JuniorStrip';
import { OopsBubble, TutorCard, WinCard, saveRun, usePlayback } from './GameParts';
import { localProgress, sfx, speak } from './fx';
import { blocksToText, checkBlocks, flatten, parseBlocks, type Block, type BlocksResult } from '@/lib/blocks';
import { lessonXp, playStars, unlockedFrom } from '@/lib/playcore';
import type { GameLevel, GameUser } from './types';

type Junior = Extract<GameLevel, { kind: 'junior' }>;
const safe = (t: string): Block[] => { try { return parseBlocks(t); } catch { return []; } };

export default function GameJunior({ level, user, saved, xp }: { level: Junior; user: GameUser | null; saved: { code: string | null; stars: number } | null; xp: number }) {
  const student = user?.role === 'student', staff = !!user && user.role !== 'student' && user.role !== 'parent';
  const [prog, setProg] = useState<Block[]>(() => safe(saved?.code ?? level.starter));
  const [phase, setPhase] = useState<'intro' | 'edit' | 'run' | 'won' | 'lost' | 'locked'>('intro');
  const [result, setResult] = useState<BlocksResult | null>(null);
  const [best, setBest] = useState(saved?.stars ?? 0);
  const [win, setWin] = useState<{ stars: number; xp: number } | null>(null);
  const [hint, setHint] = useState(-1);
  const pb = usePlayback();
  const [bev, setBev] = useState<{ kind: BuddyEvent; n: number } | null>(null);
  const react = useCallback((kind: BuddyEvent) => setBev(b => ({ kind, n: (b?.n ?? 0) + 1 })), []);
  useMusic(level.theme);
  const [story, setStory] = useState(false);
  useEffect(() => { if (level.levelNo === 1 && !storySeen(level.chapterKey)) setStory(true); }, [level]);
  const flat = useMemo(() => flatten(prog), [prog]);
  const mapHref = `/play?track=junior`;
  const tray = useRef<HTMLButtonElement>(null), slot = useRef<HTMLSpanElement>(null), playBtn = useRef<HTMLButtonElement>(null);
  const [hand, setHand] = useState<{ fx: number; fy: number; tx: number; ty: number } | null>(null);

  // Guests: levels open one by one, using progress saved in this browser.
  useEffect(() => {
    if (user) return;
    const done = new Set(Object.keys(localProgress()));
    if (!unlockedFrom(level.trackChapters, done).open.has(level.id)) setPhase('locked');
  }, [user, level]);

  const task = `${level.intro} ${level.task}`;
  const run = useCallback(async () => {
    if (phase === 'run') { pb.stop(); setPhase('edit'); return; }
    sfx('pop');
    const r = checkBlocks({ kind: 'blocks', maps: level.maps, require: level.require }, prog);
    setResult(r); setPhase('run'); setWin(null);
    react('start');
    const res = await pb.play(r.runs, react);
    if (!res.ok && r.runs[res.board]?.ok === false) { setPhase('lost'); sfx('lose'); react('fail'); speak(r.runs[res.board].error ?? 'Not yet. Try again!', false, 'glitch'); return; }
    if (!r.passed) { setPhase('lost'); sfx('lose'); react('fail'); speak(r.missing[0] ?? 'Not yet!', false, 'glitch'); return; }
    const stars = playStars(r.blocks, level.par), newBest = Math.max(best, stars);
    const gained = student ? lessonXp(level.xpType, newBest) - lessonXp(level.xpType, best) : 0;
    const saving = saveRun(level.id, blocksToText(prog), stars, student);
    await new Promise(res => setTimeout(res, 1100));
    sfx('win'); react('win'); setWin({ stars, xp: gained }); setPhase('won');
    setBest((await saving) ?? newBest);
  }, [phase, prog, level, pb, best, student]);

  // Highlight the running block, and the one that went wrong.
  const step = pb.trace[pb.frame];
  const activeId = phase === 'run' && step?.line ? flat[step.line - 1]?.id : null;
  const errLine = phase === 'lost' ? (result?.runs[pb.board]?.line ?? result?.line) : null;
  const errorId = errLine ? flat[errLine - 1]?.id : null;
  const lastBoard = result ? pb.board === result.runs.length - 1 : false;

  // The pointing hand for the very first level.
  const tutorial = level.id === '3-L1' && phase === 'edit';
  useLayoutEffect(() => {
    if (!tutorial) { setHand(null); return; }
    const place = () => {
      const from = (flat.length < 3 ? tray.current : null)?.getBoundingClientRect();
      const to = (flat.length < 3 ? slot.current : playBtn.current)?.getBoundingClientRect();
      if (!to) return setHand(null);
      const f = from ?? to;
      setHand({ fx: f.left + f.width / 2, fy: f.top + f.height / 2, tx: to.left + to.width / 2, ty: to.top + to.height / 2 });
    };
    place(); window.addEventListener('resize', place); return () => window.removeEventListener('resize', place);
  }, [tutorial, flat.length]);

  if (phase === 'locked') return (
    <div className={'gm gm-theme-' + level.theme}>
      <GameTop user={user} back={{ href: mapHref, label: 'Map' }}><b>{level.chapterTitle}</b></GameTop>
      <div className="gm-locked"><span>🔒</span><h1>This level is locked</h1><p>Finish the levels before it first.</p><Link className="gm-bigbtn" href={mapHref}>Back to the map</Link></div>
    </div>
  );

  return (
    <div className={'gm gj gm-theme-' + level.theme}>
      <GameTop user={user} back={{ href: mapHref, label: 'Map' }}>
        <span className="gm-badge">{level.chapterNo}-{level.levelNo}</span><b>{level.title}</b>
        {best > 0 && <span className="gm-best" aria-label={`Best: ${best} stars`}>{'★'.repeat(best)}{'☆'.repeat(3 - best)}</span>}
      </GameTop>
      <div className="gm-stage">
        <Ambient theme={level.theme} layer="bg" />
        <Board3D map={level.maps[pb.board] ?? level.maps[0]} trace={pb.trace} frame={pb.frame} won={!!result?.passed && lastBoard} stepMs={pb.stepMs} theme={level.theme} className="gm-board" hint={false} />
        <Ambient theme={level.theme} layer="fg" />
        {phase !== 'intro' && phase !== 'lost' && <Buddy who={level.tutor} event={bev} />}
        <div className="gm-goal">
          <CrewArt id={level.tutor} className="gm-goal-art" label="" />
          <p>{level.task}</p>
          <button type="button" className="gm-round small" onClick={() => speak(task, true, level.tutor)} aria-label="Read it to me">🔊</button>
        </div>
        <div className="gm-side">
          {level.hints.length > 0 && <button type="button" className="gm-round" onClick={() => { const h = (hint + 1) % level.hints.length; setHint(h); speak(level.hints[h], false, level.tutor); sfx('click'); react('hint'); }} aria-label="Show a hint">💡</button>}
          <button type="button" className="gm-round" onClick={() => { pb.stop(); setProg(safe(level.starter)); setPhase('edit'); setResult(null); sfx('pop'); }} aria-label="Start again">↺</button>
          {staff && level.solution && <button type="button" className="gm-round" onClick={() => { pb.stop(); setProg(safe(level.solution!)); setPhase('edit'); }} aria-label="Show the answer (teachers only)">👁</button>}
        </div>
        {level.maps.length > 1 && <div className="gm-boards" aria-label="Rooms">{level.maps.map((_, i) => <span key={i} className={i === pb.board ? 'on' : ''}>Room {i + 1}</span>)}</div>}
        {hint >= 0 && phase !== 'won' && <div className="gm-hint" role="status"><b>💡 Hint</b> {level.hints[hint].replace(/`/g, '')}<button type="button" className="gm-x" onClick={() => setHint(-1)} aria-label="Close hint">✕</button></div>}
        {phase === 'lost' && result && <OopsBubble text={result.runs[pb.board]?.error ?? result.missing[0] ?? 'Not yet!'} onRetry={() => { pb.stop(); setPhase('edit'); }} />}
      </div>
      <JuniorStrip value={prog} onChange={v => { setProg(v); if (phase === 'lost' || phase === 'won') { pb.stop(); setPhase('edit'); } }} palette={level.palette}
        activeId={activeId} errorId={errorId} disabled={phase === 'run'} minSlots={Math.max(8, level.par + 2)}
        onPlay={run} playLabel={phase === 'run' ? 'Stop' : 'Play'} refs={{ tray, slot, play: playBtn }} />
      {hand && <span className="gj-hand" aria-hidden="true" style={{ ['--fx' as string]: hand.fx + 'px', ['--fy' as string]: hand.fy + 'px', ['--tx' as string]: hand.tx + 'px', ['--ty' as string]: hand.ty + 'px' }}>👆</span>}
      {story && <StoryGate id={level.chapterKey} resumeTheme={level.theme} onDone={() => setStory(false)} />}
      {phase === 'intro' && !story && <TutorCard tutor={level.tutor} title={level.title} text={task} button="Let's go" onGo={() => setPhase('edit')} />}
      {phase === 'won' && win && <WinCard stars={win.stars} par={level.par} unit="blocks" xpGained={win.xp} next={level.next} mapHref={mapHref} guest={!user}
        onReplay={() => { pb.stop(); setPhase('edit'); setWin(null); }} />}
    </div>
  );
}
