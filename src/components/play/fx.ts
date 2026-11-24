'use client';
/**
 * Game sound effects (made with Web Audio, so there are no sound files to download),
 * spoken narration (the browser's built-in speech), and progress saved in this browser for players who are not logged in.
 * Every storage access is wrapped: private windows and blocked storage just fall back to defaults.
 */

function load(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function store(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* ignore */ } }

/* ---------------- settings ---------------- */
export const settings = {
  get sound() { return load('vinc-sound') !== 'off'; },
  set sound(on: boolean) { store('vinc-sound', on ? 'on' : 'off'); },
  get music() { return load('vinc-music') !== 'off'; },
  set music(on: boolean) { store('vinc-music', on ? 'on' : 'off'); },
  get voice() { return load('vinc-voice') !== 'off'; },
  set voice(on: boolean) { store('vinc-voice', on ? 'on' : 'off'); if (!on) stopSpeaking(); }
};

/* ---------------- sound effects ---------------- */
let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) { const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!C) return null; ctx = new C(); }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function tone(freq: number, at: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slide?: number) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
export type Sfx = 'step' | 'turn' | 'jump' | 'spark' | 'bump' | 'win' | 'pop' | 'drop' | 'click' | 'lose';
export function sfx(kind: Sfx) {
  if (!settings.sound) return;
  switch (kind) {
    case 'step': tone(320, 0, 0.07, 'triangle', 0.08); break;
    case 'turn': tone(520, 0, 0.05, 'square', 0.04); break;
    case 'jump': tone(300, 0, 0.22, 'sine', 0.12, 700); break;
    case 'spark': tone(880, 0, 0.12, 'sine', 0.12); tone(1320, 0.08, 0.18, 'sine', 0.1); break;
    case 'bump': tone(140, 0, 0.25, 'sawtooth', 0.1, 70); break;
    case 'lose': tone(392, 0, 0.18, 'triangle', 0.1); tone(330, 0.16, 0.18, 'triangle', 0.1); tone(262, 0.32, 0.3, 'triangle', 0.1); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.22, 'triangle', 0.12)); tone(1568, 0.48, 0.4, 'sine', 0.08); break;
    case 'pop': tone(660, 0, 0.06, 'sine', 0.1, 990); break;
    case 'drop': tone(420, 0, 0.08, 'triangle', 0.1, 260); break;
    case 'click': tone(700, 0, 0.03, 'square', 0.04); break;
  }
}

/* ---------------- narration ---------------- */
let voiceCache: SpeechSynthesisVoice | null | undefined;
function pickVoice(): SpeechSynthesisVoice | null {
  if (voiceCache !== undefined) return voiceCache;
  const vs = window.speechSynthesis?.getVoices() ?? [];
  if (!vs.length) return null;
  voiceCache = vs.find(v => v.lang === 'en-IN') ?? vs.find(v => v.lang === 'en-GB') ?? vs.find(v => v.lang.startsWith('en')) ?? null;
  return voiceCache;
}
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
/** Reads text aloud (after the player has tapped something, as browsers require). Backticks and code are read as words. */
export function speak(text: string, force = false) {
  if (!canSpeak() || (!force && !settings.voice)) return;
  const s = window.speechSynthesis; s.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/`/g, '').replace(/_/g, ' ').replace(/\(\)/g, '').replace(/\(([^)]*)\)/g, ' $1'));
  const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
  u.rate = 0.95; u.pitch = 1.1;
  const tell = (on: boolean) => window.dispatchEvent(new CustomEvent('vinc-speak', { detail: on }));
  u.onstart = () => tell(true); u.onend = () => tell(false); u.onerror = () => tell(false);
  s.speak(u);
}
export function stopSpeaking() { if (canSpeak()) window.speechSynthesis.cancel(); }

/* ---------------- progress for players who are not logged in ---------------- */
export type LocalProgress = Record<string, { stars: number; code: string }>;
const KEY = 'vinc-play-progress';
export function localProgress(): LocalProgress { try { return JSON.parse(load(KEY) || '{}'); } catch { return {}; } }
export function saveLocal(id: string, stars: number, code: string) {
  const p = localProgress(), old = p[id];
  p[id] = { stars: Math.max(stars, old?.stars ?? 0), code };
  store(KEY, JSON.stringify(p));
}
export function clearLocal() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
