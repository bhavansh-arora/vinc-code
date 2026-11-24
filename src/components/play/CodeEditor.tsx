'use client';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { highlight } from '@/lib/vincscript';

export interface EditorApi { insert: (text: string) => void }

/** A code box with line numbers and colours: a coloured copy sits behind a see-through textarea. */
const CodeEditor = forwardRef<EditorApi, { value: string; onChange: (v: string) => void; onRun: () => void; activeLine: number | null; errorLine: number | null; disabled?: boolean }>(
  function CodeEditor({ value, onChange, onRun, activeLine, errorLine, disabled }, api) {
    const ta = useRef<HTMLTextAreaElement>(null), back = useRef<HTMLPreElement>(null), gut = useRef<HTMLDivElement>(null);
    const lines = value.split('\n');

    useImperativeHandle(api, () => ({
      insert(text: string) {
        const el = ta.current; if (!el) return;
        const { selectionStart: s, selectionEnd: e, value: v } = el;
        const lineStart = v.lastIndexOf('\n', s - 1) + 1;
        const indent = v.slice(lineStart).match(/^ */)![0];
        const blank = v.slice(lineStart, s).trim() === '';
        const body = text.split('\n').map((l, i) => (i === 0 ? l : indent + l)).join('\n');
        const opens = text.endsWith('    ');
        const piece = blank ? body : '\n' + indent + body;
        const next = v.slice(0, s) + piece + (opens ? '' : '\n' + indent) + v.slice(e);
        onChange(next);
        const caret = s + piece.length + (opens ? 0 : indent.length + 1);
        requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret); });
      }
    }), [onChange]);

    function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      const el = e.currentTarget, { selectionStart: s, selectionEnd: en, value: v } = el;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); return; }
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); onChange(v.slice(0, s) + '    ' + v.slice(en)); requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const line = v.slice(v.lastIndexOf('\n', s - 1) + 1, s);
        let indent = line.match(/^ */)![0];
        if (line.trimEnd().endsWith(':')) indent += '    ';
        onChange(v.slice(0, s) + '\n' + indent + v.slice(en)); requestAnimationFrame(() => el.setSelectionRange(s + 1 + indent.length, s + 1 + indent.length));
      } else if (e.key === 'Backspace' && s === en && s > 0) {
        const lineStart = v.lastIndexOf('\n', s - 1) + 1, before = v.slice(lineStart, s);
        if (before.length >= 4 && /^ +$/.test(before)) { e.preventDefault(); const cut = before.length % 4 || 4; onChange(v.slice(0, s - cut) + v.slice(s)); requestAnimationFrame(() => el.setSelectionRange(s - cut, s - cut)); }
      }
    }
    const sync = () => { const el = ta.current; if (!el) return; if (back.current) { back.current.scrollTop = el.scrollTop; back.current.scrollLeft = el.scrollLeft; } if (gut.current) gut.current.scrollTop = el.scrollTop; };

    return (
      <div className="ce">
        <div className="ce-gutter" ref={gut} aria-hidden="true">{lines.map((_, i) => <div key={i} className={i + 1 === activeLine ? 'on' : i + 1 === errorLine ? 'err' : ''}>{i + 1}</div>)}</div>
        <div className="ce-body">
          <pre className="ce-back" ref={back} aria-hidden="true">{lines.map((l, i) => (
            <div key={i} className={i + 1 === activeLine ? 'on' : i + 1 === errorLine ? 'err' : ''}>{highlight(l).map(([t, c], k) => <span key={k} className={c}>{t}</span>)}{'\n'}</div>
          ))}</pre>
          <textarea ref={ta} value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKey} onScroll={sync} spellCheck={false} autoCapitalize="none" autoCorrect="off"
            aria-label="Your code" readOnly={disabled} rows={Math.max(10, lines.length + 2)} />
        </div>
      </div>
    );
  });
export default CodeEditor;
