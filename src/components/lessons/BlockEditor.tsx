'use client';
import { useState } from 'react';
import { MAX_REPEAT, newId, type Block, type BlockName } from '@/lib/blocks';

const MAX_BLOCKS = 40;
const ICON: Record<BlockName, string> = { step: '⬆', turnLeft: '↺', turnRight: '↻', jump: '⤴', repeat: '🔁' };
const NAME: Record<BlockName, string> = { step: 'step', turnLeft: 'turn left', turnRight: 'turn right', jump: 'jump', repeat: 'repeat' };

type Cursor = { parent: string | null; index: number };

function count(list: Block[]): number { return list.reduce((n, b) => n + 1 + (b.t === 'repeat' ? count(b.body) : 0), 0); }
function bodyOf(list: Block[], parent: string | null): Block[] | null {
  if (parent === null) return list;
  for (const b of list) if (b.t === 'repeat') { if (b.id === parent) return b.body; const f = bodyOf(b.body, parent); if (f) return f; }
  return null;
}
/** Immutable edits on the block tree. */
function mapTree(list: Block[], f: (list: Block[], parent: string | null) => Block[], parent: string | null = null): Block[] {
  return f(list.map(b => (b.t === 'repeat' ? { ...b, body: mapTree(b.body, f, b.id) } : b)), parent);
}
function insertAt(list: Block[], cur: Cursor, block: Block): Block[] {
  return mapTree(list, (l, p) => (p === cur.parent ? [...l.slice(0, cur.index), block, ...l.slice(cur.index)] : l));
}
function removeId(list: Block[], id: string): { list: Block[]; removed: Block | null } {
  let removed: Block | null = null;
  const out = mapTree(list, l => l.filter(b => { if (b.id === id) { removed = b; return false; } return true; }));
  return { list: out, removed };
}
function contains(b: Block, id: string): boolean { return b.id === id || (b.t === 'repeat' && b.body.some(x => contains(x, id))); }
function where(list: Block[], id: string, parent: string | null = null): Cursor | null {
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (b.id === id) return { parent, index: i };
    if (b.t === 'repeat') { const w = where(b.body, id, b.id); if (w) return w; }
  }
  return null;
}

/**
 * The block editor for Classes 3 and 4. Tap a block in the palette to add it where the glowing line is,
 * or drag it into place. Drag blocks in the program to move them; ✕ removes one.
 */
