export function pct(n: number | null | undefined): string {
  return n === null || n === undefined || Number.isNaN(n) ? '—' : `${Math.round(n)}%`;
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Bar({ value, amber, label }: { value: number | null; amber?: boolean; label?: string }) {
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="barline">
      <div className={'bar' + (amber ? ' amber' : '')} role="img" aria-label={(label ? label + ': ' : '') + pct(value)}><span style={{ width: v + '%' }} /></div>
      <span className="small mono">{pct(value)}</span>
    </div>
  );
}

export function ScoreBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="badge plain">not taken</span>;
  const cls = value >= 75 ? 'good' : value >= 50 ? 'warn' : 'bad';
  return <span className={'badge ' + cls}>{pct(value)}</span>;
}

export function Stars({ n }: { n: number }) {
  return <span className="stars" aria-label={`${n} of 3 stars`}>{'★'.repeat(n)}<span className="off">{'★'.repeat(3 - n)}</span></span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function when(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
