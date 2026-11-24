/**
 * A looping, CSS-only picture of a lesson: blocks snap into the program one by one,
 * then Vinc rolls across a 3D board and collects the sparks.
 */
const BLOCKS = [
  { t: 'repeat', ico: '🔁', label: 'repeat 2 times' },
  { t: 'step', ico: '⬆', label: 'step', inner: true },
  { t: 'jump', ico: '⤴', label: 'jump', inner: true }
];
const BOARD = ['>.#*.#*'];

export default function LessonDemo() {
  return (
    <div className="ld" aria-label="A lesson: blocks snap together, then Vinc runs them on a 3D board" role="img">
      <div className="ld-code">
        <div className="bk-hat">▶ When I press Run</div>
        {BLOCKS.map((b, i) => (
          <div key={i} className={'ld-b ld-b' + i + ' bk-block bk-' + b.t + (b.inner ? ' inner' : '')}>
            <span className="bk-ico" aria-hidden="true">{b.ico}</span>{b.label}
          </div>
        ))}
        <span className="ld-run">▶ Run</span>
      </div>
      <div className="ld-stage">
        <div className="ld-board">
          {BOARD[0].split('').map((ch, c) => (
            <span key={c} className={'ld-tile' + (ch === '#' ? ' crate' : '')}>
              {ch === '#' && <i className="ld-crate"><b /><b /><b /></i>}
              {ch === '*' && <i className={'ld-spark s' + c}>✦</i>}
            </span>
          ))}
          <span className="ld-vinc"><i /></span>
        </div>
        <span className="ld-stars" aria-hidden="true">★ ★ ★</span>
      </div>
    </div>
  );
}
