'use client';
import { startTransition, useActionState, useState } from 'react';
import Icon from '@/components/auth/Icon';
import { contactAction, type ContactState } from '@/app/contact/actions';
import { TOPICS } from '@/lib/contact';

export default function ContactForm({ topic: initialTopic }: { topic?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(contactAction, {});
  const [topic, setTopic] = useState(TOPICS[initialTopic ?? ''] ? initialTopic! : 'school');
  const err = (f: string) => (state.field === f ? state.error : undefined);
  if (state.ok) {
    return (
      <div className="au-done" role="status">
        <svg className="au-done-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" /><path d="M20 33l8 8 16-17" /></svg>
        <h2>Thank you! We got your message.</h2>
        <p className="muted">Someone from VINC Lab will reply to your email, usually within two working days.</p>
        <a className="btn" href="/">Back to VINC Code</a>
      </div>
    );
  }
  const field = (id: string, label: string, icon: string, input: React.ReactNode, optional = false) => (
    <div className={'au-field' + (err(id) ? ' bad' : '')}>
      <label htmlFor={id}>{label}{optional && <small className="au-opt"> optional</small>}</label>
      <div className="au-input"><Icon name={icon} />{input}</div>
      {err(id) && <small className="au-err" role="alert">{err(id)}</small>}
    </div>
  );
  return (
    <form className="au-form" noValidate onSubmit={e => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}>
      <fieldset className="au-field au-picks">
        <legend>What is it about?</legend>
        <div className="au-chips">
          {Object.entries(TOPICS).map(([k, v]) => (
            <label key={k} className="au-pick"><input type="radio" name="topic" value={k} checked={topic === k} onChange={() => setTopic(k)} /><span>{v}</span></label>
          ))}
        </div>
      </fieldset>
      <div className="au-row2">
        {field('name', 'Your name', 'user', <input id="name" name="name" required maxLength={60} autoComplete="name" />)}
        {field('email', 'Email', 'mail', <input id="email" name="email" type="email" required maxLength={80} autoComplete="email" />)}
      </div>
      <div className="au-row2">
        {field('phone', 'Mobile number', 'phone', <input id="phone" name="phone" type="tel" inputMode="tel" maxLength={15} autoComplete="tel" />, true)}
        {field('school', 'School', 'school', <input id="school" name="school" maxLength={80} autoComplete="organization" />, topic !== 'school')}
      </div>
      <div className={'au-field' + (err('message') ? ' bad' : '')}>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" className="au-textarea" required maxLength={4000} rows={6}
          placeholder={topic === 'school' ? 'Tell us about your school: classes, number of students, and when you would like to start.' : 'How can we help?'} />
        {err('message') && <small className="au-err" role="alert">{err('message')}</small>}
      </div>
      {/* Hidden from people; bots fill it in. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      {state.error && <p className="au-form-err" role="alert">{state.field ? 'Please fix the highlighted field.' : state.error}</p>}
      <button className="btn primary au-go" disabled={pending}>{pending ? <span className="au-spin" aria-label="Sending" /> : <>Send message <Icon name="arrow" /></>}</button>
      <p className="au-fine">We use your details only to reply to you.</p>
    </form>
  );
}
