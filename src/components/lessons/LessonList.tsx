import Link from 'next/link';
import { Bar } from '@/components/ui';
import type { Lesson } from '@/data/lessons';

const TOPIC: Record<number, string> = { 5: 'If and else', 6: 'Variables in Python', 7: 'Functions', 8: 'Lists, events and AI' };
const PART: Record<number, string> = { 5: 'Memory chip', 6: 'Gear toolbelt', 7: 'AI brain', 8: 'Rocket boosters' };

/** Lessons for one class, as cards. `done` holds the ids of passed lessons (empty for staff). */
export default function LessonList({ grade, lessons, done, hrefFor, staff }: { grade: number; lessons: Lesson[]; done: Set<string>; hrefFor: (id: string) => string; staff?: boolean }) {
  const n = lessons.filter(l => done.has(l.id)).length;
  return (
    <section className="card stack" style={{ gap: 14 }}>
      <div className="spread">
        <div><div className="eyebrow">Class {grade} · {lessons.length} lessons</div><h2>{TOPIC[grade]}</h2>
          <p className="small muted">Finish the boss lesson to win the <b>{PART[grade]}</b>.</p></div>
        {!staff && <div style={{ minWidth: 180 }}><span className="small">{n} of {lessons.length} done</span><Bar value={lessons.length ? n / lessons.length * 100 : 0} /></div>}
      </div>
      <ol className="ls-list">
        {lessons.map(l => (
          <li key={l.id} className={done.has(l.id) ? 'done' : ''}>
            <Link href={hrefFor(l.id)}>
              <span className="ls-num">{done.has(l.id) ? '✓' : l.n}</span>
              <span className="ls-li-txt"><b>{l.title}</b><small>{l.task}</small></span>
              <span className={'ls-type t-' + l.type.replace(/\s|:/g, '').toLowerCase()}>{l.type}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
