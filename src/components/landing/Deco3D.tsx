import CrewArt from '@/components/CrewArt';
import { CREW } from '@/lib/crew';

/** Pure-CSS 3D scenes that fill the empty side of landing-page sections. Decorative only. */

function Cube({ labels, size = 110, className = '' }: { labels: string[]; size?: number; className?: string }) {
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  return (
    <div className={'d3-cube ' + className} style={{ ['--s' as string]: size + 'px' }}>
      {faces.map((f, i) => <span key={f} className={'d3-f d3-' + f}>{labels[i % labels.length]}</span>)}
    </div>
  );
}

/** A box standing on a tilted floor: top face plus two visible sides. */
function Box({ h, label, x, color }: { h: number; label?: string; x: number; color: string }) {
  return (
    <div className="d3-box" style={{ ['--h' as string]: h + 'px', ['--x' as string]: x, ['--bc' as string]: color }}>
      <span className="d3-box-top">{label}</span><span className="d3-box-front" /><span className="d3-box-side" />
    </div>
  );
}

const STEP_COLORS = ['#D98A1C', '#1F6F66', '#8C3557', '#C2502A', '#4C7424', '#34465A'];

export default function Deco3D({ kind }: { kind: 'cube' | 'stairs' | 'orbit' | 'coin' | 'blocks' | 'question' | 'gears' }) {
  return (
    <div className={'d3 d3-' + kind} aria-hidden="true">
      {kind === 'cube' && (<>
        <Cube labels={['step()', 'jump()', 'repeat', 'if', 'def', 'print']} />
        <Cube labels={['▶', '★', '✦', '⚙', '⤴', '↺']} size={46} className="d3-mini a" />
        <Cube labels={['{ }', '( )', '[ ]', '==', '+=', '#']} size={38} className="d3-mini b" />
        <span className="d3-shadow" />
      </>)}

      {kind === 'stairs' && (
        <div className="d3-floor">
          {[3, 4, 5, 6, 7, 8].map((n, i) => <Box key={n} h={14 + i * 16} x={i} label={String(n)} color={STEP_COLORS[i]} />)}
          <span className="d3-hopper" />
        </div>
      )}

      {kind === 'orbit' && (
        <div className="d3-orbit-wrap">
          <span className="d3-planet" />
          <div className="d3-ring">
            <span className="d3-ring-line" />
            {CREW.map((c, i) => (
              <div key={c.id} className="d3-arm" style={{ ['--a' as string]: `${(360 / CREW.length) * i}deg` }}>
                <div className="d3-rider"><div className="d3-face"><CrewArt id={c.id} still label="" /></div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {kind === 'coin' && (
        <div className="d3-coin-wrap">
          <div className="d3-coin">
            {Array.from({ length: 10 }, (_, i) => <span key={i} className="d3-coin-layer" style={{ transform: `translateZ(${-i}px)` }} />)}
            <span className="d3-coin-face front">★<b>XP</b></span>
            <span className="d3-coin-face back">✦<b>+40</b></span>
          </div>
          {[0, 1, 2, 3, 4].map(i => <i key={i} className={'d3-twinkle t' + i}>✦</i>)}
          <span className="d3-shadow" />
        </div>
      )}

      {kind === 'blocks' && (<>
        <Cube labels={['🎒']} size={56} className="d3-bob b1" />
        <Cube labels={['🧑‍🏫']} size={64} className="d3-bob b2" />
        <Cube labels={['🏫']} size={72} className="d3-bob b3" />
        <Cube labels={['★']} size={34} className="d3-bob b4" />
      </>)}

      {kind === 'question' && (<>
        <Cube labels={['?', '!', '?', '?', '!', '?']} size={84} className="d3-q" />
        <span className="d3-shadow" />
      </>)}

      {kind === 'gears' && (
        <div className="d3-gears">
          {[['g1', 110], ['g2', 76], ['g3', 54]].map(([c, s]) => (
            <div key={c} className={'d3-gear ' + c} style={{ ['--g' as string]: s + 'px' }}>
              {Array.from({ length: 6 }, (_, i) => <span key={i} className="d3-gear-layer" style={{ transform: `translateZ(${-i * 2}px)` }} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
