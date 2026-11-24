'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MAX_REPEAT, newId, type Block, type BlockName } from '@/lib/blocks';
import { sfx } from './fx';

const MAX_BLOCKS = 30;
export const BLOCK_WORD: Record<BlockName, string> = { step: 'step forward', turnLeft: 'turn left', turnRight: 'turn right', jump: 'jump', repeat: 'repeat' };

/** Picture-only block faces, so children who cannot read yet can play. */
export function BlockIcon({ name }: { name: BlockName }) {
  const p = { viewBox: '0 0 48 48', 'aria-hidden': true, className: 'gj-ico' } as const;
  switch (name) {
    case 'step': return <svg {...p}><path d="M24 6 L38 22 H29 V42 H19 V22 H10 Z" /></svg>;
    case 'turnLeft': return <svg {...p}><path d="M30 42 V24 a6 6 0 0 0 -6 -6 H18 V26 L6 14 L18 2 V10 H24 a14 14 0 0 1 14 14 V42 Z" /></svg>;
    case 'turnRight': return <svg {...p}><path d="M18 42 V24 a6 6 0 0 1 6 -6 H30 V26 L42 14 L30 2 V10 H24 a14 14 0 0 0 -14 14 V42 Z" /></svg>;
    case 'jump': return <svg {...p}><path d="M6 40 Q 10 8 30 10 L30 4 L44 14 L30 24 L30 18 Q 16 18 14 40 Z" /><rect x="22" y="30" width="12" height="12" rx="2" className="gj-ico-crate" /></svg>;
    case 'repeat': return <svg {...p}><path d="M10 22 a14 14 0 0 1 24 -10 L38 8 V20 H26 L31 15 a8 8 0 0 0 -15 7 Z M38 26 a14 14 0 0 1 -24 10 L10 40 V28 H22 L17 33 a8 8 0 0 0 15 -7 Z" /></svg>;
  }
}

type Spot = { parent: string | null; index: number };
function mapTree(list: Block[], f: (l: Block[], parent: string | null) => Block[], parent: string | null = null): Block[] {
  return f(list.map(b => (b.t === 'repeat' ? { ...b, body: mapTree(b.body, f, b.id) } : b)), parent);
}
const insertAt = (list: Block[], at: Spot, b: Block) => mapTree(list, (l, p) => (p === at.parent ? [...l.slice(0, at.index), b, ...l.slice(at.index)] : l));
const removeId = (list: Block[], id: string) => mapTree(list, l => l.filter(b => b.id !== id));
const count = (l: Block[]): number => l.reduce((n, b) => n + 1 + (b.t === 'repeat' ? count(b.body) : 0), 0);
function find(l: Block[], id: string): Block | null { for (const b of l) { if (b.id === id) return b; if (b.t === 'repeat') { const f = find(b.body, id); if (f) return f; } } return null; }
function where(l: Block[], id: string, parent: string | null = null): Spot | null {
  for (let i = 0; i < l.length; i++) { const b = l[i]; if (b.id === id) return { parent, index: i }; if (b.t === 'repeat') { const w = where(b.body, id, b.id); if (w) return w; } }
  return null;
}
const lengthOf = (l: Block[], parent: string | null) => (parent === null ? l.length : (find(l, parent) as Extract<Block, { t: 'repeat' }> | null)?.body.length ?? 0);

/**
 * The program row and the block tray. Drag a block from the tray into a slot (mouse or finger), or tap it to add it
 * at the end. Tap a block in the row to take it out, or drag it somewhere else; drag it off the row to throw it away.
 * Tap a repeat block's frame to fill it; tap its number to change how many times.
 */
