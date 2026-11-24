import Link from 'next/link';
import { Bar } from '@/components/ui';
import CrewArt from '@/components/CrewArt';
import { buddyOf } from '@/lib/crew';
import type { Lesson } from '@/data/lessons';

export const TOPIC: Record<number, string> = { 3: 'Sequencing with blocks', 4: 'Loops and jumps with blocks', 5: 'If and else', 6: 'Variables in Python', 7: 'Functions', 8: 'Lists, events and AI' };
const PART: Record<number, string> = { 3: 'Spring legs', 4: 'Sensor antenna', 5: 'Memory chip', 6: 'Gear toolbelt', 7: 'AI brain', 8: 'Rocket boosters' };

/** Lessons for one class, as a path of cards. `stars` holds the best stars of passed lessons (empty for staff). */
export default function LessonList({ grade, lessons, stars, hrefFor, staff }: { grade: number; lessons: Lesson[]; stars: Map<string, number>; hrefFor: (id: string) => string; staff?: boolean }) {
  const n = lessons.filter(l => stars.has(l.id)).length;
  const total = lessons.reduce((t, l) => t + (stars.get(l.id) ?? 0), 0);
  const buddy = buddyOf(grade);
  const nextId = lessons.find(l => !stars.has(l.id))?.id;
  return (
    <section className="card stack ls-class" style={{ gap: 14, ['--buddy' as string]: buddy.color }}>
      <div className="spread">
        <div className="row" style={{ gap: 14, alignItems: 'center' }}>
          <CrewArt id={buddy.id} className="ls-buddy" label={buddy.name} />
          <div><div className="eyebrow">Class {grade} · {lessons.length} lessons · {grade <= 4 ? 'blocks' : 'Python'}</div><h2>{TOPIC[grade]}</h2>
            <p className="small muted"><b>{buddy.name}</b> the {buddy.what} guides this class. Finish the boss lesson to win the <b>{PART[grade]}</b>.</p></div>
        </div>
        {!staff && <div style={{ minWidth: 190, display: 'grid', gap: 4 }}><span className="small">{n} of {lessons.length} done · ★ {total} of {lessons.length * 3}</span><Bar value={lessons.length ? n / lessons.length * 100 : 0} /></div>}
      </div>
      <ol className="ls-list">
        {lessons.map(l => {
          const s = stars.get(l.id);
          return (
            <li key={l.id} className={(s !== undefined ? 'done' : '') + (!staff && l.id === nextId ? ' next' : '')}>
              <Link href={hrefFor(l.id)}>
                <span className="ls-num">{s !== undefined ? '✓' : l.n}</span>
                <span className="ls-li-txt"><b>{l.title}</b><small>{l.task}</small>
                  {s !== undefined && <span className="ls-stars" aria-label={`${s} of 3 stars`}>{[1, 2, 3].map(i => <span key={i} className={i <= s ? 'on' : ''} aria-hidden="true">★</span>)}</span>}
                </span>
                <span className={'ls-type t-' + l.type.replace(/\s|:/g, '').toLowerCase()}>{l.type}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
