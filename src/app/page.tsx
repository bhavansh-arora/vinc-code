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
import { LESSONS } from '@/data/lessons';
import { CREW } from '@/lib/crew';
import { RANKS } from '@/lib/xp';
import CrewArt from '@/components/CrewArt';
import CountUp from '@/components/landing/CountUp';
import LessonDemo from '@/components/landing/LessonDemo';
import Deco3D from '@/components/landing/Deco3D';
import { TrailerButton } from '@/components/play/Cutscene';

export const metadata: Metadata = { title: 'VINC Code · Learn to code with Vinc the robot' };

const CLASSES = [
  { n: 3, topic: 'Sequencing', blurb: 'Steps, turns and order. Kids learn that robots do exactly what they are told.', part: 'spring', partName: 'Spring legs', live: true },
  { n: 4, topic: 'Loops and jumps', blurb: 'repeat and loops inside loops turn 14 blocks into 4. Plus jump() over crates.', part: 'antenna', partName: 'Sensor antenna', live: true },
  { n: 5, topic: 'If and else', blurb: 'Vinc gets sensors. One Python program has to solve many different boards.', part: 'chip', partName: 'Memory chip', live: true },
  { n: 6, topic: 'Variables in Python', blurb: 'From blocks to typed Python: counting sparks, fuel and scores.', part: 'gear', partName: 'Gear toolbelt', live: true },
  { n: 7, topic: 'Functions', blurb: 'Kids build their own moves like stair() and walk(n), with parameters and return.', part: 'brain', partName: 'AI brain', live: true },
  { n: 8, topic: 'Events, lists and AI', blurb: 'Train Vinc to sort waste, spot bad data, and launch the rocket.', part: 'rocket', partName: 'Rocket boosters', live: true }
];

