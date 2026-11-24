import type { Metadata } from 'next';
import ActionForm from '@/components/ActionForm';
import { Empty, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { q } from '@/lib/db';
import { mailConfigured } from '@/lib/mail';
import { TOPICS } from '@/lib/contact';
import { markHandledAction } from '../actions';

export const metadata: Metadata = { title: 'Messages' };

export default async function Messages() {
  await requireRole('admin');
  const msgs = q.all<{ id: number; topic: string; name: string; email: string; phone: string | null; school: string | null; message: string; created_at: string; email_status: string; email_error: string | null; handled_at: string | null }>(
    `SELECT * FROM contact_messages ORDER BY handled_at IS NOT NULL, created_at DESC LIMIT 200`);
  const open = msgs.filter(m => !m.handled_at).length;
  return (
    <div className="stack">
      <div><div className="eyebrow">Contact form</div><h1>Messages</h1>
        <p className="muted">{open} open message{open === 1 ? '' : 's'}. Every message is saved here, even if the email to the inbox fails.</p></div>
      {!mailConfigured() && <div className="alert info">Email is not set up on this server yet, so messages only appear here. See deploy/DEPLOY.md, section &ldquo;Email&rdquo;.</div>}
      {msgs.length ? msgs.map(m => (
        <section key={m.id} className="card stack" style={{ gap: 10, opacity: m.handled_at ? .65 : 1 }}>
          <div className="spread">
            <div><div className="eyebrow">#{m.id} · {TOPICS[m.topic] ?? m.topic} · {when(m.created_at)}</div><h2>{m.name}</h2>
              <p className="small muted">{m.email}{m.phone ? ` · ${m.phone}` : ''}{m.school ? ` · ${m.school}` : ''}</p></div>
            <div className="row">
              <span className={'badge ' + (m.email_status === 'sent' ? 'good' : m.email_status === 'failed' ? 'bad' : 'plain')} title={m.email_error ?? ''}>email {m.email_status}</span>
              {m.handled_at ? <span className="badge good">handled</span> : <span className="badge warn">open</span>}
            </div>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p>
          {m.email_error && <p className="small" style={{ color: 'var(--bad)' }}>Email error: {m.email_error}</p>}
          <div className="row">
            <a className="btn small" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (TOPICS[m.topic] ?? 'Your message'))}`}>Reply by email</a>
            {!m.handled_at && <ActionForm action={markHandledAction} submit="Mark as handled" className="row" buttonClass="btn small quiet"><input type="hidden" name="id" value={m.id} /></ActionForm>}
          </div>
        </section>
      )) : <Empty>No messages yet. They will appear here when someone uses the contact form.</Empty>}
    </div>
  );
}
