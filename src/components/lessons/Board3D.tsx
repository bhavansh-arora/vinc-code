'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TraceStep } from '@/lib/blocks';

const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
const TILES: Record<string, string> = { r: 'red', g: 'green', b: 'blue' };
type Pos = { r: number; c: number; d: number };
type Engine = {
  build(P: { rows: number; cols: number; crates: Record<string, boolean>; sparks: string[]; tiles: Record<string, string>; theme?: string }): void;
  pick?(x: number, y: number): { r: number; c: number } | null; mark?(keys: string[]): void; onTile?: ((t: { r: number; c: number } | null) => void) | null;
  place(p: Pos, ms: number, jump?: boolean): void; reset(): void; collect(k: string): void;
  bump(p: Pos, nr: number, nc: number, off: boolean): void; win(): void; dispose?(): void;
};
type V3D = { ok: boolean; initBoard(c: HTMLCanvasElement): Engine };

function load(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded) return resolve();
    const s = existing ?? document.createElement('script');
    s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve(); });
    s.addEventListener('error', () => reject(new Error('Could not load ' + src)));
    if (!existing) { s.src = src; s.async = true; document.head.appendChild(s); }
  });
}

export function startOf(map: string[]): Pos {
  for (let r = 0; r < map.length; r++) for (let c = 0; c < map[r].length; c++) { const i = '^>v<'.indexOf(map[r][c]); if (i >= 0) return { r, c, d: i }; }
  return { r: 0, c: 0, d: 1 };
}

const ARROW = ['▲', '▶', '▼', '◀'];
const TILE_CLASS: Record<string, string> = { r: 'red', g: 'green', b: 'blue' };

/** The flat board, used while 3D loads and on devices without WebGL. */
function Board2D({ map, trace, frame }: { map: string[]; trace: TraceStep[]; frame: number }) {
  const start = useMemo(() => startOf(map), [map]);
  const cur = frame >= 0 && trace[frame] ? trace[frame] : { ...start, a: 'start' as const };
  const visited = useMemo(() => { const s = new Set<string>(); for (let i = 0; i <= frame && i < trace.length; i++) s.add(trace[i].r + ',' + trace[i].c); return s; }, [trace, frame]);
  return (
    <div className="ls-board" style={{ gridTemplateColumns: `repeat(${map[0].length}, minmax(0, 40px))` }} role="img" aria-label="Vinc's board">
      {map.map((row, r) => row.split('').map((ch, c) => {
        const here = cur.r === r && cur.c === c, k = r + ',' + c;
        const spark = ch === '*' && !visited.has(k);
        return (
          <span key={k} className={'ls-cell' + (ch === '#' ? ' crate' : '') + (TILE_CLASS[ch] ? ' t-' + TILE_CLASS[ch] : '') + (here ? ' vinc' + (cur.a === 'bump' ? ' bump' : '') : '')}>
            {here ? ARROW[cur.d] : spark ? '✦' : ''}
          </span>
        );
      }))}
    </div>
  );
}

/**
 * Vinc's board in 3D (the same Three.js engine as the game). `frame` is how far through `trace` the animation is;
 * -1 shows the start. Moving `frame` forward animates each step; `won` plays the victory dance at the end.
 */
export default function Board3D({ map, trace, frame, won, stepMs, theme, onTile, marks, className, hint = true, onReady }: {
  map: string[]; trace: TraceStep[]; frame: number; won: boolean; stepMs: number;
  /** A themed world around the board (the /play game). */
  theme?: string; onTile?: (t: { r: number; c: number } | null) => void; marks?: string[]; className?: string; hint?: boolean; onReady?: (is3d: boolean) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const eng = useRef<Engine | null>(null);
  const shown = useRef(-1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    load(THREE_SRC).then(() => load('/vinc3d.js')).then(() => {
      const v = (window as unknown as { V3D?: V3D }).V3D;
      if (cancelled || !v?.ok || !canvas.current) return;
      try { eng.current = v.initBoard(canvas.current); setReady(true); onReady?.(true); } catch { onReady?.(false); }
    }).catch(() => { onReady?.(false); });
    return () => { cancelled = true; eng.current?.dispose?.(); eng.current = null; };
  }, []);

  // A new board: rebuild the scene and put Vinc at the start.
  useEffect(() => {
    const B = eng.current; if (!ready || !B) return;
    const crates: Record<string, boolean> = {}, sparks: string[] = [], tiles: Record<string, string> = {};
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      const k = r + ',' + c;
      if (ch === '#') crates[k] = true; else if (ch === '*') sparks.push(k); else if (TILES[ch]) tiles[k] = TILES[ch];
    }));
    B.build({ rows: map.length, cols: map[0].length, crates, sparks, tiles, theme });
    B.reset(); B.place(startOf(map), 0); shown.current = -1;
  }, [ready, map, theme]);

  useEffect(() => { const B = eng.current; if (ready && B) B.onTile = onTile ?? null; }, [ready, onTile]);
  useEffect(() => { const B = eng.current; if (ready && B?.mark) B.mark(marks ?? []); }, [ready, marks, map]);

  // Play the trace up to `frame`.
  useEffect(() => {
    const B = eng.current; if (!ready || !B) return;
    if (frame < shown.current || frame < 0) { B.reset(); B.place(startOf(map), 0); shown.current = -1; }
    for (let i = shown.current + 1; i <= frame && i < trace.length; i++) {
      const s = trace[i], prevGot = i ? trace[i - 1].got : 0, ms = i === frame ? stepMs : 0;
      const pos = { r: s.r, c: s.c, d: s.d };
      if (s.a === 'bump') {
        const hop = s.hop ?? 1, nr = s.r + DR[s.d] * hop, nc = s.c + DC[s.d] * hop;
        B.place(pos, 0);
        B.bump(pos, nr, nc, nr < 0 || nr >= map.length || nc < 0 || nc >= map[0].length);
      } else {
        B.place(pos, ms, s.a === 'jump');
        if (s.got > prevGot) B.collect(s.r + ',' + s.c);
      }
      if (won && i === trace.length - 1) setTimeout(() => eng.current?.win(), ms + 120);
    }
    shown.current = Math.max(shown.current, Math.min(frame, trace.length - 1));
  }, [ready, frame, trace, map, won, stepMs]);

  return (
    <div className={'b3d' + (ready ? ' is3d' : '') + (className ? ' ' + className : '')}>
      <canvas ref={canvas} className="b3d-canvas" aria-label="3D board. Drag sideways to turn it." />
      {!ready && <Board2D map={map} trace={trace} frame={frame} />}
      {ready && hint && <span className="b3d-hint">drag to turn · double-click to reset</span>}
    </div>
  );
}