const TICKER = ['step()', 'turnLeft()', 'repeat 4:', 'jump()', 'if blocked():', 'else:', 'while not at_spark():', 'score = score + 1', 'input()', 'def walk(n):', 'return', 'for part in parts:', 'on_key(key)', 'training data', 'accuracy', 'debugging'];
const FAQ = [
  ['Does my child need to know how to type?', 'No. Classes 3 and 4 snap blocks together by tapping or dragging. Typing starts in Class 5, one line at a time, with buttons that insert the code.'],
  ['Is it real coding?', 'Yes. Blocks are real programs with sequences, loops and jumps, and from Class 5 students write real Python that runs in the browser. Every lesson is checked automatically.'],
  ['What does a student need?', 'Any laptop, Chromebook or tablet with a modern browser. Nothing to install. The 3D board falls back to a flat board on older devices.'],
  ['How do teachers track progress?', 'Teachers see each student\'s lessons, stars, game levels and assessment scores, question by question. They can assign assessments and reset passwords.'],
  ['Is it safe for children?', 'Students have no email address, chat or ads. They sign in with a username from their school, and only their school and linked parents can see their work.'],
  ['How does a school join?', 'Contact VINC Lab. We send a School ID by email; the school registers, then shares joining codes with its teachers and students.']
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
          <a href="#crew">The crew</a>
          <a href="#schools">For schools</a>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link className="btn quiet" href="/login">Log in</Link>
        <Link className="btn primary" href="/play">▶ Play now</Link>
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
              <Link className="btn primary lp-big lp-play" href="/play">▶ Start playing</Link>
              <TrailerButton className="btn lp-big lp-trailer" />
              <Link className="btn lp-big" href="/signup">Create an account</Link>
            </div>
            <p className="lp-free lp-rise" style={{ animationDelay: '280ms' }}>Free to play, no login needed. Log in to save stars to your account.</p>
            <ul className="lp-facts lp-rise" style={{ animationDelay: '320ms' }}>
              <li><b>{LEVELS.length}</b> playable 3D levels</li>
              <li><b>{ASSESSMENTS.length}</b> assessments, <b>{questions}</b> questions</li>
              <li><b>{LESSONS.length}</b> block and Python lessons</li>
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

        <div className="lp-ticker" aria-hidden="true"><div className="lp-ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}
        </div></div>

        <section className="lp-numbers" aria-label="VINC Code in numbers">
          {[[LESSONS.length, 'lessons'], [LEVELS.length, '3D game levels'], [ASSESSMENTS.length, 'assessments'], [questions, 'quiz questions'], [CREW.length, 'characters'], [6, 'classes']].map(([n, l]) => (
            <div key={l as string} className="lp-stat"><b><CountUp to={n as number} /></b><span>{l}</span></div>
          ))}
        </section>

        <section className="lp-section" id="how">
          <div className="lp-headrow"><Reveal>
            <div className="lp-head">
              <div className="eyebrow">How it works</div>
              <h2>Write the code. Watch Vinc run it.</h2>
              <p>Children drag blocks or type Python. Vinc follows every line in a 3D workshop, so they see exactly what their code does.</p>
            </div>
          </Reveal><Deco3D kind="cube" /></div>
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
          <div className="lp-headrow"><Reveal>
            <div className="lp-head">
              <div className="eyebrow">Classes 3 to 8</div>
              <h2>One coding idea a year, and a new part to win.</h2>
              <p>Each class has at least 15 activities: puzzles, Glitch debug levels, challenges, offline classroom games and lab sessions with a real robot.</p>
            </div>
          </Reveal><Deco3D kind="stairs" /></div>
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
                  <div className="lp-class-buddy"><CrewArt id={CREW.find(m => m.joins === c.n)!.id} className="lp-class-crew" label="" /><span>New friend: <b>{CREW.find(m => m.joins === c.n)!.name}</b> · {CREW.find(m => m.joins === c.n)!.idea}</span></div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="lp-section" id="lessons">
          <div className="lp-split">
            <Reveal>
              <div className="lp-head" style={{ marginBottom: 0 }}>
                <div className="eyebrow">Inside a lesson</div>
                <h2>Snap blocks. Press Run. Watch it happen in 3D.</h2>
                <p>Every lesson has a short explanation from one of Vinc&apos;s friends, an example, a task and hints. Students build the program, press Run and watch Vinc follow it on a real 3D board, one glowing block at a time.</p>
                <ul className="lp-ticks">
                  <li>Classes 3 and 4 drag and tap blocks: steps, turns, loops and jumps</li>
                  <li>Classes 5 to 8 write real Python that runs in the browser</li>
                  <li>Fewer blocks or fewer hints earn more stars</li>
                  <li>Every bump shows exactly which block went wrong</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}><LessonDemo /></Reveal>
          </div>
        </section>

        <section className="lp-section" id="crew">
          <div className="lp-headrow"><Reveal>
            <div className="lp-head">
              <div className="eyebrow">Meet the crew</div>
              <h2>A new friend joins every class.</h2>
              <p>The cast grows as children do. Each friend stands for one big coding idea and explains it in the lessons. Hover or tap a card to meet them.</p>
            </div>
          </Reveal><Deco3D kind="orbit" /></div>
          <div className="lp-crew">
            {CREW.map((c, i) => (
              <Reveal key={c.id} delay={i * 70}>
                <div className="lp-flip" tabIndex={0} style={{ ['--c' as string]: c.color }}>
                  <div className="lp-flip-in">
                    <div className="lp-flip-f">
                      <span className="lp-joins">{c.joins ? `Joins in Class ${c.joins}` : 'From day one'}</span>
                      <CrewArt id={c.id} className="lp-crew-art" label={c.name} />
                      <b>{c.name}</b><span className="small muted">the {c.what}</span>
                    </div>
                    <div className="lp-flip-b">
                      <span className="lp-joins">{c.idea}</span>
                      <p>{c.bio}</p>
                      <q>{c.line}</q>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="lp-section" id="ranks">
          <div className="lp-split">
            <Reveal>
              <div className="lp-head" style={{ marginBottom: 0 }}>
                <div className="eyebrow">Stars, XP and ranks</div>
                <h2>Every lesson levels you up.</h2>
                <p>Lessons earn up to three stars and XP. Boss lessons earn the most. As XP grows, students climb from Spark Rookie to Vinc Legend, and a celebration with the crew marks every lesson they finish.</p>
              <Deco3D kind="coin" /></div>
            </Reveal>
            <Reveal delay={120}>
              <ol className="lp-ladder">
                {RANKS.slice().reverse().map((r, i) => (
                  <li key={r.name} style={{ ['--w' as string]: `${100 - i * 6}%` }}><span className="lp-ladder-ico" aria-hidden="true">{r.icon}</span><b>{r.name}</b><span className="mono small">{r.xp} XP</span></li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        <section className="lp-section" id="schools">
          <div className="lp-headrow"><Reveal>
            <div className="lp-head">
              <div className="eyebrow">For everyone in the classroom</div>
              <h2>Made for students, teachers and schools.</h2>
            </div>
          </Reveal><Deco3D kind="blocks" /></div>
          <div className="lp-roles">
            <Reveal delay={0}><div className="lp-role"><span className="lp-role-tag" style={{ background: 'var(--amber)' }}>Students</span>
              <ul><li>{LESSONS.length} lessons and {LEVELS.length} levels in 3D</li><li>Stars, XP, ranks, hats and paint jobs</li><li>Short quizzes with explanations for every answer</li><li>Progress saved to their own account</li></ul></div></Reveal>
            <Reveal delay={120}><div className="lp-role"><span className="lp-role-tag" style={{ background: 'var(--teal)' }}>Teachers</span>
              <ul><li>Add a whole class in a minute</li><li>Print login cards, reset passwords</li><li>Assign class-wise assessments</li><li>See results question by question</li></ul></div></Reveal>
            <Reveal delay={240}><div className="lp-role"><span className="lp-role-tag" style={{ background: 'var(--plum)' }}>Schools</span>
              <ul><li>Manage teachers and sections</li><li>See every class at a glance</li><li>Three auto-graded assessments per class</li><li>Hands-on robotics at VINC Lab</li></ul></div></Reveal>
          </div>
          <Reveal>
            <div className="lp-safe">
              <svg className="lp-shield" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L20 5 V11 C20 16.5 16.6 20.6 12 22 C7.4 20.6 4 16.5 4 11 V5 Z" className="f-teal" /><path d="M8.5 12 L11 14.5 L15.5 9.5" fill="none" stroke="#FFF7EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <p><b>Built for children.</b> No ads, no chat, and no email addresses for students. Children sign in with a username and password from their teacher, and only their own school can see their work.</p>
            </div>
          </Reveal>
        </section>

        <section className="lp-section" id="faq">
          <div className="lp-headrow"><Reveal><div className="lp-head"><div className="eyebrow">Questions from parents and schools</div><h2>Good to know</h2></div></Reveal><Deco3D kind="question" /></div>
          <div className="lp-faq">
            {FAQ.map(([q, a], i) => (
              <Reveal key={q} delay={i * 60}><details><summary>{q}</summary><p>{a}</p></details></Reveal>
            ))}
          </div>
        </section>

        <section className="lp-final">
          <Reveal>
            <div className="lp-final-inner">
              <VincArt className="lp-final-vinc" label="Vinc" />
              <div>
                <h2>Bring VINC Code to your school.</h2>
                <p>VINC Lab sets up your school, teachers and classes, and runs hands-on robotics sessions with the real Vinc.</p>
                <div className="lp-cta">
                  <Link className="btn primary lp-big" href="/contact?topic=school">Contact VINC Lab</Link>
                  <Link className="btn lp-big lp-light" href="/signup?role=school">Have a School ID? Register</Link>
                </div>
              </div>
            <Deco3D kind="gears" />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="lp-footer">
        <span>© VINC DEEPTECH PVT. LTD. · VINC Lab, Bengaluru</span>
        <span><Link href="/contact">Contact us</Link> · <a href="https://vinc-lab.com" target="_blank" rel="noopener">vinc-lab.com</a></span>
      </footer>
    </div>
  );
}
