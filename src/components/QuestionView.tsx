import type { Question } from '@/data/assessments';

const ARROW: Record<string, string> = { '^': '▲', '>': '▶', 'v': '▼', '<': '◀' };

export function Board({ map }: { map: string[] }) {
  const cols = map[0].length;
  return (
    <div>
      <div className="board" style={{ gridTemplateColumns: `20px repeat(${cols}, 34px)` }} role="img" aria-label={`Board, ${cols} columns by ${map.length} rows`}>
        <span />
        {Array.from({ length: cols }, (_, c) => <span className="lbl" key={'c' + c}>{'ABCDEFG'[c]}</span>)}
        {map.map((row, r) => [
          <span className="lbl" key={'r' + r}>{r + 1}</span>,
          ...row.split('').map((ch, c) => {
            const cls = ch === '#' ? 'crate' : ch === '*' ? 'spark' : ARROW[ch] ? 'vinc' : '';
            return <span key={r + '-' + c} className={'cell ' + cls}>{ch === '#' ? '▣' : ch === '*' ? '✦' : ARROW[ch] ?? ''}</span>;
          })
        ])}
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>▶ Vinc, pointing the way it faces · ✦ spark · ▣ crate</p>
    </div>
  );
}

export function Code({ lines }: { lines: string[] }) {
  return <pre className="codeblock">{lines.map((l, i) => <div key={i}><span className="ln">{i + 1}</span><span>{l}</span></div>)}</pre>;
}

type Mode = { kind: 'take' } | { kind: 'review'; given: string } | { kind: 'preview' };

export default function QuestionView({ q, n, mode }: { q: Question; n: number; mode: Mode }) {
  const showAnswer = mode.kind !== 'take';
  const given = mode.kind === 'review' ? mode.given : undefined;
  const right = given !== undefined && given !== '' && Number(given) === q.answer;
  return (
    <fieldset className="question" style={{ margin: 0 }}>
      <legend className="sr-only" style={{ position: 'absolute', left: -9999 }}>Question {n}</legend>
      <div className="spread">
        <span className="qnum">Question {n}</span>
        {mode.kind === 'review' && <span className={'badge ' + (right ? 'good' : 'bad')}>{right ? 'Correct' : given ? 'Not quite' : 'Not answered'}</span>}
      </div>
      <p className="prompt">{q.prompt}</p>
      {(q.map || q.code) && <div className="qbody">{q.map && <Board map={q.map} />}{q.code && <Code lines={q.code} />}</div>}
      {q.kind === 'mcq' ? (
        <div className="choices">
          {q.options!.map((o, i) => {
            const cls = showAnswer ? (i === q.answer ? ' right' : given === String(i) ? ' wrong' : '') : '';
            return (
              <label className={'choice' + cls} key={i}>
                <input type="radio" name={'q_' + q.id} value={i} required={mode.kind === 'take'} disabled={mode.kind !== 'take'} defaultChecked={given === String(i)} />
                <span className={q.lang || o.includes('()') ? 'mono' : ''}>{o}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="row">
          <input className="input" style={{ maxWidth: 160 }} type="number" inputMode="numeric" step="any" name={'q_' + q.id} required={mode.kind === 'take'} disabled={mode.kind !== 'take'} defaultValue={given} aria-label={`Answer for question ${n}`} />
          {showAnswer && <span className="small">Right answer: <b>{q.answer}</b></span>}
        </div>
      )}
      {showAnswer && <p className="explain">{q.explain}</p>}
    </fieldset>
  );
}
