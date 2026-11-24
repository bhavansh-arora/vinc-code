/** Vinc, the VINC Code robot (2D artwork). */
export default function VincArt({ className, label = 'Vinc the robot' }: { className?: string; label?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 260" role="img" aria-label={label}>
      <ellipse className="f-shadow" cx="110" cy="248" rx="66" ry="8" />
      <line x1="110" y1="46" x2="110" y2="22" className="s-ink" strokeWidth="5" strokeLinecap="round" />
      <circle cx="110" cy="16" r="11" className="f-amber s-ink" strokeWidth="4" />
      <path d="M160 170 Q188 160 192 128" className="s-olive" fill="none" strokeWidth="12" strokeLinecap="round" />
      <circle cx="193" cy="121" r="11" className="f-olive s-ink" strokeWidth="4" />
      <path d="M60 172 Q34 184 32 208" className="s-rust" fill="none" strokeWidth="12" strokeLinecap="round" />
      <circle cx="31" cy="213" r="11" className="f-rust s-ink" strokeWidth="4" />
      <circle cx="82" cy="228" r="18" className="f-ink" /><circle cx="82" cy="228" r="7" className="f-amber" />
      <circle cx="138" cy="228" r="18" className="f-ink" /><circle cx="138" cy="228" r="7" className="f-amber" />
      <rect x="58" y="150" width="104" height="72" rx="18" className="f-teal s-ink" strokeWidth="5" />
      <circle cx="110" cy="186" r="16" className="f-card s-ink" strokeWidth="4" />
      <path d="M102 180 L110 194 L118 180" className="s-amberink" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="98" y="136" width="24" height="16" rx="4" className="f-ink2" />
      <rect x="40" y="44" width="140" height="98" rx="30" className="f-amber s-ink" strokeWidth="5" />
      <circle cx="38" cy="93" r="9" className="f-rust s-ink" strokeWidth="4" />
      <circle cx="182" cy="93" r="9" className="f-plum s-ink" strokeWidth="4" />
      <rect x="58" y="60" width="104" height="66" rx="20" className="f-screen" />
      <ellipse cx="90" cy="92" rx="10" ry="12" className="f-eye" />
      <ellipse cx="130" cy="92" rx="10" ry="12" className="f-eye" />
      <circle cx="90" cy="93" r="5" className="f-screen" /><circle cx="130" cy="93" r="5" className="f-screen" />
      <path d="M98 110 Q110 119 122 110" className="s-eye" fill="none" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
