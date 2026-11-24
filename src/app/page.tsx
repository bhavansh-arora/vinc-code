import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import VincArt from '@/components/VincArt';
import HeroVinc3D from '@/components/landing/HeroVinc3D';
import SpeechCycle from '@/components/landing/SpeechCycle';
import CodeDemo from '@/components/landing/CodeDemo';
import Reveal from '@/components/landing/Reveal';
import PartIcon from '@/components/landing/PartIcon';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/types';
import { ASSESSMENTS } from '@/data/assessments';
import { LEVELS } from '@/lib/levels';

export const metadata: Metadata = { title: 'VINC Code · Learn to code with Vinc the robot' };

const CLASSES = [
  { n: 3, topic: 'Sequencing', blurb: 'Steps, turns and order. Kids learn that robots do exactly what they are told.', part: 'spring', partName: 'Spring legs', live: true },
  { n: 4, topic: 'Loops and jumps', blurb: 'repeat and loops inside loops turn 14 blocks into 4. Plus jump() over crates.', part: 'antenna', partName: 'Sensor antenna', live: true },
  { n: 5, topic: 'If and else', blurb: 'Vinc senses crates and walls, so one program can solve many boards.', part: 'chip', partName: 'Memory chip' },
  { n: 6, topic: 'Variables in Python', blurb: 'From blocks to typed Python: counting sparks, fuel and scores.', part: 'gear', partName: 'Gear toolbelt' },
  { n: 7, topic: 'Functions', blurb: 'Kids name their own moves, pass in numbers, and draw with code.', part: 'brain', partName: 'AI brain' },
  { n: 8, topic: 'Events, lists and AI', blurb: 'Train Vinc to sort waste, spot bad data, and launch the rocket.', part: 'rocket', partName: 'Rocket boosters' }
];

