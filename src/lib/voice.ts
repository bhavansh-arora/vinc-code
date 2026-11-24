/**
 * Natural recorded voices. Fixed lines (stories, level intros, tasks, hints, common results) are pre-recorded with a
 * neural voice model (Kokoro, Apache-2.0) by `npm run voice`, one voice per character, into public/voice/<key>.mp3.
 * The browser looks a line up by its key; lines that were not recorded fall back to the device's best voice.
 * Shared by the browser (src/components/play/fx.ts) and the recording script (scripts/voice-lines.mts).
 */
import type { CharId } from './crew';

export type Speaker = CharId | 'narrator';
/** Kokoro voice and speed for each speaker. */
export const VOICES: Record<Speaker, { voice: string; lang: 'en-us' | 'en-gb'; speed: number }> = {
  narrator: { voice: 'af_heart', lang: 'en-us', speed: 0.95 },
  vinc: { voice: 'am_puck', lang: 'en-us', speed: 1.0 },
  glitch: { voice: 'am_fenrir', lang: 'en-us', speed: 1.08 },
  pip: { voice: 'af_heart', lang: 'en-us', speed: 1.0 },
  loopa: { voice: 'bf_emma', lang: 'en-gb', speed: 0.95 },
  hoot: { voice: 'bm_george', lang: 'en-gb', speed: 0.95 },
  pocket: { voice: 'af_bella', lang: 'en-us', speed: 1.0 },
  tadka: { voice: 'bm_lewis', lang: 'en-gb', speed: 0.95 },
  nova: { voice: 'af_nicole', lang: 'en-us', speed: 0.95 }
};

/** What is actually said: code marks removed, so `turn_left()` is read as "turn left". */
export function speechText(t: string) {
  return t.replace(/`/g, '').replace(/_/g, ' ').replace(/\(\)/g, '').replace(/\(([^)]*)\)/g, ' $1').replace(/\s+/g, ' ').trim();
}

/** A short, stable key for a line in a speaker's voice (FNV-1a). */
export function voiceKey(text: string, who: Speaker = 'narrator') {
  const s = VOICES[who].voice + '|' + speechText(text);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

/** Win cheers (spoken as "<cheer> <n> stars!"). */
export const WIN_CHEERS = ['Brilliant!', 'You did it!', 'Super coder!', 'Amazing!', 'Fantastic!'];
export const winLine = (cheer: string, stars: number) => `${cheer} ${stars} ${stars === 1 ? 'star' : 'stars'}!`;
