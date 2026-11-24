'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import CrewArt from '@/components/CrewArt';
import Ambient from './Ambient';
import { settings, sfx, speak, stopSpeaking } from './fx';
import { playMusic, stopMusic } from './music';
import { crewMember, type CharId } from '@/lib/crew';
import { CHAPTER_STORIES, PROLOGUE, type Actor, type Prop, type Story } from '@/data/stories';

const PROPS: Record<Prop, () => React.JSX.Element> = {
  rocket: () => (<svg viewBox="0 0 100 140"><path d="M50 4 C 74 26 78 70 70 104 H30 C 22 70 26 26 50 4Z" fill="#FFF9EF" stroke="#2B1A10" strokeWidth="4" /><circle cx="50" cy="52" r="13" fill="#4FA9D8" stroke="#2B1A10" strokeWidth="4" /><path d="M30 80 L12 112 L32 104Z M70 80 L88 112 L68 104Z" fill="#C2502A" stroke="#2B1A10" strokeWidth="4" strokeLinejoin="round" /><path className="cs-flame" d="M36 106 Q50 140 64 106Z" fill="#F0A83A" /></svg>),
  part: () => (<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="17" fill="#F0B44C" stroke="#2B1A10" strokeWidth="3" /><path d="M30 4 V14 M30 46 V56 M4 30 H14 M46 30 H56 M12 12 L19 19 M41 41 L48 48 M48 12 L41 19 M12 48 L19 41" stroke="#2B1A10" strokeWidth="6" strokeLinecap="round" /><circle cx="30" cy="30" r="6" fill="#FFF9EF" /></svg>),
  crate: () => (<svg viewBox="0 0 60 60"><rect x="4" y="4" width="52" height="52" rx="4" fill="#A47246" stroke="#6B4325" strokeWidth="5" /><path d="M8 8 L52 52" stroke="#6B4325" strokeWidth="6" /></svg>),
  spark: () => (<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="26" fill="rgba(247,215,116,.35)" /><path d="M30 6 L36 24 L54 30 L36 36 L30 54 L24 36 L6 30 L24 24Z" fill="#F0B44C" stroke="#9A5B0A" strokeWidth="2" /></svg>),
  chest: () => (<svg viewBox="0 0 70 56"><rect x="4" y="22" width="62" height="30" rx="4" fill="#A47246" stroke="#5E3A20" strokeWidth="4" /><path d="M4 26 Q 35 -4 66 26Z" fill="#C2814E" stroke="#5E3A20" strokeWidth="4" /><rect x="30" y="24" width="10" height="12" rx="2" fill="#F0B44C" stroke="#5E3A20" strokeWidth="2" /></svg>),
  map: () => (<svg viewBox="0 0 120 80"><path d="M6 10 L40 4 L80 10 L114 4 V70 L80 76 L40 70 L6 76Z" fill="#FFF3D6" stroke="#8A5A10" strokeWidth="3" /><path d="M16 60 Q 34 30 52 46 T 86 26 T 104 18" fill="none" stroke="#C2502A" strokeWidth="3" strokeDasharray="5 5" /><circle cx="16" cy="60" r="5" fill="#6CB33F" /><circle cx="52" cy="46" r="5" fill="#F0A83A" /><circle cx="86" cy="26" r="5" fill="#2DA8E0" /><path d="M100 12 l8 8 M108 12 l-8 8" stroke="#C2502A" strokeWidth="3" /></svg>)
};
const isProp = (w: string): w is Prop => w in PROPS;

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(text.length); return; }
    setN(0); const t0 = performance.now(); let raf = 0;
    const tick = (t: number) => { const k = Math.ceil((t - t0) / 28); setN(k); if (k < text.length) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return <>{text.slice(0, n)}</>;
}

function ActorView({ a }: { a: Actor }) {
  const size = a.size ?? 120;
  return (
    <div className={'cs-actor en-' + (a.enter ?? 'none')} style={{ left: a.x + '%', bottom: (a.y ?? 6) + 19 + '%', width: size / 9.6 + 'cqw', height: (a.who === 'rocket' ? size * 1.4 : size) / 9.6 + 'cqw', animationDelay: (a.delay ?? 0) + 's' }}>
      <div className={'cs-act act-' + (a.act ?? 'none')} style={{ animationDelay: (a.delay ?? 0) + 0.6 + 's' }}>
        <div className="cs-art" style={a.flip ? { transform: 'scaleX(-1)' } : undefined}>
          {isProp(a.who) ? PROPS[a.who]() : <CrewArt id={a.who as CharId} label="" still />}
        </div>
      </div>
    </div>
  );
}

