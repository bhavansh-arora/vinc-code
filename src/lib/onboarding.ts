import 'server-only';
import { headers } from 'next/headers';
import { q, now } from './db';
import { contactInbox, escapeHtml, mailConfigured, sendMail } from './mail';

/** The site's public address, for links in emails. APP_URL wins; otherwise it comes from the request. */
export async function appUrl(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'code.vinc-lab.com';
  const proto = h.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function onboardingEmail(code: string, schoolName: string | null, base: string) {
  const link = `${base}/signup?role=school&id=${encodeURIComponent(code)}`;
  const hello = schoolName ? `Dear ${schoolName} team,` : 'Dear school coordinator,';
  const steps = [
    'Open the link below. Your School ID is already filled in.',
    "Add your school's details and create the coordinator's login (User ID and password).",
    'On your dashboard you will find two joining codes: one for teachers and one for students.',
    'Share the teacher code with your teachers. They sign up, choose their sections, and give the student code to their classes.'
  ];
  const text = [
    hello, '',
    'Welcome to VINC Code, the coding platform for Classes 3 to 8 where children learn to code by helping Vinc the robot.', '',
    `Your School ID: ${code}`, '',
    'To get started:', ...steps.map((s, i) => `${i + 1}. ${s}`), '',
    `Register your school: ${link}`, '',
    'The School ID works once. If you have any questions, just reply to this email.', '',
    'VINC Lab, Bengaluru'
  ].join('\n');
  const li = steps.map(s => `<li style="margin:0 0 8px">${escapeHtml(s)}</li>`).join('');
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F7F0E3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFF9EF;border:2px solid #2B1A10;border-radius:18px;font-family:Arial,Helvetica,sans-serif;color:#2B1A10">
<tr><td style="padding:28px 28px 8px">
  <div style="font-family:'Courier New',monospace;font-size:12px;letter-spacing:2px;color:#9A5B0A;text-transform:uppercase">VINC Code · Classes 3 to 8</div>
  <h1 style="font-family:Georgia,serif;font-size:26px;line-height:1.2;margin:10px 0 14px">Welcome to VINC Code!</h1>
  <p style="font-size:15px;line-height:1.55;margin:0 0 12px">${escapeHtml(hello)}</p>
  <p style="font-size:15px;line-height:1.55;margin:0 0 18px">VINC Code is the coding platform where children in Classes 3 to 8 learn to code by helping Vinc the robot find its missing parts: 3D puzzles, Python lessons and class-wise assessments, with dashboards for teachers and parents.</p>
</td></tr>
<tr><td style="padding:0 28px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F0E3;border:2px dashed #D98A1C;border-radius:14px"><tr><td style="padding:16px;text-align:center">
    <div style="font-size:13px;color:#6E5442">Your School ID</div>
    <div style="font-family:'Courier New',monospace;font-size:28px;font-weight:bold;letter-spacing:3px;margin-top:4px">${escapeHtml(code)}</div>
  </td></tr></table>
</td></tr>
<tr><td style="padding:20px 28px 4px">
  <h2 style="font-size:17px;margin:0 0 10px">How to get started</h2>
  <ol style="font-size:15px;line-height:1.5;margin:0;padding-left:20px">${li}</ol>
</td></tr>
<tr><td align="center" style="padding:20px 28px 8px">
  <a href="${escapeHtml(link)}" style="display:inline-block;background:#D98A1C;color:#2B1A10;font-weight:bold;font-size:16px;text-decoration:none;padding:14px 26px;border-radius:12px;border:2px solid #2B1A10">Register your school</a>
  <p style="font-size:12px;color:#6E5442;margin:12px 0 0">Or copy this link: <span style="word-break:break-all">${escapeHtml(link)}</span></p>
</td></tr>
<tr><td style="padding:16px 28px 26px">
  <p style="font-size:13px;line-height:1.5;color:#6E5442;margin:0">The School ID works once. Questions? Just reply to this email.<br>VINC Lab, Bengaluru</p>
</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: `Your VINC Code School ID: ${code}`, text, html, link };
}

/** Email the onboarding message for a School ID and record the result. Returns a message for the admin. */
export async function sendOnboarding(code: string): Promise<{ ok: boolean; message: string }> {
  const inv = q.get<{ code: string; note: string | null; email: string | null; school_id: number | null }>('SELECT code, note, email, school_id FROM school_invites WHERE code = ?', code);
  if (!inv?.email) return { ok: false, message: 'This School ID has no email address.' };
  if (inv.school_id) return { ok: false, message: 'This school has already registered.' };
  if (!mailConfigured()) {
    q.run(`UPDATE school_invites SET email_status = 'not set up', email_error = NULL WHERE code = ?`, code);
    return { ok: false, message: 'Email is not set up on this server, so nothing was sent. Send the School ID yourself, or add the mail settings (see deploy/DEPLOY.md).' };
  }
  const m = onboardingEmail(inv.code, inv.note, await appUrl());
  try {
    await sendMail({ to: inv.email, subject: m.subject, text: m.text, html: m.html, replyTo: contactInbox() || undefined });
    q.run(`UPDATE school_invites SET email_status = 'sent', email_sent_at = ?, email_error = NULL WHERE code = ?`, now(), code);
    return { ok: true, message: `Onboarding email sent to ${inv.email}.` };
  } catch (e) {
    const err = String((e as Error).message).slice(0, 300);
    q.run(`UPDATE school_invites SET email_status = 'failed', email_error = ? WHERE code = ?`, err, code);
    return { ok: false, message: `The email to ${inv.email} could not be sent: ${err}` };
  }
}