export default function JuniorStrip({ value, onChange, palette, activeId, errorId, disabled, minSlots, onPlay, playLabel, refs }: {
  value: Block[]; onChange: (v: Block[]) => void; palette: BlockName[]; activeId?: string | null; errorId?: string | null;
  disabled?: boolean; minSlots: number; onPlay: () => void; playLabel: string;
  refs?: { tray?: React.Ref<HTMLButtonElement>; slot?: React.Ref<HTMLSpanElement>; play?: React.Ref<HTMLButtonElement> };
}) {
  const [target, setTarget] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ name: BlockName; id?: string; x: number; y: number } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const start = useRef<{ name: BlockName; id?: string; x: number; y: number; moved: boolean } | null>(null);
  const total = count(value);
  const tgt = target && find(value, target) ? target : null;

  const add = useCallback((name: BlockName, at?: Spot) => {
    if (disabled) return;
    if (total >= MAX_BLOCKS) { sfx('bump'); return; }
    const b: Block = name === 'repeat' ? { id: newId(), t: 'repeat', n: 2, body: [] } : { id: newId(), t: name };
    const spot = at ?? { parent: tgt, index: lengthOf(value, tgt) };
    onChange(insertAt(value, spot, b)); sfx('drop');
    if (name === 'repeat') setTarget(b.id);
  }, [disabled, total, tgt, value, onChange]);

  const spotAt = (x: number, y: number): Spot | 'strip' | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const d = el?.closest<HTMLElement>('[data-drop]');
    if (d) return { parent: d.dataset.parent === 'root' ? null : d.dataset.parent!, index: Number(d.dataset.index) };
    return el?.closest('.gj-strip') ? 'strip' : null;
  };

  // Pointer dragging works for both mouse and touch.
  useEffect(() => {
    function move(e: PointerEvent) {
      const s = start.current; if (!s) return;
      if (!s.moved && Math.hypot(e.clientX - s.x, e.clientY - s.y) < 8) return;
      s.moved = true; setDrag({ name: s.name, id: s.id, x: e.clientX, y: e.clientY });
      const sp = spotAt(e.clientX, e.clientY);
      setOver(sp && sp !== 'strip' ? (sp.parent ?? 'root') + ':' + sp.index : sp === 'strip' ? 'strip' : null);
    }
    function up(e: PointerEvent) {
      const s = start.current; start.current = null; setDrag(null); setOver(null);
      if (!s) return;
      if (!s.moved) {
        if (s.id) { onChange(removeId(value, s.id)); sfx('pop'); } else add(s.name);
        return;
      }
      const sp = spotAt(e.clientX, e.clientY);
      if (s.id) {
        const moving = find(value, s.id), from = where(value, s.id);
        if (!moving || !from) return;
        if (!sp) { onChange(removeId(value, s.id)); sfx('pop'); return; }
        const at = sp === 'strip' ? { parent: null, index: lengthOf(removeId(value, s.id), null) } : sp;
        if (at.parent && (at.parent === s.id || (moving.t === 'repeat' && find(moving.body, at.parent)))) return;
        const without = removeId(value, s.id);
        const index = from.parent === at.parent && from.index < at.index ? at.index - 1 : at.index;
        onChange(insertAt(without, { parent: at.parent, index: Math.min(index, lengthOf(without, at.parent)) }, moving)); sfx('drop');
      } else if (sp) add(s.name, sp === 'strip' ? undefined : { parent: sp.parent, index: Math.min(sp.index, lengthOf(value, sp.parent)) });
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [value, onChange, add]);

  const grab = (name: BlockName, id?: string) => (e: React.PointerEvent) => {
    if (disabled || e.button > 0) return;
    e.preventDefault(); start.current = { name, id, x: e.clientX, y: e.clientY, moved: false };
  };
  const dropKey = (parent: string | null, index: number) => (parent ?? 'root') + ':' + index;

  function row(items: Block[], parent: string | null): React.ReactNode {
    return items.map((b, i) => (
      <span key={b.id} className={'gj-cell' + (over === dropKey(parent, i) ? ' over' : '')} data-drop="" data-parent={parent ?? 'root'} data-index={i}>
        {b.t === 'repeat' ? (
          <span className={'gj-rep' + (tgt === b.id ? ' target' : '') + (activeId === b.id ? ' running' : '') + (errorId === b.id ? ' error' : '')}>
            <span className="gj-rep-cap" onPointerDown={grab('repeat', b.id)} onClick={e => e.stopPropagation()} title="Repeat">
              <BlockIcon name="repeat" />
              <button type="button" className="gj-rep-n" disabled={disabled} aria-label={`Repeat ${b.n} times. Tap to change.`}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); sfx('click'); onChange(mapTree(value, l => l.map(x => (x.id === b.id && x.t === 'repeat' ? { ...x, n: x.n >= Math.min(9, MAX_REPEAT) ? 2 : x.n + 1 } : x)))); }}>{b.n}</button>
            </span>
            <span className="gj-rep-body" onClick={() => { if (!disabled) { setTarget(tgt === b.id ? null : b.id); sfx('click'); } }}>
              {row(b.body, b.id)}
              <span className={'gj-slot inner' + (over === dropKey(b.id, b.body.length) ? ' over' : '') + (tgt === b.id ? ' glow' : '')} data-drop="" data-parent={b.id} data-index={b.body.length} aria-hidden="true" />
            </span>
            <span className="gj-rep-end" />
          </span>
        ) : (
          <button type="button" className={'gj-block b-' + b.t + (activeId === b.id ? ' running' : '') + (errorId === b.id ? ' error' : '')}
            onPointerDown={grab(b.t, b.id)} onClick={e => { if (e.detail === 0 && !disabled) { onChange(removeId(value, b.id)); sfx('pop'); } }} disabled={disabled} aria-label={`${BLOCK_WORD[b.t]}. Tap to take it out.`}>
            <BlockIcon name={b.t} />
          </button>
        )}
      </span>
    ));
  }

  const ghosts = Math.max(minSlots - value.length, 1);
  return (
    <div className={'gj-dock' + (drag ? ' dragging' : '')}>
      <div className="gj-row">
        <div className={'gj-strip' + (over === 'strip' ? ' over' : '')} aria-label={`Your program: ${total} blocks`} onClick={e => { if (e.target === e.currentTarget) setTarget(null); }}>
          {row(value, null)}
          {Array.from({ length: ghosts }, (_, i) => (
            <span key={'g' + i} ref={i === 0 ? refs?.slot : undefined} className={'gj-slot' + (over === dropKey(null, value.length + i) ? ' over' : '') + (i === 0 && !tgt ? ' glow' : '')}
              data-drop="" data-parent="root" data-index={value.length} aria-hidden="true" onClick={() => setTarget(null)} />
          ))}
        </div>
        <button type="button" ref={refs?.play} className="gj-play" onClick={onPlay} aria-label={playLabel}>{playLabel === 'Stop' ? '■' : '▶'}</button>
      </div>
      <div className="gj-tray" aria-label="Blocks: tap to add, or drag into a slot">
        {palette.map((name, i) => (
          <button key={name} ref={i === 0 ? refs?.tray : undefined} type="button" className={'gj-block big b-' + name} disabled={disabled}
            onPointerDown={grab(name)} onClick={e => { if (e.detail === 0) add(name); }} aria-label={`Add ${BLOCK_WORD[name]}`}>
            <BlockIcon name={name} />
          </button>
        ))}
        {total > 0 && !disabled && <button type="button" className="gj-clear" onClick={() => { onChange([]); setTarget(null); sfx('pop'); }} aria-label="Take out all blocks">🧹</button>}
      </div>
      {drag && <span className={'gj-ghost gj-block big b-' + drag.name} style={{ left: drag.x, top: drag.y }} aria-hidden="true"><BlockIcon name={drag.name} /></span>}
    </div>
  );
}
