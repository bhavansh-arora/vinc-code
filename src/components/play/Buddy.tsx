'use client';
import { useEffect, useRef, useState } from 'react';
import CrewArt from '@/components/CrewArt';
import type { CharId } from '@/lib/crew';

export type BuddyEvent = 'start' | 'spark' | 'bump' | 'win' | 'fail' | 'error' | 'idle' | 'hint' | 'hello';

const LINES: Record<BuddyEvent, string[]> = {
  hello: ['Ready when you are!', 'Let’s do this!', 'I believe in you!'],
  start: ['Here we go!', 'Rolling out!', 'Fingers crossed!', 'Vinc, do your thing!', 'Wheee!'],
  spark: ['Shiny!', 'Ka-ching!', 'Sparkle get!', 'Ooh, warm and glowy!', 'One more for the collection!'],
  bump: ['Bonk! That crate did not move.', 'Ouch! Good thing Vinc has a metal nose.', 'Oops! Vinc is seeing stars.', 'Crash! Glitch is giggling somewhere.', 'Boing! Wrong way!'],
  win: ['Woohoo! Dance party!', 'You are a coding superstar!', 'Vinc is doing the robot dance!', 'Nailed it!', 'High five! ✋'],
  fail: ['So close! Let’s fix it.', 'Every coder makes bugs. Let’s squash this one!', 'Hmm, let’s read the code again.', 'Almost! Try one small change.'],
  error: ['Uh-oh, the computer is confused.', 'A tiny typo can trip up a robot!', 'Look at the red line. The clue is there!'],
  idle: ['Psst… the 💡 button has hints!', 'Take your time. Vinc is having a snack.', 'Try running it to see what happens!', 'I am counting sparks… 1, 2, lots!'],
  hint: ['Here is a clue!', 'Detective mode: on!', 'Let me help!']
};
const SPECIAL: Partial<Record<CharId, Partial<Record<BuddyEvent, string[]>>>> = {
  glitch: { fail: ['Hee hee hee! Gotcha!', 'My bug is still in there! Hee hee!'], win: ['Nooo! You found my bug!', 'Hmph. You are too good at this.'], bump: ['Hee hee! Bonk!'] },
  tadka: { win: ['Perfectly cooked!', 'Chef’s kiss! 👨‍🍳'], fail: ['Needs a little more masala!'], spark: ['Ooh, a tasty spark!'] },
  pocket: { spark: ['Into my pouch!', 'Counted and stored!'], win: ['I saved that win in a variable!'] },
  hoot: { bump: ['Hoo! Look before you leap!'], win: ['Hoo-ray!'], idle: ['Hoo… what does your if check?'] },
  nova: { win: ['Data says: you are brilliant!', 'Accuracy: 100%!'], idle: ['Beep. Thinking…'] },
  loopa: { win: ['Again! Again! Again!'], spark: ['Round and round, sparks found!'] },
  pip: { win: ['Bzzz! Brilliant!'], spark: ['My light found it!'] },
  vinc: { bump: ['Owie! My antenna!'], win: ['Beep boop! I did it!'] }
};
const MOVE: Record<BuddyEvent, string> = { hello: 'wave', start: 'hop', spark: 'spin', bump: 'shake', win: 'dance', fail: 'droop', error: 'shake', idle: 'wave', hint: 'hop' };

/**
 * The world's tutor, peeking in from the corner of the stage and reacting to what happens.
 * Send a new `event` object (with a fresh `n`) to make it react.
 */
export default function Buddy({ who, event }: { who: CharId; event: { kind: BuddyEvent; n: number } | null }) {
  const [say, setSay] = useState<{ text: string; move: string; k: number } | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null), hide = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = useRef(0);

  useEffect(() => {
    const show = (kind: BuddyEvent) => {
      const pool = [...(SPECIAL[who]?.[kind] ?? []), ...(SPECIAL[who]?.[kind] ?? []), ...LINES[kind]];
      const text = pool[(count.current++ * 7 + kind.length) % pool.length];
      setSay({ text, move: MOVE[kind], k: count.current });
      if (hide.current) clearTimeout(hide.current);
      hide.current = setTimeout(() => setSay(s => (s ? { ...s, text: '' } : s)), kind === 'win' ? 4000 : 3200);
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => show('idle'), 28000);
    };
    show(event?.kind ?? 'hello');
    return () => { if (idle.current) clearTimeout(idle.current); };
  }, [event, who]);
  useEffect(() => () => { if (hide.current) clearTimeout(hide.current); }, []);

  return (
    <div className={'bd' + (say?.text ? ' talking' : '')} aria-live="polite">
      <div key={say?.k} className={'bd-art mv-' + (say?.move ?? 'wave')}>
        <CrewArt id={who} label="" />
        {say?.move === 'shake' && <span className="bd-dizzy" aria-hidden="true">✦ ✦ ✦</span>}
      </div>
      {say?.text && <p className="bd-bubble" key={'b' + say.k}>{say.text}</p>}
    </div>
  );
}
