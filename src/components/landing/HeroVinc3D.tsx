'use client';
import { useEffect, useRef, useState } from 'react';
import HeroVinc from './HeroVinc';

const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

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

type V3D = { ok: boolean; initHero: (c: HTMLCanvasElement) => void; heroTap?: () => void };

/** The 3D Vinc from the game. Shows the 2D drawing until 3D is ready, and keeps it if WebGL is not available. */
export default function HeroVinc3D() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    load(THREE_SRC).then(() => load('/vinc3d.js')).then(() => {
      const v = (window as unknown as { V3D?: V3D }).V3D;
      if (cancelled || !v?.ok || !canvas.current || canvas.current.dataset.started) return;
      canvas.current.dataset.started = '1';
      v.initHero(canvas.current);
      setReady(true);
    }).catch(() => { /* keep the 2D drawing */ });
    return () => { cancelled = true; };
  }, []);
  const tap = () => (window as unknown as { V3D?: V3D }).V3D?.heroTap?.();
  return (
    <button type="button" className={'lp-vinc-btn' + (ready ? ' is3d' : '')} onClick={tap} aria-label="Vinc the robot. Tap to make Vinc jump.">
      <canvas ref={canvas} className="lp-vinc3d" aria-hidden="true" />
      <HeroVinc />
      {ready && <span className="lp-tap">tap Vinc</span>}
    </button>
  );
}
