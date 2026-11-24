'use client';
import { useEffect, useState } from 'react';

/* A tiny looping demo: code lines light up and Vinc follows them on a 5×5 board. */
const CODE = ['step()', 'step()', 'turnLeft()', 'repeat 3:', '    step()'];
const CRATES = ['4,3', '2,0', '0,4'];
const SPARK = '1,2';
// Each frame: highlighted line, Vinc's row, column and direction (0 up, 1 right).
const FRAMES = [
  { line: -1, r: 4, c: 0, d: 1 },
  { line: 0, r: 4, c: 1, d: 1 },
  { line: 1, r: 4, c: 2, d: 1 },
  { line: 2, r: 4, c: 2, d: 0 },
  { line: 4, r: 3, c: 2, d: 0, loop: 1 },
  { line: 4, r: 2, c: 2, d: 0, loop: 2 },
  { line: 4, r: 1, c: 2, d: 0, loop: 3 }
];

export default function CodeDemo() {
  const [f, setF] = useState(FRAMES.length - 1);
  const [still, setStill] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setStill(false); setF(0);
    let i = 0, hold = 0;
    const t = setInterval(() => {
      if (i < FRAMES.length - 1) { i++; setF(i); return; }
      if (++hold > 3) { hold = 0; i = 0; setF(0); }
    }, 750);
    return () => clearInterval(t);
  }, []);
  const fr = FRAMES[f] as (typeof FRAMES)[number] & { loop?: number };
  const done = f === FRAMES.length - 1;
  return (
    <div className="lp-demo" aria-label="Animated example: five lines of code move Vinc to a spark">
      <div className="lp-demo-code">
        <div className="lp-demo-bar"><span /><span /><span /> <b>vinc.py</b></div>
        {CODE.map((l, i) => (
          <div key={i} className={'lp-line' + (fr.line === i || (i === 3 && fr.line === 4) ? ' on' : '')}>
            <span className="ln">{i + 1}</span><span className={l.includes('turn') ? 'k-turn' : l.startsWith('repeat') ? 'k-loop' : 'k-step'}>{l}</span>
            {i === 3 && fr.loop ? <span className="lp-iter">{fr.loop}/3</span> : null}
          </div>
        ))}
      </div>
      <div className="lp-demo-board">
        {Array.from({ length: 25 }, (_, k) => {
          const key = Math.floor(k / 5) + ',' + (k % 5);
          return <span key={k} className="lp-cell">{CRATES.includes(key) ? <i className="lp-crate" /> : key === SPARK ? <i className={'lp-spark' + (done ? ' got' : '')}>✦</i> : null}</span>;
        })}
        <div className="lp-bot" style={{ transform: `translate(${fr.c * 100}%, ${fr.r * 100}%)` }}>
          <div className="lp-bot-face" style={{ transform: `rotate(${fr.d === 0 ? -90 : 0}deg)` }}><i /><i /></div>
        </div>
        <div className={'lp-win' + (done && !still ? ' show' : done ? ' show still' : '')}>★★★ Spark collected in 5 blocks!</div>
      </div>
    </div>
  );
}
