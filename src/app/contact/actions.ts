'use server';
import { q, now } from '@/lib/db';
import { cleanName } from '@/lib/accounts';
import { allow, clientIp } from '@/lib/ratelimit';
import { emailOk, phoneDigits } from '@/lib/signup';
import { contactInbox, escapeHtml, mailConfigured, sendMail } from '@/lib/mail';
import { TOPICS } from '@/lib/contact';


export type ContactState = { ok?: boolean; error?: string; field?: string };

export async function contactAction(_p: ContactState, f: FormData): Promise<ContactState> {
  // Bots fill the hidden "website" field; pretend it worked and drop it.
  if (String(f.get('website') ?? '').trim()) return { ok: true };
  if (!allow('contact:' + await clientIp(), 5, 3600_000)) return { error: 'You have sent several messages already. Please try again in an hour, or email us directly.' };

  const topic = String(f.get('topic') ?? '');
  if (!TOPICS[topic]) return { field: 'topic', error: 'Choose what your message is about.' };
  const name = cleanName(String(f.get('name') ?? ''));
  if (name.length < 2) return { field: 'name', error: 'Type your name.' };
  const email = String(f.get('email') ?? '').trim().toLowerCase().slice(0, 80);
  if (!emailOk(email)) return { field: 'email', error: 'Type a working email address so we can reply.' };
  const phone = phoneDigits(String(f.get('phone') ?? '')).slice(0, 13);
  if (phone && phone.length < 10) return { field: 'phone', error: 'Enter a 10-digit mobile number, or leave it empty.' };
  const school = cleanName(String(f.get('school') ?? '')).slice(0, 80) || null;
  const message = String(f.get('message') ?? '').replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, 4000);
  if (message.length < 10) return { field: 'message', error: 'Tell us a little more (at least 10 characters).' };

  const id = q.run(`INSERT INTO contact_messages (topic, name, email, phone, school, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    topic, name, email, phone || null, school, message, now()).id;

  if (mailConfigured()) {
    const rows: [string, string][] = [['Topic', TOPICS[topic]], ['Name', name], ['Email', email], ['Mobile', phone || '—'], ['School', school || '—']];
    try {
      await sendMail({
        to: contactInbox(),
        replyTo: `${name} <${email}>`,
        subject: `[VINC Code] ${TOPICS[topic]}: ${name}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${message}\n\n— Sent from the contact form on VINC Code (message #${id}). Reply to this email to answer ${name}.`,
        html: `<table cellpadding="4" style="font-family:sans-serif;font-size:14px">${rows.map(([k, v]) => `<tr><td style="color:#6E5442">${k}</td><td><b>${escapeHtml(v)}</b></td></tr>`).join('')}</table>`
          + `<p style="font-family:sans-serif;font-size:15px;white-space:pre-wrap;border-left:3px solid #D98A1C;padding-left:12px">${escapeHtml(message)}</p>`
          + `<p style="font-family:sans-serif;font-size:12px;color:#6E5442">Sent from the contact form on VINC Code (message #${id}). Reply to this email to answer ${escapeHtml(name)}.</p>`
      });
      q.run(`UPDATE contact_messages SET email_status = 'sent' WHERE id = ?`, id);
    } catch (e) {
      q.run(`UPDATE contact_messages SET email_status = 'failed', email_error = ? WHERE id = ?`, String((e as Error).message).slice(0, 300), id);
      console.error('Contact email failed for message', id, (e as Error).message);
    }
  } else {
    q.run(`UPDATE contact_messages SET email_status = 'not set up' WHERE id = ?`, id);
  }
  return { ok: true };
}