const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37) % 100, delay: (i * 1.3) % 9, dur: 9 + (i % 5) * 2, size: 10 + (i % 4) * 4
}));

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const questions = ASSESSMENTS.reduce((t, a) => t + a.questions.length, 0);

  return (
    <div className="lp">
      <div className="lp-bg" aria-hidden="true">
        <span className="lp-blob a" /><span className="lp-blob b" /><span className="lp-blob c" />
        {SPARKS.map((s, i) => <span key={i} className="lp-float" style={{ left: s.left + '%', animationDelay: s.delay + 's', animationDuration: s.dur + 's', fontSize: s.size }}>✦</span>)}
      </div>

      <header className="lp-nav">
        <Link href="/" className="brand"><VincArt label="" /> VINC Code</Link>
        <nav aria-label="Sections">
          <a href="#how">How it works</a>
          <a href="#classes">Classes 3–8</a>
          <a href="#schools">For schools</a>
        </nav>
        <Link className="btn primary" href="/login">Sign in</Link>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-text">
            <div className="eyebrow lp-rise" style={{ animationDelay: '0ms' }}>By VINC Lab · Bengaluru · Classes 3 to 8</div>
            <h1 className="lp-rise" style={{ animationDelay: '80ms' }}>
              Kids learn to code by helping <em>Vinc</em> find its missing parts.
            </h1>
            <p className="lp-lede lp-rise" style={{ animationDelay: '160ms' }}>
              Vinc is a little robot built from spare parts. It does exactly what your code says, so every puzzle is a real program,
              every crash is a bug to catch, and every class finished wins Vinc a new part.
            </p>
            <div className="lp-cta lp-rise" style={{ animationDelay: '240ms' }}>
              <Link className="btn primary lp-big" href="/login">Sign in to play</Link>
              <a className="btn lp-big" href="#how">See how it works</a>
            </div>
            <ul className="lp-facts lp-rise" style={{ animationDelay: '320ms' }}>
              <li><b>{LEVELS.length}</b> playable 3D levels</li>
              <li><b>{ASSESSMENTS.length}</b> assessments, <b>{questions}</b> questions</li>
              <li><b>6</b> classes, one part each</li>
            </ul>
          </div>
          <div className="lp-hero-art">
            <div className="lp-stage" aria-hidden="true"><span className="lp-ring r1" /><span className="lp-ring r2" /><span className="lp-orbit"><i>✦</i></span></div>
            <HeroVinc3D />
            <SpeechCycle />
            <span className="lp-chip c1">step()</span>
            <span className="lp-chip c2">repeat 3:</span>
            <span className="lp-chip c3">jump()</span>
          </div>
        </section>

        <section className="lp-section" id="how">
          <Reveal>
            <div className="lp-head">
              <div className="eyebrow">How it works</div>
              <h2>Write the code. Watch Vinc run it.</h2>
              <p>Children drag blocks or type Python. Vinc follows every line in a 3D workshop, so they see exactly what their code does.</p>
            </div>
          </Reveal>
          <div className="lp-how">
            <Reveal><CodeDemo /></Reveal>
            <ol className="lp-steps">
              <Reveal delay={0}><li><span className="lp-num">1</span><div><h3>Build a program</h3><p>Drag step(), turnLeft(), repeat and jump() blocks into the code. Older classes type Python.</p></div></li></Reveal>
              <Reveal delay={120}><li><span className="lp-num">2</span><div><h3>Run it and debug</h3><p>Vinc runs one line at a time. Crash into a crate and Glitch the beetle pops out to show the bug.</p></div></li></Reveal>
              <Reveal delay={240}><li><span className="lp-num">3</span><div><h3>Win stars, sparks and parts</h3><p>Fewer blocks earn more stars. Sparks buy paint jobs and hats. Finishing a class wins Vinc a new part.</p></div></li></Reveal>
            </ol>
          </div>
        </section>

        <section className="lp-section" id="classes">
          <Reveal>
            <div className="lp-head">
              <div className="eyebrow">Classes 3 to 8</div>
              <h2>One coding idea a year, and a new part to win.</h2>
              <p>Each class has at least 15 activities: puzzles, Glitch debug levels, challenges, offline classroom games and lab sessions with a real robot.</p>
            </div>
          </Reveal>
          <div className="lp-classes">
            {CLASSES.map((c, i) => (
              <Reveal key={c.n} delay={i * 80}>
                <article className="lp-class">
                  <div className="lp-class-top">
                    <span className="lp-class-n">Class {c.n}</span>
                    <span className={'badge ' + (c.live ? 'good' : 'plain')}>{c.live ? 'Playable now' : 'Coming soon'}</span>
                  </div>
                  <h3>{c.topic}</h3>
                  <p>{c.blurb}</p>
                  <div className="lp-class-part"><PartIcon id={c.part} /><span>Wins: <b>{c.partName}</b></span></div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="lp-section" id="schools">
          <Reveal>
            <div className="lp-head">
              <div className="eyebrow">For everyone in the classroom</div>
              <h2>Made for students, teachers and schools.</h2>
            </div>
          </Reveal>
          <div className="lp-roles">
            <Reveal delay={0}><div className="lp-role"><span className="lp-role-tag" style={{ background: 'var(--amber)' }}>Students</span>
              <ul><li>30 levels in a 3D workshop</li><li>Stars, sparks, hats and paint jobs</li><li>Short quizzes with explanations for every answer</li><li>Progress saved to their own account</li></ul></div></Reveal>
            <Reveal delay={120}><div className="lp-role"><span className="lp-role-tag" style={{ background: 'var(--teal)' }}>Teachers</span>
              <ul><li>Add a whole class in a minute</li><li>Print login cards, reset passwords</li><li>Assign class-wise assessments</li><li>See results question by question</li></ul></div></Reveal>
            <Reveal delay={240}><div className="lp-role"><span className="lp-role-tag" style={{ background: 'var(--plum)' }}>Schools</span>
              <ul><li>Manage teachers and sections</li><li>See every class at a glance</li><li>Two auto-graded assessments per class</li><li>Hands-on robotics at VINC Lab</li></ul></div></Reveal>
          </div>
          <Reveal>
            <div className="lp-safe">
              <svg className="lp-shield" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L20 5 V11 C20 16.5 16.6 20.6 12 22 C7.4 20.6 4 16.5 4 11 V5 Z" className="f-teal" /><path d="M8.5 12 L11 14.5 L15.5 9.5" fill="none" stroke="#FFF7EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <p><b>Built for children.</b> No ads, no chat, and no email addresses for students. Children sign in with a username and password from their teacher, and only their own school can see their work.</p>
            </div>
          </Reveal>
        </section>

        <section className="lp-final">
          <Reveal>
            <div className="lp-final-inner">
              <VincArt className="lp-final-vinc" label="Vinc" />
              <div>
                <h2>Bring VINC Code to your school.</h2>
                <p>VINC Lab sets up your school, teachers and classes, and runs hands-on robotics sessions with the real Vinc.</p>
                <div className="lp-cta">
                  <a className="btn primary lp-big" href="https://vinc-lab.com" target="_blank" rel="noopener">Contact VINC Lab</a>
                  <Link className="btn lp-big lp-light" href="/login">Already set up? Sign in</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="lp-footer">
        <span>© VINC DEEPTECH PVT. LTD. · VINC Lab, Bengaluru</span>
        <a href="https://vinc-lab.com" target="_blank" rel="noopener">vinc-lab.com</a>
      </footer>
    </div>
  );
}
