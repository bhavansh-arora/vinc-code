/**
 * Lists every fixed line the game reads aloud, with who says it, for scripts/voice-render.py.
 * Run with `npm run voice` (see README: Recorded voices).
 */
const { CHAPTERS, playLevel } = await import('../src/data/play');
const { PROLOGUE, CHAPTER_STORIES } = await import('../src/data/stories');
const { VOICES, voiceKey, speechText, WIN_CHEERS, winLine } = await import('../src/lib/voice');
type Speaker = keyof typeof VOICES;

const lines = new Map<string, { key: string; text: string; voice: string; lang: string; speed: number; who: string }>();
const add = (text: string | undefined, who: Speaker) => {
  if (!text || !speechText(text)) return;
  const key = voiceKey(text, who), v = VOICES[who];
  lines.set(key, { key, text: speechText(text), voice: v.voice, lang: v.lang, speed: v.speed, who });
};

for (const ch of CHAPTERS) for (const id of ch.levels) {
  const p = playLevel(id)!;
  if (p.kind === 'junior') {
    const l = p.lesson, tutor = (l.guide ?? (l.type === 'Catch Glitch' ? 'glitch' : ch.tutor)) as Speaker;
    add(`${l.intro} ${l.task}`, tutor); l.hints.forEach(h => add(h, tutor));
  } else if (p.kind === 'python') {
    const l = p.lesson, tutor = (l.guide ?? (l.type === 'Catch Glitch' ? 'glitch' : ch.tutor)) as Speaker;
    add(l.intro, tutor); add(`${l.intro} ${l.task}`, tutor); l.hints.forEach(h => add(h, tutor));
  } else {
    const l = p.level, tutor = l.tutor as Speaker;
    add(l.say, tutor); add(`${l.say} ${l.goal}`, tutor); l.hints.forEach(h => add(h, tutor));
  }
}
for (const s of [PROLOGUE, ...Object.values(CHAPTER_STORIES)]) for (const sc of s.scenes) add(sc.caption, (sc.speaker ?? 'narrator') as Speaker);
for (const c of WIN_CHEERS) for (const n of [1, 2, 3]) add(winLine(c, n), 'narrator');
// Common results Glitch reads out in the Junior game.
['Vinc bumped into a crate!', 'Vinc bumped into the edge of the board!', 'Vinc jumped right off the board!', 'Vinc landed on a crate!', 'Not yet. Try again!', 'Not yet!',
  'Use a repeat block.', 'Use a jump() block.', 'Add some blocks first!', 'Vinc got tired after 400 moves.', 'Not quite. The program should print:'].forEach(t => add(t, 'glitch'));
for (let total = 1; total <= 8; total++) for (let got = 0; got < total; got++) add(`Vinc stopped with ${got} of ${total} sparks.`, 'glitch');

if (process.argv.includes('--check')) {
  const fs = await import('node:fs'), path = await import('node:path');
  const file = path.join(import.meta.dirname, '..', 'public', 'voice', 'manifest.json');
  const have = new Set<string>(fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : []);
  const missing = [...lines.values()].filter(l => !have.has(l.key));
  console.log(missing.length ? `${missing.length} of ${lines.size} lines have no recording yet. Run npm run voice.` : `All ${lines.size} lines have a natural recorded voice.`);
  missing.slice(0, 5).forEach(l => console.log('  -', l.who + ':', l.text.slice(0, 70)));
  process.exit(missing.length ? 1 : 0);
}
process.stdout.write(JSON.stringify([...lines.values()], null, 0));
console.error(`${lines.size} lines`);
