import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import ActionForm from '@/components/ActionForm';
import { Bar, Empty, ScoreBadge, Stat, pct, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { adventureDoneInSection, assignmentsOfSection, canManageSection, canSeeSection, getSection, lessonsDoneInSection, schoolCodes, studentsOfSection } from '@/lib/data';
import { ADVENTURE } from '@/data/adventure';
import { lessonsForGrade } from '@/data/lessons';
import { ASSESSMENTS } from '@/data/assessments';
import { addStudentsAction, assignAction, removeStudentAction, resetStudentAction, unassignAction } from '@/app/teacher/actions';
import { ROLE_HOME } from '@/lib/types';

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('admin', 'school', 'teacher');
  const section = getSection(Number((await params).id));
  if (!section) notFound();
  if (!canSeeSection(user, section)) redirect(ROLE_HOME[user.role]);
  const manage = canManageSection(user, section);
  const students = studentsOfSection(section.id);
  const lessonTotal = lessonsForGrade(section.grade).length;
  const lessonsDone = lessonsDoneInSection(section.id, section.grade);
  const showAdv = section.grade >= 5, advDone = showAdv ? adventureDoneInSection(section.id) : new Map<number, number>();
  const assignments = assignmentsOfSection(section.id);
  const assigned = new Set(assignments.map(a => a.assessment_id));
  const available = ASSESSMENTS.filter(a => a.grade <= section.grade && !assigned.has(a.id)).sort((a, b) => b.grade - a.grade);
  const levelAvg = students.length ? students.reduce((t, s) => t + s.levelsDone / s.levelsTotal, 0) / students.length * 100 : null;
  const back = user.role === 'admin' ? `/admin/schools/${section.school_id}` : ROLE_HOME[user.role];

  return (
    <Shell user={user}>
      <div className="stack">
        <div>
          <Link href={back} className="small">← Back</Link>
          <div className="eyebrow" style={{ marginTop: 8 }}>{section.school_name} · Class {section.grade}</div>
          <h1>Section {section.name}</h1>
          <p className="muted">Teacher: {section.teacher_name ?? 'not assigned yet'}</p>
        </div>
        <div className="stats">
          <Stat label="Students" value={students.length} />
          <Stat label="Game levels done" value={pct(levelAvg)} hint="average for this class's levels" />
          <Stat label="Assessments" value={assignments.length} hint="assigned to this section" />
          <Stat label="Average score" value={pct(section.avg_score)} />
        </div>

        {manage && schoolCodes(section.school_id)?.student_code && (
          <div className="alert info">Students can also join this class themselves: they choose <b>Student</b> at <b>/signup</b>, type the school&apos;s joining code <code className="mono"><b>{schoolCodes(section.school_id)!.student_code}</b></code> and pick <b>Class {section.grade} · {section.name}</b>.</div>
        )}

        <section className="card">
          <div className="card-head"><h2>Students</h2><span className="small muted">Levels count towards Class {section.grade}{section.grade > 4 ? ' (practising on the Class 3–4 levels for now)' : ''}</span></div>
          {students.length ? (
            <div className="table-wrap"><table className="data">
              <thead><tr><th>Name</th><th>Username</th>{lessonTotal > 0 && <th>{section.grade <= 4 ? 'Junior game' : 'Lessons'}</th>}{showAdv && <th>Adventure</th>}<th>Game levels</th><th className="num">Stars</th><th className="num">Avg. score</th><th>Last sign-in</th></tr></thead>
              <tbody>{students.map(s => (
                <tr key={s.id}><td><b>{s.name}</b></td><td className="mono small">{s.username}</td>
                  {lessonTotal > 0 && <td style={{ minWidth: 140 }}><Bar amber value={(lessonsDone.get(s.id) ?? 0) / lessonTotal * 100} label="lessons done" /><span className="small muted">{lessonsDone.get(s.id) ?? 0} of {lessonTotal}</span></td>}
                  {showAdv && <td style={{ minWidth: 120 }}><Bar value={(advDone.get(s.id) ?? 0) / ADVENTURE.length * 100} label="adventure levels" /><span className="small muted">{advDone.get(s.id) ?? 0} of {ADVENTURE.length}</span></td>}
                  <td style={{ minWidth: 150 }}><Bar value={s.levelsDone / s.levelsTotal * 100} label={`${s.levelsDone} of ${s.levelsTotal} levels`} /><span className="small muted">{s.levelsDone} of {s.levelsTotal}</span></td>
                  <td className="num">{s.stars}</td><td className="num"><ScoreBadge value={s.avgScore} /></td><td className="small">{when(s.last_login_at)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <Empty>No students yet.{manage ? ' Add them below, then print their login cards.' : ''}</Empty>}
        </section>

        <section className="card">
          <div className="card-head"><h2>Assessments</h2></div>
          {assignments.length ? (
            <div className="table-wrap"><table className="data">
              <thead><tr><th>Assessment</th><th>Due</th><th>Submitted</th><th className="num">Average</th><th /></tr></thead>
              <tbody>{assignments.map(a => (
                <tr key={a.id}><td><b>{a.title}</b><br /><span className="small muted">{a.questions} questions</span></td>
                  <td className="small">{a.due_at ? when(a.due_at) : 'No due date'}</td>
                  <td style={{ minWidth: 140 }}><Bar amber value={students.length ? a.submitted / students.length * 100 : 0} label="submitted" /><span className="small muted">{a.submitted} of {students.length}</span></td>
                  <td className="num"><ScoreBadge value={a.avg_score} /></td>
                  <td className="num"><Link className="btn small" href={`/results/${a.id}`}>Results</Link></td></tr>
              ))}</tbody>
            </table></div>
          ) : <Empty>No assessments assigned yet.</Empty>}
          {manage && (
            <div style={{ marginTop: 16 }}>
              {available.length ? (
                <ActionForm action={assignAction} submit="Assign" className="form-grid">
                  <input type="hidden" name="sectionId" value={section.id} />
                  <div className="field"><label htmlFor="assessmentId">Assessment</label>
                    <select className="input" id="assessmentId" name="assessmentId" required>
                      {available.map(a => <option key={a.id} value={a.id}>Class {a.grade}: {a.title}</option>)}
                    </select></div>
                  <div className="field"><label htmlFor="due">Due date (optional)</label><input className="input" type="date" id="due" name="due" /></div>
                </ActionForm>
              ) : <p className="small muted">Every assessment for this class has been assigned.</p>}
              {assignments.some(a => a.submitted === 0) && (
                <details style={{ marginTop: 12 }}><summary className="small">Remove an assessment nobody has taken</summary>
                  <div style={{ marginTop: 10 }}><ActionForm action={unassignAction} submit="Remove" className="form-grid">
                    <div className="field"><label htmlFor="assignmentId">Assessment</label>
                      <select className="input" id="assignmentId" name="assignmentId">{assignments.filter(a => a.submitted === 0).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></div>
                  </ActionForm></div>
                </details>
              )}
            </div>
          )}
        </section>

        {manage && (
          <div className="grid-2">
            <section className="card">
              <h2>Add students</h2>
              <p className="small muted" style={{ marginBottom: 12 }}>Type one name per line. Each student gets a username and an easy password, shown once as printable login cards.</p>
              <ActionForm action={addStudentsAction} submit="Add students" cardsTitle="New login cards">
                <input type="hidden" name="sectionId" value={section.id} />
                <div className="field"><label htmlFor="names">Student names</label>
                  <textarea className="input" id="names" name="names" placeholder={'Aarav Kumar\nDiya Sharma\nKabir Singh'} required /></div>
              </ActionForm>
            </section>
            <section className="card stack" style={{ gap: 18 }}>
              <div>
                <h2>Reset a password</h2>
                <p className="small muted" style={{ marginBottom: 12 }}>For students who forgot their password. Their old password stops working.</p>
                {students.length ? (
                  <ActionForm action={resetStudentAction} submit="Make a new password" className="form-grid" cardsTitle="New login card">
                    <div className="field"><label htmlFor="studentId">Student</label>
                      <select className="input" id="studentId" name="studentId">{students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.username})</option>)}</select></div>
                  </ActionForm>
                ) : <p className="small muted">Add students first.</p>}
              </div>
              {students.length > 0 && (
                <details><summary className="small">Remove a student from this class</summary>
                  <div style={{ marginTop: 10 }}><ActionForm action={removeStudentAction} submit="Remove student" className="form-grid">
                    <div className="field"><label htmlFor="rmStudent">Student</label>
                      <select className="input" id="rmStudent" name="studentId">{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    <label className="row small"><input type="checkbox" name="confirm" value="yes" /> Yes, remove this student</label>
                  </ActionForm></div>
                </details>
              )}
            </section>
          </div>
        )}
      </div>
    </Shell>
  );
}