export default function BlockEditor({ value, onChange, palette, activeId, errorId, disabled }: {
  value: Block[]; onChange: (v: Block[]) => void; palette: BlockName[]; activeId?: string | null; errorId?: string | null; disabled?: boolean;
}) {
  const [cur, setCur] = useState<Cursor>({ parent: null, index: value.length });
  const [over, setOver] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const total = count(value);

  // Keep the cursor valid after edits.
  const target = bodyOf(value, cur.parent);
  const cursor: Cursor = target ? { parent: cur.parent, index: Math.min(cur.index, target.length) } : { parent: null, index: value.length };

  function make(name: BlockName): Block { return name === 'repeat' ? { id: newId(), t: 'repeat', n: 3, body: [] } : { id: newId(), t: name }; }
  function add(name: BlockName, at: Cursor = cursor) {
    if (disabled) return;
    if (total >= MAX_BLOCKS) { setFull(true); setTimeout(() => setFull(false), 1800); return; }
    const b = make(name);
    onChange(insertAt(value, at, b));
    setCur(name === 'repeat' ? { parent: b.id, index: 0 } : { parent: at.parent, index: at.index + 1 });
  }
  function remove(id: string) {
    if (disabled) return;
    const w = where(value, id);
    onChange(removeId(value, id).list);
    if (w) setCur(w);
  }
  function setN(id: string, n: number) {
    onChange(mapTree(value, l => l.map(b => (b.id === id && b.t === 'repeat' ? { ...b, n: Math.max(1, Math.min(MAX_REPEAT, n)) } : b))));
  }
  function drop(e: React.DragEvent, at: Cursor) {
    e.preventDefault(); e.stopPropagation(); setOver(null);
    if (disabled) return;
    const fresh = e.dataTransfer.getData('text/x-vinc-new') as BlockName;
    if (fresh) { add(fresh, at); return; }
    const id = e.dataTransfer.getData('text/x-vinc-move');
    if (!id) return;
    const from = where(value, id);
    const moving = (function find(l: Block[]): Block | null { for (const b of l) { if (b.id === id) return b; if (b.t === 'repeat') { const f = find(b.body); if (f) return f; } } return null; })(value);
    if (!from || !moving) return;
    if (at.parent && contains(moving, at.parent)) return; // cannot drop a repeat inside itself
    const { list } = removeId(value, id);
    const index = from.parent === at.parent && from.index < at.index ? at.index - 1 : at.index;
    onChange(insertAt(list, { parent: at.parent, index }, moving));
    setCur({ parent: at.parent, index: index + 1 });
  }

  function gap(parent: string | null, index: number) {
    const key = (parent ?? 'root') + ':' + index;
    const on = cursor.parent === parent && cursor.index === index;
    return (
      <div key={'gap-' + key} className={'bk-gap' + (on ? ' on' : '') + (over === key ? ' over' : '')}
        onClick={() => setCur({ parent, index })}
        onDragOver={e => { e.preventDefault(); setOver(key); }} onDragLeave={() => setOver(o => (o === key ? null : o))}
        onDrop={e => drop(e, { parent, index })}>
        {on && <span className="bk-caret">new blocks go here</span>}
      </div>
    );
  }

  function list(items: Block[], parent: string | null): React.ReactNode {
    return (
      <div className="bk-list">
        {items.map((b, i) => (
          <div key={b.id} className="bk-item">
            {gap(parent, i)}
            <div className={'bk-block bk-' + b.t + (activeId === b.id ? ' running' : '') + (errorId === b.id ? ' error' : '')}
              draggable={!disabled} onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/x-vinc-move', b.id); e.dataTransfer.effectAllowed = 'move'; }}>
              <span className="bk-ico" aria-hidden="true">{ICON[b.t]}</span>
              {b.t === 'repeat' ? (
                <span className="bk-rep">repeat
                  <span className="bk-num">
                    <button type="button" aria-label="Fewer times" onClick={() => setN(b.id, b.n - 1)} disabled={disabled || b.n <= 1}>−</button>
                    <b aria-live="polite">{b.n}</b>
                    <button type="button" aria-label="More times" onClick={() => setN(b.id, b.n + 1)} disabled={disabled || b.n >= MAX_REPEAT}>+</button>
                  </span>times
                </span>
              ) : <span className="bk-name">{NAME[b.t]}</span>}
              <button type="button" className="bk-x" aria-label={`Remove ${NAME[b.t]}`} onClick={() => remove(b.id)} disabled={disabled}>✕</button>
            </div>
            {b.t === 'repeat' && (
              <div className="bk-mouth">
                {list(b.body, b.id)}
                {!b.body.length && <p className="bk-empty">Put blocks in here</p>}
              </div>
            )}
          </div>
        ))}
        {gap(parent, items.length)}
      </div>
    );
  }

  return (
    <div className="bk">
      <div className="bk-palette" aria-label="Blocks">
        {palette.map(name => (
          <button type="button" key={name} className={'bk-block bk-' + name + ' bk-pal'} disabled={disabled}
            draggable={!disabled} onDragStart={e => { e.dataTransfer.setData('text/x-vinc-new', name); e.dataTransfer.effectAllowed = 'copy'; }}
            onClick={() => add(name)} aria-label={`Add ${NAME[name]}`}>
            <span className="bk-ico" aria-hidden="true">{ICON[name]}</span><span className="bk-name">{NAME[name]}</span>
          </button>
        ))}
        <span className="small muted bk-tip">Tap to add, or drag into place</span>
      </div>
      <div className="bk-program" onDragOver={e => e.preventDefault()} onDrop={e => drop(e, { parent: null, index: value.length })}>
        <div className="bk-hat">▶ When I press Run</div>
        {list(value, null)}
        {!value.length && <p className="bk-empty">Tap a block above to start your program.</p>}
      </div>
      <div className="spread small muted">
        <span>{total} {total === 1 ? 'block' : 'blocks'}{full ? ' · That is the most blocks a program can have.' : ''}</span>
        {total > 0 && !disabled && <button type="button" className="btn small quiet" onClick={() => { onChange([]); setCur({ parent: null, index: 0 }); }}>Clear all</button>}
      </div>
    </div>
  );
}

/** A read-only stack of blocks, for examples. */
export function BlockStack({ blocks }: { blocks: Block[] }) {
  const render = (items: Block[]): React.ReactNode => items.map(b => (
    <div key={b.id} className="bk-item">
      <div className={'bk-block bk-' + b.t + ' still'}>
        <span className="bk-ico" aria-hidden="true">{ICON[b.t]}</span>
        {b.t === 'repeat' ? <span className="bk-rep">repeat <b className="bk-num-ro">{b.n}</b> times</span> : <span className="bk-name">{NAME[b.t]}</span>}
      </div>
      {b.t === 'repeat' && <div className="bk-mouth"><div className="bk-list">{render(b.body)}</div></div>}
    </div>
  ));
  return <div className="bk-stack bk-list">{render(blocks)}</div>;
}