/** Plays a story: scenes advance by themselves, with captions read aloud and music. */
export default function Cutscene({ story, onClose, resumeTheme }: { story: Story; onClose: () => void; resumeTheme?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const close = useRef(onClose); close.current = onClose;
  const scene = story.scenes[i];
  const next = useCallback(() => { sfx('click'); setI(n => { if (n + 1 >= story.scenes.length) { close.current(); return n; } return n + 1; }); }, [story]);

  useEffect(() => { playMusic(story.music); return () => { stopSpeaking(); if (resumeTheme) playMusic(resumeTheme); else stopMusic(); }; }, [story, resumeTheme]);
  useEffect(() => {
    if (paused) { stopSpeaking(); return; }
    if (settings.voice) speak(scene.caption);
    sfx('pop');
    const t = setTimeout(next, scene.dur * 1000 + (settings.voice ? 600 : 0));
    return () => clearTimeout(t);
  }, [i, paused, scene, next]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); else if (e.key === ' ') { e.preventDefault(); setPaused(p => !p); } else if (e.key === 'ArrowRight') next(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [next]);

  return (
    <div className="cs" role="dialog" aria-modal="true" aria-label={`Story: ${story.title}`}>
      <div className="cs-frame">
        <div key={i} className={'cs-stage gm-theme-' + scene.bg + (scene.fx ? ' fx-' + scene.fx : '') + (paused ? ' paused' : '')}>
          <Ambient theme={scene.bg} layer="bg" />
          <div className={'cs-ground g-' + scene.bg} />
          {scene.actors.map((a, k) => <ActorView key={k} a={a} />)}
          <Ambient theme={scene.bg} layer="fg" />
          {scene.fx === 'storm' && <><span className="cs-rain" /><span className="cs-flash" /></>}
          {scene.fx === 'sparkles' && <span className="cs-sparkles" />}
          <div className="cs-title">{i === 0 && <span>{story.title}</span>}</div>
          <div className="cs-caption">
            {scene.speaker && <b>{crewMember(scene.speaker).name}</b>}
            <p><Typed text={scene.caption} /></p>
          </div>
        </div>
        <div className="cs-bar">
          <div className="cs-dots" aria-hidden="true">{story.scenes.map((s, k) => <span key={k} className={k < i ? 'done' : k === i ? 'now' : ''} style={k === i && !paused ? { animationDuration: s.dur + 's' } : undefined} />)}</div>
          <button type="button" className="cs-btn" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Play' : 'Pause'}>{paused ? '▶' : '❚❚'}</button>
          <button type="button" className="cs-btn" onClick={next} aria-label="Next scene">⏭</button>
          <button type="button" className="cs-btn skip" onClick={() => close.current()}>Skip ✕</button>
        </div>
      </div>
    </div>
  );
}

const seenKey = (id: string) => 'vinc-story-' + id;
export function storySeen(id: string) { try { return localStorage.getItem(seenKey(id)) === '1'; } catch { return true; } }
export function markSeen(id: string) { try { localStorage.setItem(seenKey(id), '1'); } catch { /* ignore */ } }
export const storyFor = (id: string): Story | undefined => (id === 'prologue' ? PROLOGUE : CHAPTER_STORIES[id]);

/** "Story time!" card: a tap starts the cutscene (so sound may play); Skip goes straight on. */
export function StoryGate({ id, onDone, resumeTheme }: { id: string; onDone: () => void; resumeTheme?: string }) {
  const [playing, setPlaying] = useState(false);
  const story = storyFor(id);
  const done = () => { markSeen(id); onDone(); };
  useEffect(() => { if (!story) onDone(); }, [story, onDone]);
  if (!story) return null;
  if (playing) return <Cutscene story={story} onClose={done} resumeTheme={resumeTheme} />;
  return (
    <div className="gm-veil">
      <div className="cs-gate" role="dialog" aria-modal="true" aria-labelledby="cs-gate-t">
        <span className="cs-clap" aria-hidden="true">🎬</span>
        <span className="gm-kicker">Story time</span>
        <h2 id="cs-gate-t">{story.title}</h2>
        <div className="gm-row center">
          <button type="button" className="gm-bigbtn" onClick={() => { sfx('pop'); setPlaying(true); }} autoFocus>▶ Watch the story</button>
          <button type="button" className="gm-bigbtn small skipbtn" onClick={done}>Skip</button>
        </div>
      </div>
    </div>
  );
}

/** A button that plays the prologue trailer in a full-screen player (landing page and map). */
export function TrailerButton({ className, label = '🎬 Watch the story', resumeTheme }: { className?: string; label?: string; resumeTheme?: string }) {
  const [open, setOpen] = useState(false);
  return (<>
    <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
    {open && <Cutscene story={PROLOGUE} onClose={() => { markSeen('prologue'); setOpen(false); }} resumeTheme={resumeTheme} />}
  </>);
}
