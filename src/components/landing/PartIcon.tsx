/** The part each class wins (same artwork as the game). */
export default function PartIcon({ id }: { id: string }) {
  const p = { viewBox: '0 0 64 64', 'aria-hidden': true, className: 'lp-part-icon' } as const;
  switch (id) {
    case 'spring': return <svg {...p}><path d="M18 8 L46 16 L18 24 L46 32 L18 40 L46 48" className="s-olive" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><rect x="12" y="50" width="40" height="8" rx="3" className="f-ink" /></svg>;
    case 'antenna': return <svg {...p}><line x1="32" y1="58" x2="32" y2="26" className="s-ink" strokeWidth="4" strokeLinecap="round" /><circle cx="32" cy="18" r="12" className="f-plum s-ink" strokeWidth="3" /><circle cx="32" cy="18" r="4" className="f-eye" /><path d="M12 10 Q6 18 12 26 M52 10 Q58 18 52 26" className="s-plum" fill="none" strokeWidth="3" strokeLinecap="round" /></svg>;
    case 'chip': return <svg {...p}><rect x="14" y="14" width="36" height="36" rx="6" className="f-ink" /><rect x="22" y="22" width="20" height="20" rx="3" className="f-amber" /><path d="M22 6 V14 M32 6 V14 M42 6 V14 M22 50 V58 M32 50 V58 M42 50 V58 M6 22 H14 M6 32 H14 M6 42 H14 M50 22 H58 M50 32 H58 M50 42 H58" className="s-ink" strokeWidth="3" strokeLinecap="round" /></svg>;
    case 'gear': return <svg {...p}><path d="M32 6 V14 M32 50 V58 M6 32 H14 M50 32 H58 M13 13 L19 19 M45 45 L51 51 M51 13 L45 19 M13 51 L19 45" className="s-rust" strokeWidth="7" strokeLinecap="round" /><circle cx="32" cy="32" r="16" className="f-rust s-ink" strokeWidth="3" /><circle cx="32" cy="32" r="6" className="f-card" /></svg>;
    case 'brain': return <svg {...p}><path d="M32 8 C18 8 10 18 10 28 C10 36 16 40 16 46 L48 46 C48 40 54 36 54 28 C54 18 46 8 32 8 Z" className="f-teal s-ink" strokeWidth="3" /><path d="M22 24 L30 30 L22 36 M34 36 H42" className="s-eye" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><rect x="20" y="48" width="24" height="8" rx="3" className="f-ink" /></svg>;
    default: return <svg {...p}><path d="M26 46 Q32 62 38 46 Z" className="f-amber" /><path d="M22 34 L11 47 L22 46 Z M42 34 L53 47 L42 46 Z" className="f-rust s-ink" strokeWidth="2.5" strokeLinejoin="round" /><path d="M32 4 C44 14 46 30 42 46 L22 46 C18 30 20 14 32 4 Z" className="f-card s-ink" strokeWidth="3" /><circle cx="32" cy="24" r="6" className="f-teal s-ink" strokeWidth="2.5" /></svg>;
  }
}
