'use client';
import { useEffect, useRef, useState } from 'react';
import CrewArt from '@/components/CrewArt';
import type { CharId } from '@/lib/crew';
import { rankOf } from '@/lib/xp';

const CONFETTI = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 29) % 100, delay: (i % 9) * 0.07, dur: 1.6 + (i % 5) * 0.25, rot: (i * 47) % 360,
  color: ['#D98A1C', '#1F6F66', '#C2502A', '#8C3557', '#4C7424', '#E8B030'][i % 6]
}));
const CHEERS = ['Brilliant!', 'You did it!', 'Super coder!', 'Amazing!', 'Wow, nice code!'];

function useCountUp(to: number, from: number, ms = 900) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(to); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, ms]);
  return v;
}

/** The lesson-complete screen: stars, XP, rank and the crew cheering. */
export default function Celebration({ stars, starRule, xpBefore, xpGained, guide, next, back, onRetry, onClose, student }: {
  stars: number; starRule: string; xpBefore: number; xpGained: number; guide: CharId;
  next: { href: string; title: string } | null; back: string; onRetry: (() => void) | null; onClose: () => void; student: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const xp = useCountUp(xpBefore + xpGained, xpBefore);
  const before = rankOf(xpBefore), now = rankOf(xp), after = rankOf(xpBefore + xpGained);
  const rankUp = after.level > before.level;
  const cheer = CHEERS[(xpBefore + stars) % CHEERS.length];
  useEffect(() => {
    box.current?.querySelector<HTMLElement>('.cel-actions .btn')?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="cel-back" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cel-confetti" aria-hidden="true">
        {CONFETTI.map((c, i) => <i key={i} style={{ left: c.left + '%', background: c.color, animationDelay: c.delay + 's', animationDuration: c.dur + 's', transform: `rotate(${c.rot}deg)` }} />)}
      </div>
      <div className="cel" role="dialog" aria-modal="true" aria-labelledby="cel-title" ref={box}>
        <div className="cel-crew" aria-hidden="true">
          <CrewArt id="vinc" className="cel-c1" label="" />
          {guide !== 'vinc' && <CrewArt id={guide} className="cel-c2" label="" />}
        </div>
        <h2 id="cel-title">{cheer} Lesson complete.</h2>
        <div className="cel-stars" aria-label={`${stars} of 3 stars`}>
          {[1, 2, 3].map(i => <span key={i} className={'cel-star' + (i <= stars ? ' on' : '')} style={{ animationDelay: 0.25 + i * 0.28 + 's' }}>★</span>)}
        </div>
        <p className="small muted">{starRule}</p>
        {student ? (
          <div className="cel-xp">
            <div className="spread"><b>{now.icon} {now.name}</b><span className="mono">{xpGained > 0 ? `+${xpGained} XP` : 'No new XP: you already had these stars'}</span></div>
            <div className="cel-bar"><span style={{ width: `${Math.round(now.progress * 100)}%` }} /></div>
            <div className="spread small muted"><span>{xp} XP</span><span>{now.next ? `${now.next.xp - xp} XP to ${now.next.name}` : 'Top rank!'}</span></div>
            {rankUp && <p className="cel-rankup">New rank: {after.icon} <b>{after.name}</b>!</p>}
          </div>
        ) : <p className="small muted">Students earn XP and ranks here. Your preview is not saved.</p>}
        <div className="cel-actions">
          {next ? <a className="btn primary" href={next.href}>Next: {next.title} →</a> : <a className="btn primary" href={back}>Back to all lessons</a>}
          {stars < 3 && onRetry && <button type="button" className="btn" onClick={onRetry}>Try for 3 stars: use fewer blocks</button>}
          <button type="button" className="btn quiet" onClick={onClose}>Stay here</button>
        </div>
      </div>
    </div>
  );
}
