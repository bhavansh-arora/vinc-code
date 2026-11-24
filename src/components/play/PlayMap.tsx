'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CrewArt from '@/components/CrewArt';
import GameTop from './GameTop';
import { clearLocal, localProgress, sfx } from './fx';
import { unlockedFrom } from '@/lib/playcore';
import { useMusic } from './music';
import Cutscene, { StoryGate, markSeen, storyFor, storySeen } from './Cutscene';
import type { GameUser, MapChapter, TrackId } from './types';

/* Where the chapter medallions sit on the world, in % of its width and height. */
const SPOTS = [[13, 64], [37, 34], [62, 62], [86, 32]];
const PATH = 'M 4 78 C 10 72, 10 66, 13 64 S 26 40, 37 34 S 52 66, 62 62 S 78 30, 86 32 S 96 22, 99 18';

export default function PlayMap({ chapters, tracks, serverStars, user, initialTrack, grade = null }: {
  chapters: MapChapter[]; tracks: Record<TrackId, { title: string; who: string; blurb: string }>;
  serverStars: Record<string, number> | null; user: GameUser | null; initialTrack: TrackId; grade?: number | null;
}) {
  const [track, setTrack] = useState<TrackId>(initialTrack);
  const [stars, setStars] = useState<Record<string, number>>(serverStars ?? {});
  const [sheet, setSheet] = useState<string | null>(null);
  const [synced, setSynced] = useState('');
  const isStudent = user?.role === 'student';
  const theme = track === 'junior' ? 'meadow' : track === 'adventure' ? 'beach' : 'space';
  useMusic(theme);
  const [gate, setGate] = useState<string | null>(null);
  const [movie, setMovie] = useState<string | null>(null);
  useEffect(() => { if (!storySeen('prologue')) setGate('prologue'); }, []);

  // Guests keep progress in this browser. When a student logs in, progress from this browser is saved to their account.
  useEffect(() => {
    const local = localProgress();
    if (!serverStars) { setStars(Object.fromEntries(Object.entries(local).map(([id, v]) => [id, v.stars]))); return; }
    const ids = Object.keys(local);
    if (!isStudent || !ids.length) return;
    (async () => {
      const merged = { ...serverStars };
      for (const id of ids) {
        try {
          const r = await fetch('/api/play/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, code: local[id].code, passed: true, hints: 3 - local[id].stars }) });
          const j = await r.json(); if (j.passed) merged[id] = Math.max(merged[id] ?? 0, j.best ?? j.stars);
        } catch { /* try again next time */ return; }
      }
      clearLocal(); setStars(merged); setSynced(`${ids.length} level${ids.length === 1 ? '' : 's'} you played on this device ${ids.length === 1 ? 'is' : 'are'} now saved to your account.`);
    })();
  }, [serverStars, isStudent]);

  const list = chapters.filter(c => c.track === track);
  const done = useMemo(() => new Set(Object.keys(stars)), [stars]);
  const staff = !!user && user.role !== 'student' && user.role !== 'parent';
  const { open, chapters: openCh } = useMemo(() => {
    if (staff) return { open: new Set(list.flatMap(c => c.levels.map(l => l.id))), chapters: new Set(list.map(c => c.key)) };
    const usable = track === 'python' && grade ? list.filter(c => (c.grade ?? 0) <= grade) : list;
    return unlockedFrom(usable.map(c => ({ key: c.key, levels: c.levels.map(l => l.id) })), done, track === 'python');
  }, [list, done, staff, track, grade]);
  const nextId = list.flatMap(c => c.levels).find(l => open.has(l.id) && !done.has(l.id))?.id ?? list[0]?.levels[0]?.id;
  const current = list.find(c => c.levels.some(l => l.id === nextId))?.key;
  const sheetCh = list.find(c => c.key === sheet);

  return (
    <div className={'pm pm-' + track}>
      <GameTop user={user}><b>Play</b></GameTop>
      <div className="pm-sky" aria-hidden="true">
        <span className="pm-sun" /><span className="pm-cloud c1" /><span className="pm-cloud c2" /><span className="pm-cloud c3" />
        <svg className="pm-hills" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 40 Q 18 18 36 34 T 70 30 T 100 24 V 100 H 0 Z" className="h1" />
          <path d="M0 58 Q 22 42 44 56 T 82 50 T 100 46 V 100 H 0 Z" className="h2" />
          <path d="M0 78 Q 30 66 58 78 T 100 72 V 100 H 0 Z" className="h3" />
        </svg>
      </div>
      <main className="pm-main">
        <div className="pm-head">
          <div>
            <h1>Where shall Vinc go today?</h1>
            <p>{tracks[track].blurb}</p>
          </div>
          <button type="button" className="pm-story" onClick={() => setMovie('prologue')}>🎬 Watch the story</button>
          <div className="pm-tracks" role="tablist" aria-label="Choose a game">
            {(['junior', 'adventure', 'python'] as TrackId[]).map(t => (
              <button key={t} type="button" role="tab" aria-selected={track === t} className={'pm-track' + (track === t ? ' on' : '')} onClick={() => { sfx('click'); setTrack(t); setSheet(null); }}>
                <b>{tracks[t].title}</b><span>{tracks[t].who}</span>
              </button>
            ))}
          </div>
        </div>
        {staff && <p className="pm-note">Teacher view: every level is open, and each level has a 👁 button that shows the answer.</p>}
        {!user && <p className="pm-note">You are playing as a guest, so your stars are saved on this device. <Link href="/login">Log in</Link> to keep them in your account.</p>}
        {synced && <p className="pm-note ok">{synced}</p>}

        <div className="pm-world">
          <svg className="pm-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={PATH} /></svg>
          {list.map((c, i) => {
            const n = c.levels.filter(l => done.has(l.id)).length, s = c.levels.reduce((t, l) => t + (stars[l.id] ?? 0), 0);
            const locked = !openCh.has(c.key), isCur = c.key === current;
            const prev = list[i - 1];
            return (
              <button key={c.key} type="button" className={'pm-node' + (locked ? ' locked' : '') + (isCur ? ' current' : '') + (n === c.levels.length ? ' complete' : '')}
                style={{ left: SPOTS[i][0] + '%', top: SPOTS[i][1] + '%', animationDelay: i * 120 + 'ms' }}
                onClick={() => { sfx(locked ? 'bump' : 'pop'); if (locked) return; setSheet(c.key); if (!storySeen(c.key)) setMovie(c.key); }}
                aria-label={`${c.title}: ${c.idea}. ${locked ? (c.grade ? `For Class ${c.grade} and up.` : `Locked. Finish ${prev?.title} to unlock.`) : `${n} of ${c.levels.length} levels done.`}`}>
                <span className="pm-ribbon">{c.title}</span>
                <span className="pm-medal"><CrewArt id={c.tutor} label="" still={locked} />{locked && <span className="pm-lock">🔒</span>}</span>
                <span className="pm-count">{n}/{c.levels.length}</span>
                <span className="pm-stars">★ {s}/{c.levels.length * 3}</span>
                {isCur && !locked && <span className="pm-here">Play ▶</span>}
                {locked && (c.grade ? <span className="pm-unlock">For Class {c.grade} and up</span> : prev && <span className="pm-unlock">Finish {prev.title} to unlock</span>)}
              </button>
            );
          })}
        </div>
        {nextId && <div className="pm-continue"><Link className="gm-bigbtn" href={`/play/${nextId}`} onClick={() => sfx('pop')}>▶ {done.size ? 'Continue' : 'Start playing'}</Link></div>}
      </main>

      {sheetCh && (
        <div className="pm-sheet-back" onClick={e => { if (e.target === e.currentTarget) setSheet(null); }}>
          <div className={'pm-sheet theme-' + sheetCh.theme} role="dialog" aria-modal="true" aria-labelledby="pm-sheet-title">
            <div className="pm-sheet-head">
              <CrewArt id={sheetCh.tutor} className="pm-sheet-tutor" label="" />
              <div><span className="pm-kicker">{tracks[track].title} · {sheetCh.idea}</span><h2 id="pm-sheet-title">{sheetCh.title}</h2></div>
              {storyFor(sheetCh.key) && <button type="button" className="gm-round small" onClick={() => setMovie(sheetCh.key)} aria-label="Watch this world's story">🎬</button>}
              <button type="button" className="gm-x" onClick={() => setSheet(null)} aria-label="Close">✕</button>
            </div>
            <ol className="pm-levels">
              {sheetCh.levels.map((l, i) => {
                const st = stars[l.id], isOpen = open.has(l.id);
                return (
                  <li key={l.id} style={{ animationDelay: i * 50 + 'ms' }}>
                    {isOpen ? (
                      <Link href={`/play/${l.id}`} className={'pm-stone' + (st ? ' done' : '') + (l.id === nextId ? ' next' : '') + (l.boss ? ' boss' : '') + (l.debug ? ' bug' : '')} onClick={() => sfx('pop')} aria-label={`Level ${l.n}: ${l.title}${st ? `, ${st} stars` : ''}`}>
                        <b>{l.boss ? '👑' : l.debug ? '🐞' : l.n}</b>
                      </Link>
                    ) : <span className="pm-stone locked" aria-label={`Level ${l.n}: locked`}><b>🔒</b></span>}
                    <span className="pm-stone-stars" aria-hidden="true">{[1, 2, 3].map(k => <i key={k} className={st && k <= st ? 'on' : ''}>★</i>)}</span>
                    <span className="pm-stone-name">{l.title}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}
      {gate && <StoryGate id={gate} resumeTheme={theme} onDone={() => setGate(null)} />}
      {movie && storyFor(movie) && <Cutscene story={storyFor(movie)!} resumeTheme={theme} onClose={() => { markSeen(movie); setMovie(null); }} />}
    </div>
  );
}
