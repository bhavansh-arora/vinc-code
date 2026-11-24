import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

/*
 * Outgoing email through the VINC mailbox. All settings come from the server's environment (.env),
 * never from the code:
 *   SMTP_HOST=send.one.com  SMTP_PORT=465  SMTP_USER=info@vinc-lab.com  SMTP_PASS=…
 *   MAIL_FROM="VINC Code <info@vinc-lab.com>"   CONTACT_TO=info@vinc-lab.com
 */

export function mailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transport: Transporter | null = null;
function getTransport(): Transporter {
  if (transport) return transport;
  const port = Number(process.env.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000
  });
  return transport;
}

export const contactInbox = () => process.env.CONTACT_TO || process.env.SMTP_USER || '';

export async function sendMail(m: { to: string; subject: string; text: string; html?: string; replyTo?: string }): Promise<void> {
  if (!mailConfigured()) throw new Error('Email is not set up on this server (SMTP_HOST, SMTP_USER, SMTP_PASS).');
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || `VINC Code <${process.env.SMTP_USER}>`,
    to: m.to, subject: m.subject, text: m.text, html: m.html, replyTo: m.replyTo
  });
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
