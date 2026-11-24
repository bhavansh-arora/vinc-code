'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import CrewArt from '@/components/CrewArt';
import { crewMember, type CharId } from '@/lib/crew';
import type { BoardRun } from '@/lib/blocks';
import { saveLocal, sfx, speak } from './fx';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Plays each board's run in turn, with sounds, and reports whether every board was solved. */
export function usePlayback() {
  const [board, setBoard] = useState(0);
  const [frame, setFrame] = useState(-1);
  const [runs, setRuns] = useState<BoardRun[] | null>(null);
  const token = useRef(0);
  const stop = useCallback(() => { token.current++; setRuns(null); setFrame(-1); }, []);
  const play = useCallback(async (rs: BoardRun[], onEvent?: (e: 'spark' | 'bump') => void): Promise<{ ok: boolean; board: number }> => {
    const speed = 1;
    const my = ++token.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setRuns(rs);
    for (let b = 0; b < rs.length; b++) {
      const t = rs[b].trace, ms = Math.max(140, Math.min(480, 9000 / Math.max(1, t.length))) / speed;
      setBoard(b); setFrame(-1);
      await sleep(b ? 650 : 250); if (my !== token.current) return { ok: false, board: b };
      if (reduce) setFrame(t.length - 1);
      else for (let i = 0; i < t.length; i++) {
        if (my !== token.current) return { ok: false, board: b };
        setFrame(i);
        const s = t[i];
        sfx(s.a === 'bump' ? 'bump' : s.a === 'jump' ? 'jump' : s.a === 'turn' ? 'turn' : 'step');
        if (s.a === 'bump') onEvent?.('bump');
        if (s.got > (i ? t[i - 1].got : 0)) { setTimeout(() => sfx('spark'), 120); onEvent?.('spark'); }
        await sleep(ms);
      }
      if (!rs[b].ok) return { ok: false, board: b };
      if (b < rs.length - 1) await sleep(500);
    }
    return { ok: true, board: rs.length - 1 };
  }, []);
  useEffect(() => () => { token.current++; }, []);
  const trace = runs?.[board]?.trace ?? [];
  const stepMs = Math.max(140, Math.min(480, 9000 / Math.max(1, trace.length)));
  return { board, setBoard, frame, runs, trace, stepMs, play, stop };
}

/** Saves a finished run: to the student's account, or in this browser for guests. Returns the best stars so far. */
export async function saveRun(id: string, code: string, stars: number, student: boolean): Promise<number | null> {
  if (!student) { if (stars) saveLocal(id, stars, code); return null; }
  try {
    const r = await fetch('/api/play/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, code }) });
    if (!r.ok) return null;
    return (await r.json()).best ?? null;
  } catch { return null; }
}

/** A crew member's speech card, read aloud when the player taps the button. */
export function TutorCard({ tutor, title, text, button, onGo }: { tutor: CharId; title: string; text: string; button: string; onGo: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="gm-veil">
      <div className="gm-tutor" role="dialog" aria-modal="true" aria-labelledby="gm-tutor-t">
        <CrewArt id={tutor} className="gm-tutor-art" label={crewMember(tutor).name} />
        <div className="gm-bubble">
          <span className="gm-kicker">{crewMember(tutor).name}</span>
          <h2 id="gm-tutor-t">{title}</h2>
          <p>{text}</p>
          <div className="gm-row">
            <button ref={ref} type="button" className="gm-bigbtn" onClick={() => { sfx('pop'); speak(text, false, tutor); onGo(); }}>{button} ▶</button>
            <button type="button" className="gm-round" onClick={() => speak(text, true, tutor)} aria-label="Read it to me">🔊</button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { WIN_CHEERS as CHEERS, winLine } from '@/lib/voice';
const CONFETTI = Array.from({ length: 40 }, (_, i) => ({ l: (i * 37) % 100, d: (i % 10) * 0.06, t: 1.5 + (i % 5) * 0.3, c: ['#D98A1C', '#1F6F66', '#C2502A', '#8C3557', '#4C7424', '#E8B030', '#4FA9D8'][i % 7] }));

/** The level-complete screen: stars dropping onto the scene, XP, and Replay / Next / Map. */
export function WinCard({ stars, par, unit, xpGained, next, mapHref, onReplay, guest }: {
  stars: number; par: number; unit: string; xpGained: number; next: string | null; mapHref: string; onReplay: () => void; guest: boolean;
}) {
  const cheer = CHEERS[(par + stars) % CHEERS.length];
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => { ref.current?.focus(); speak(winLine(cheer, stars)); }, [cheer, stars]);
  return (
    <div className="gm-veil win">
      <div className="gm-confetti" aria-hidden="true">{CONFETTI.map((c, i) => <i key={i} style={{ left: c.l + '%', background: c.c, animationDelay: c.d + 's', animationDuration: c.t + 's' }} />)}</div>
      <div className="gm-win" role="dialog" aria-modal="true" aria-labelledby="gm-win-t">
        <div className="gm-bigstars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map(i => <span key={i} className={i <= stars ? 'on' : ''} style={{ animationDelay: 0.15 + i * 0.25 + 's' }}>★</span>)}
        </div>
        <h2 id="gm-win-t">{cheer}</h2>
        <p>{!unit ? (stars === 3 ? 'Perfect! No hints needed.' : 'Solved! Next time, try it with fewer hints for 3 stars.') : stars === 3 ? `Perfect! ${par} ${unit} or fewer.` : `Solved! Can you do it in ${par} ${unit} for 3 stars?`}</p>
        {xpGained > 0 && <p className="gm-xp">+{xpGained} XP</p>}
        {guest && <p className="gm-small">Playing as a guest: stars are saved on this device. <Link href="/login">Log in</Link> to keep them.</p>}
        <div className="gm-row center">
          <button type="button" className="gm-round big pink" onClick={onReplay} aria-label="Play this level again">↺</button>
          <Link ref={ref} href={next ? `/play/${next}` : mapHref} className="gm-round big blue" aria-label={next ? 'Next level' : 'Back to the map'}>{next ? '»' : '🗺'}</Link>
          <Link href={mapHref} className="gm-round big" aria-label="Map">🗺</Link>
        </div>
      </div>
    </div>
  );
}

/** Glitch pops up to explain what went wrong. */
export function OopsBubble({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="gm-oops" role="status">
      <CrewArt id="glitch" className="gm-oops-art" label="Glitch" />
      <div><b>Hee hee! Not yet.</b><p>{text}</p></div>
      <button type="button" className="gm-bigbtn small" onClick={onRetry}>Try again</button>
    </div>
  );
}
