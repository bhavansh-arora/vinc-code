import Link from 'next/link';
import VincArt from '@/components/VincArt';
import HeroVinc3D from '@/components/landing/HeroVinc3D';
import AuthPanel from './AuthPanel';

/** The split login / sign-up page: Vinc and what VINC Code offers on the left, the form card on the right. */
export default function AuthShell({ tab, role, schoolId, signedIn }: { tab: 'login' | 'signup'; role?: string; schoolId?: string; signedIn?: { name: string; home: string } }) {
  return (
    <div className="au">
      <section className="au-side">
        <Link href="/" className="brand au-logo"><VincArt label="" /> VINC Code</Link>
        <div className="au-stage" aria-hidden="false">
          <span className="au-blob b1" aria-hidden="true" /><span className="au-blob b2" aria-hidden="true" /><span className="au-blob b3" aria-hidden="true" />
          <div className="au-vinc"><HeroVinc3D /></div>
          <figure className="au-float f1" aria-hidden="true"><span className="au-float-code">repeat 3:<br />&nbsp;&nbsp;step()</span><figcaption>Class 4 · Loops</figcaption></figure>
          <figure className="au-float f2" aria-hidden="true"><span className="au-float-stars">★★★</span><figcaption>Crate maze · 10 blocks</figcaption></figure>
          <figure className="au-float f3" aria-hidden="true"><span className="au-float-part">✦ Spring legs</span><figcaption>New part unlocked!</figcaption></figure>
        </div>
        <div className="au-copy">
          <p className="eyebrow">VINC Code · Classes 3 to 8</p>
          <h2>Learn by coding. See the progress in one place.</h2>
          <ul>
            <li><span>★</span> Coding puzzles, stars and quizzes for students</li>
            <li><span>⌂</span> Progress and results for parents</li>
            <li><span>✓</span> Class lists, login cards and marking for teachers</li>
          </ul>
        </div>
      </section>
      <main className="au-main">
        <AuthPanel initialTab={tab} initialRole={role} schoolId={schoolId} signedIn={signedIn} />
        <p className="au-foot"><Link href="/">← Back to VINC Code</Link><span>Need help? Contact <a href="https://vinc-lab.com" target="_blank" rel="noopener">VINC Lab</a></span></p>
      </main>
    </div>
  );
}
