/**
 * Moving scenery for each world, drawn with CSS and SVG. `bg` sits behind the 3D board (sky, horizon, birds…),
 * `fg` floats in front of it (petals, bubbles, fireflies…). Purely decorative and still for reduced motion.
 */
const N = (n: number) => Array.from({ length: n }, (_, i) => i);
const pos = (i: number, a: number, b: number) => ((i * a + b) % 100);

function Birds({ kind = 'bird' }: { kind?: 'bird' | 'gull' }) {
  return <>{N(3).map(i => (
    <svg key={i} className={'amb-bird ' + kind} viewBox="0 0 40 16" style={{ top: 8 + i * 7 + '%', animationDelay: -i * 7 + 's', animationDuration: 22 + i * 5 + 's' }}>
      <path className="amb-wing" d="M2 10 Q 10 0 20 9 Q 30 0 38 10" fill="none" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ))}</>;
}
function Clouds({ n = 3 }: { n?: number }) {
  return <>{N(n).map(i => <span key={i} className="amb-cloud" style={{ top: 4 + i * 9 + '%', animationDelay: -i * 23 + 's', animationDuration: 70 + i * 25 + 's', transform: `scale(${1 - i * 0.18})` }} />)}</>;
}
function Horizon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    hills: 'M0 70 Q 15 40 30 62 T 60 55 T 100 50 V100 H0Z',
    mesas: 'M0 75 H12 V48 H26 V75 H40 V58 H48 V40 H66 V75 H78 V52 H90 V75 H100 V100 H0Z',
    city: 'M0 80 V60 H6 V50 H12 V64 H20 V44 H24 V38 H28 V44 H32 V66 H40 V54 H48 V70 H56 V46 H62 V40 H66 V46 H70 V72 H80 V56 H88 V62 H100 V100 H0Z',
    palms: 'M0 78 Q 25 70 50 76 T 100 72 V100 H0Z',
    domes: 'M0 80 V64 H8 Q 13 48 18 64 H26 V58 H34 V80 H40 V60 Q 48 40 56 60 V80 H64 V66 H70 Q 76 52 82 66 H90 V58 H100 V100 H0Z'
  };
  return <svg className={'amb-horizon h-' + kind} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={paths[kind] ?? paths.hills} /></svg>;
}

function Background({ theme }: { theme: string }) {
  switch (theme) {
    case 'meadow': case 'orchard': case 'hills': case 'river':
      return <><span className="amb-sun" /><Clouds /><Horizon kind="hills" /><Birds /></>;
    case 'beach': case 'lagoon':
      return <><span className="amb-sun" /><Clouds n={2} /><Horizon kind="palms" /><Birds kind="gull" /><span className="amb-boat" /></>;
    case 'jungle':
      return <><Clouds n={2} /><Horizon kind="hills" />{N(7).map(i => <span key={i} className="amb-vine" style={{ left: pos(i, 15, 2) + '%', height: 90 + (i * 37) % 120 + 'px', animationDelay: -i * 0.7 + 's' }} />)}<Birds /></>;
    case 'factory':
      return <><Horizon kind="city" />{[0, 1, 2].map(i => <span key={i} className={'amb-gear g' + i} />)}{N(4).map(i => <span key={i} className="amb-steam" style={{ left: 12 + i * 24 + '%', animationDelay: -i * 1.3 + 's' }} />)}</>;
    case 'canyon':
      return <><span className="amb-sun hot" /><Clouds n={1} /><Horizon kind="mesas" /><svg className="amb-hawk" viewBox="0 0 40 16"><path className="amb-wing" d="M2 10 Q 10 0 20 9 Q 30 0 38 10" fill="none" strokeWidth="3" strokeLinecap="round" /></svg><span className="amb-tumble" /></>;
    case 'bazaar':
      return <><span className="amb-sun" /><Clouds n={2} /><Horizon kind="domes" />
        <svg className="amb-bunting" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 1 Q 50 9 100 1" fill="none" stroke="#7A4A20" strokeWidth=".4" />
          {N(14).map(i => { const x = 3 + i * 7, y = Math.round((1 + Math.sin((x / 100) * Math.PI) * 7.6) * 100) / 100; return <path key={i} className="amb-flag" d={`M${x - 2.4} ${y} L${x + 2.4} ${y} L${x} ${y + 5}Z`} fill={['#E9558E', '#F0A83A', '#22A39A', '#8F6BE8', '#6CB33F'][i % 5]} />; })}</svg>
        {N(2).map(i => <span key={i} className={'amb-kite k' + i} />)}</>;
    case 'kitchen':
      return <><span className="amb-tiles" />{N(3).map(i => <span key={i} className="amb-lamp" style={{ left: 18 + i * 32 + '%', animationDelay: -i * 0.8 + 's' }} />)}</>;
    case 'space':
      return <><span className="amb-stars" /><span className="amb-stars s2" /><span className="amb-planet" /><span className="amb-moon" />{N(2).map(i => <span key={i} className="amb-comet" style={{ top: 8 + i * 20 + '%', animationDelay: i * 6 + 's' }} />)}</>;
    default:
      return <><Clouds /><Birds /></>;
  }
}

function Foreground({ theme }: { theme: string }) {
  const kind = ({ meadow: 'leaf', hills: 'leaf', orchard: 'blossom', river: 'bubble', lagoon: 'bubble', beach: 'glint', jungle: 'firefly', factory: 'ember', canyon: 'dust', bazaar: 'marigold', kitchen: 'steam', space: 'dust' } as Record<string, string>)[theme] ?? 'leaf';
  const n = kind === 'firefly' ? 14 : kind === 'steam' ? 6 : 12;
  return <>
    {N(n).map(i => <span key={i} className={'amb-p p-' + kind} style={{ left: pos(i, 37, 5) + '%', top: kind === 'firefly' || kind === 'dust' || kind === 'glint' ? pos(i, 53, 11) + '%' : undefined, animationDelay: -((i * 1.7) % 9) + 's', animationDuration: 7 + (i % 5) * 1.6 + 's' }} />)}
    {(theme === 'meadow' || theme === 'orchard' || theme === 'hills') && N(2).map(i => (
      <svg key={'b' + i} className="amb-butterfly" viewBox="0 0 20 16" style={{ animationDelay: -i * 9 + 's', top: 30 + i * 25 + '%' }}>
        <g className="amb-bwing"><ellipse cx="6" cy="6" rx="5" ry="5" fill={i ? '#8F6BE8' : '#F0A83A'} /><ellipse cx="14" cy="6" rx="5" ry="5" fill={i ? '#8F6BE8' : '#F0A83A'} /><ellipse cx="7" cy="12" rx="3" ry="3" fill={i ? '#E9558E' : '#E9558E'} /><ellipse cx="13" cy="12" rx="3" ry="3" fill="#E9558E" /></g>
        <rect x="9.2" y="3" width="1.6" height="11" rx=".8" fill="#2B1A10" />
      </svg>
    ))}
  </>;
}

export default function Ambient({ theme, layer }: { theme: string; layer: 'bg' | 'fg' }) {
  return <div className={'amb amb-' + layer + ' amb-t-' + theme} aria-hidden="true">{layer === 'bg' ? <Background theme={theme} /> : <Foreground theme={theme} />}</div>;
}
