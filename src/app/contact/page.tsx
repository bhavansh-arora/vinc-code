import Link from 'next/link';
import type { Metadata } from 'next';
import VincArt from '@/components/VincArt';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = { title: 'Contact VINC Lab' };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <div className="lp">
      <div className="lp-bg" aria-hidden="true"><span className="lp-blob a" /><span className="lp-blob b" /></div>
      <header className="lp-nav">
        <Link href="/" className="brand"><VincArt label="" /> VINC Code</Link>
        <nav aria-label="Sections"><Link href="/">Home</Link></nav>
        <Link className="btn quiet" href="/login">Log in</Link>
        <Link className="btn primary" href="/signup">Create account</Link>
      </header>
      <main className="ct">
        <section className="ct-info">
          <div className="eyebrow">Contact VINC Lab</div>
          <h1>Let&apos;s talk about coding at your school.</h1>
          <p className="lp-lede">Schools, teachers and parents: send us a message and we will reply by email, usually within two working days.</p>
          <ul className="ct-list">
            <li><b>Bring VINC Code to your school.</b> We set up your school, give you a School ID, and help your teachers get started.</li>
            <li><b>Forgot a password?</b> Students should ask their teacher first. Teachers can ask their school coordinator.</li>
            <li><b>Parents</b> can ask about their child&apos;s account or progress.</li>
          </ul>
          <p className="muted small">VINC Lab · Bengaluru · <span className="mono">info@vinc-lab.com</span></p>
          <VincArt className="ct-vinc" label="Vinc waving" />
        </section>
        <section className="au-card ct-card"><div className="au-body"><ContactForm topic={topic} /></div></section>
      </main>
    </div>
  );
}
