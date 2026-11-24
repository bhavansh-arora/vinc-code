import VincArt from '@/components/VincArt';
import { crewMember, type CharId } from '@/lib/crew';

const INK = '#2B1A10', CREAM = '#FFF7EA', SCREEN = '#1E2F2B';
/** Soft light and shade that give the flat drawings a rounded, 3D look. */
const Shine = ({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) => <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" opacity=".32" />;

function Pip() {
  return (<>
    <g className="cr-wing"><ellipse cx="38" cy="44" rx="20" ry="11" fill="#9FD8CF" opacity=".75" stroke={INK} strokeWidth="2.5" transform="rotate(-25 38 44)" />
      <ellipse cx="82" cy="44" rx="20" ry="11" fill="#9FD8CF" opacity=".75" stroke={INK} strokeWidth="2.5" transform="rotate(25 82 44)" /></g>
    <circle className="cr-glow" cx="60" cy="88" r="22" fill="#F7D774" opacity=".55" />
    <ellipse cx="60" cy="86" rx="15" ry="14" fill="#E8B030" stroke={INK} strokeWidth="3" />
    <ellipse cx="55" cy="81" rx="5" ry="3" fill="#FFF3C4" />
    <circle cx="60" cy="56" r="25" fill="#D98A1C" stroke={INK} strokeWidth="3.5" />
    <Shine cx={50} cy={44} rx={9} ry={5} />
    <rect x="42" y="47" width="36" height="22" rx="10" fill={SCREEN} />
    <g className="cr-eyes"><circle cx="52" cy="58" r="5" fill={CREAM} /><circle cx="68" cy="58" r="5" fill={CREAM} /></g>
    <path d="M54 30 Q50 18 42 16" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="41" cy="16" r="4" fill="#E8B030" stroke={INK} strokeWidth="2" />
    <path d="M66 30 Q70 18 78 16" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" /><circle cx="79" cy="16" r="4" fill="#E8B030" stroke={INK} strokeWidth="2" />
  </>);
}

function Loopa() {
  return (<>
    <path d="M18 98 Q20 80 40 80 L92 80 Q104 80 106 96 Q106 104 96 104 L26 104 Q16 104 18 98 Z" fill="#4C7424" stroke={INK} strokeWidth="3.5" />
    <Shine cx={40} cy={86} rx={12} ry={3} />
    <path d="M88 80 L94 52" stroke={INK} strokeWidth="3.5" strokeLinecap="round" /><path d="M98 82 L108 56" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    <g className="cr-eyes"><circle cx="94" cy="50" r="7" fill={CREAM} stroke={INK} strokeWidth="2.5" /><circle cx="95" cy="50" r="3" fill={INK} />
      <circle cx="108" cy="54" r="7" fill={CREAM} stroke={INK} strokeWidth="2.5" /><circle cx="109" cy="54" r="3" fill={INK} /></g>
    <path d="M90 94 Q96 98 102 94" stroke={CREAM} strokeWidth="3" fill="none" strokeLinecap="round" />
    <g className="cr-spin" style={{ transformOrigin: '52px 60px' }}>
      <circle cx="52" cy="60" r="32" fill="#1F6F66" stroke={INK} strokeWidth="3.5" />
      <path d="M52 60 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 0 1 8 -8 a12 12 0 0 1 12 12 a16 16 0 0 1 -16 16 a20 20 0 0 1 -20 -20 a24 24 0 0 1 24 -24" fill="none" stroke="#F0B44C" strokeWidth="4" strokeLinecap="round" />
    </g>
    <Shine cx={40} cy={40} rx={10} ry={5} />
    <circle cx="34" cy="106" r="7" fill={INK} /><circle cx="34" cy="106" r="2.5" fill="#D98A1C" /><circle cx="86" cy="106" r="7" fill={INK} /><circle cx="86" cy="106" r="2.5" fill="#D98A1C" />
  </>);
}

function Hoot() {
  return (<>
    <path d="M30 30 L36 12 L48 26 Z M90 30 L84 12 L72 26 Z" fill="#8C3557" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M24 60 Q24 24 60 24 Q96 24 96 60 L96 86 Q96 108 60 108 Q24 108 24 86 Z" fill="#8C3557" stroke={INK} strokeWidth="3.5" />
    <Shine cx={42} cy={36} rx={10} ry={5} />
    <path d="M42 78 Q60 70 78 78 L78 94 Q60 104 42 94 Z" fill="#E7C9A4" stroke={INK} strokeWidth="2.5" />
    <path d="M50 84 h6 v6 h8 M66 82 v10" stroke="#9A5B0A" strokeWidth="2" fill="none" />
    <circle cx="44" cy="54" r="15" fill={SCREEN} stroke={INK} strokeWidth="3" /><circle cx="76" cy="54" r="15" fill={SCREEN} stroke={INK} strokeWidth="3" />
    <g className="cr-eyes"><circle cx="44" cy="54" r="9" fill="#F0B44C" /><circle cx="76" cy="54" r="9" fill="#F0B44C" />
      <circle cx="44" cy="54" r="4" fill={INK} /><circle cx="76" cy="54" r="4" fill={INK} /><circle cx="46" cy="51" r="2" fill={CREAM} /><circle cx="78" cy="51" r="2" fill={CREAM} /></g>
    <path d="M55 66 L60 74 L65 66 Z" fill="#D98A1C" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M24 70 Q12 82 18 96" stroke={INK} strokeWidth="3" fill="#6E2843" />
    <path d="M96 70 Q108 82 102 96" stroke={INK} strokeWidth="3" fill="#6E2843" />
    <path d="M48 108 v6 M44 114 h8 M72 108 v6 M68 114 h8" stroke="#D98A1C" strokeWidth="3" strokeLinecap="round" />
  </>);
}

function Pocket() {
  return (<>
    <path d="M44 34 L36 6 Q46 8 50 30 Z M68 30 L76 6 Q86 10 74 34 Z" fill="#C2502A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <path d="M96 96 Q118 98 112 112" stroke={INK} strokeWidth="9" strokeLinecap="round" fill="none" /><path d="M96 96 Q118 98 112 112" stroke="#C2502A" strokeWidth="4" strokeLinecap="round" fill="none" />
    <ellipse cx="60" cy="82" rx="32" ry="28" fill="#C2502A" stroke={INK} strokeWidth="3.5" />
    <circle cx="60" cy="44" r="22" fill="#C2502A" stroke={INK} strokeWidth="3.5" />
    <Shine cx={50} cy={34} rx={8} ry={4} />
    <rect x="45" y="36" width="30" height="18" rx="8" fill={SCREEN} />
    <g className="cr-eyes"><circle cx="53" cy="45" r="4" fill={CREAM} /><circle cx="67" cy="45" r="4" fill={CREAM} /></g>
    <g className="cr-peek"><rect x="46" y="70" width="28" height="20" rx="3" fill="#E8B030" stroke={INK} strokeWidth="2.5" />
      <text x="60" y="84" textAnchor="middle" fontFamily="monospace" fontWeight="700" fontSize="11" fill={INK}>x=3</text></g>
    <path d="M38 84 Q60 98 82 84 L80 100 Q60 110 40 100 Z" fill="#E7C9A4" stroke={INK} strokeWidth="3" />
    <ellipse cx="44" cy="110" rx="12" ry="5" fill={INK} /><ellipse cx="76" cy="110" rx="12" ry="5" fill={INK} />
  </>);
}

function Tadka() {
  return (<>
    <g className="cr-steam" stroke="#9FB8B4" strokeWidth="3" fill="none" strokeLinecap="round"><path d="M96 34 q-5 -6 0 -12 q5 -6 0 -12" /><path d="M106 40 q-5 -6 0 -12" /></g>
    <path d="M38 30 Q30 10 46 12 Q52 2 62 8 Q74 2 80 12 Q94 10 84 30 Z" fill={CREAM} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    <rect x="38" y="28" width="46" height="8" rx="2" fill={CREAM} stroke={INK} strokeWidth="3" />
    <rect x="34" y="36" width="54" height="40" rx="12" fill="#4C7424" stroke={INK} strokeWidth="3.5" />
    <Shine cx={46} cy={42} rx={8} ry={3} />
    <rect x="42" y="42" width="38" height="22" rx="8" fill={SCREEN} />
    <g className="cr-eyes"><circle cx="53" cy="51" r="4" fill={CREAM} /><circle cx="69" cy="51" r="4" fill={CREAM} /></g>
    <path d="M48 62 Q54 58 61 62 Q68 58 74 62" stroke="#F0B44C" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="38" y="76" width="46" height="30" rx="8" fill="#1F6F66" stroke={INK} strokeWidth="3.5" />
    <path d="M46 80 L76 80 L72 104 L50 104 Z" fill={CREAM} stroke={INK} strokeWidth="2" />
    <g className="cr-stir" style={{ transformOrigin: '92px 86px' }}><path d="M84 86 L104 64" stroke={INK} strokeWidth="4" strokeLinecap="round" /><ellipse cx="106" cy="60" rx="6" ry="8" fill="#D98A1C" stroke={INK} strokeWidth="2.5" transform="rotate(40 106 60)" /></g>
    <circle cx="50" cy="110" r="6" fill={INK} /><circle cx="72" cy="110" r="6" fill={INK} />
  </>);
}

function Nova() {
  return (<>
    <g className="cr-prop"><ellipse cx="60" cy="18" rx="34" ry="5" fill="#9FD8CF" opacity=".6" stroke={INK} strokeWidth="2" /></g>
    <path d="M60 22 v10" stroke={INK} strokeWidth="4" />
    <circle cx="60" cy="62" r="32" fill="#34465A" stroke={INK} strokeWidth="3.5" />
    <Shine cx={46} cy={44} rx={10} ry={5} />
    <rect x="38" y="46" width="44" height="30" rx="10" fill={SCREEN} />
    <g className="cr-eyes"><rect x="46" y="54" width="8" height="10" rx="3" fill="#7FE0D0" /><rect x="66" y="54" width="8" height="10" rx="3" fill="#7FE0D0" /></g>
    <g className="cr-bars"><rect x="48" y="69" width="4" height="4" fill="#F0B44C" /><rect x="54" y="67" width="4" height="6" fill="#F0B44C" /><rect x="60" y="68" width="4" height="5" fill="#F0B44C" /><rect x="66" y="66" width="4" height="7" fill="#F0B44C" /></g>
    <circle cx="28" cy="62" r="6" fill="#D98A1C" stroke={INK} strokeWidth="2.5" /><circle cx="92" cy="62" r="6" fill="#D98A1C" stroke={INK} strokeWidth="2.5" />
    <path className="cr-glow" d="M44 96 L60 112 L76 96" fill="#7FE0D0" opacity=".35" />
  </>);
}

function Glitch() {
  return (<>
    <path d="M44 30 Q36 14 26 14 M76 30 Q84 14 94 14" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M30 66 L14 58 M30 80 L12 84 M90 66 L106 58 M90 80 L108 84" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    <ellipse cx="60" cy="72" rx="34" ry="38" fill="#C2502A" stroke={INK} strokeWidth="3.5" />
    <Shine cx={46} cy={50} rx={10} ry={6} />
    <path d="M60 36 V110" stroke={INK} strokeWidth="3" />
    <circle cx="46" cy="76" r="6" fill={INK} /><circle cx="74" cy="90" r="6" fill={INK} /><circle cx="72" cy="66" r="4" fill={INK} />
    <ellipse cx="60" cy="36" rx="22" ry="14" fill="#5E2818" stroke={INK} strokeWidth="3" />
    <g className="cr-eyes"><circle cx="51" cy="34" r="6" fill={CREAM} /><circle cx="69" cy="34" r="6" fill={CREAM} /><circle cx="52" cy="35" r="2.6" fill={INK} /><circle cx="70" cy="35" r="2.6" fill={INK} /></g>
    <path d="M52 44 Q60 49 68 44" stroke={CREAM} strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </>);
}

const ART: Record<Exclude<CharId, 'vinc'>, () => React.JSX.Element> = { pip: Pip, loopa: Loopa, hoot: Hoot, pocket: Pocket, tadka: Tadka, nova: Nova, glitch: Glitch };

/** One of Vinc's crew. `still` turns the idle animation off. */
export default function CrewArt({ id, className, still, label }: { id: CharId; className?: string; still?: boolean; label?: string }) {
  const name = label ?? crewMember(id).name;
  if (id === 'vinc') return <span className={'crew-art cr-' + id + (still ? ' still' : '') + (className ? ' ' + className : '')}><VincArt label={name} /></span>;
  const Art = ART[id];
  return (
    <span className={'crew-art cr-' + id + (still ? ' still' : '') + (className ? ' ' + className : '')}>
      <svg viewBox="0 0 120 120" role={name ? 'img' : undefined} aria-label={name || undefined} aria-hidden={name ? undefined : true}>
        <ellipse cx="60" cy="116" rx="30" ry="4" fill="rgba(43,26,16,.16)" className="cr-shadow" />
        <g className="cr-body"><Art /></g>
      </svg>
    </span>
  );
}
