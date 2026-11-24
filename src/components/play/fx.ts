'use client';
import { speechText, voiceKey, type Speaker } from '@/lib/voice';
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
// 1. Recorded natural voices (public/voice, made by `npm run voice`), one voice per character.
// 2. Otherwise the most natural voice this device has (neural / "Natural" / premium voices first).
let manifest: Set<string> | null = null;
function loadManifest() {
  if (manifest || typeof window === 'undefined') return;
  manifest = new Set();
  fetch('/voice/manifest.json').then(r => (r.ok ? r.json() : [])).then((keys: string[]) => { keys.forEach(k => manifest!.add(k)); }).catch(() => {});
}
if (typeof window !== 'undefined') loadManifest();

let voiceCache: SpeechSynthesisVoice | null | undefined;
function voiceScore(v: SpeechSynthesisVoice) {
  const n = v.name;
  let s = 0;
  if (!v.lang.toLowerCase().startsWith('en')) return -1000;
  if (/natural|neural/i.test(n)) s += 100;
  if (/premium|enhanced/i.test(n)) s += 60;
  if (/google/i.test(n)) s += 45;
  if (/online/i.test(n)) s += 25;
  if (/samantha|ava|allison|serena|daniel|karen|moira|tessa|zoe|evan|nathan|libby|sonia|neerja|prabhat|aria|jenny|guy/i.test(n)) s += 30;
  if (/espeak|robot|zira|david|mark|hazel|fred|albert|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|junior|ralph|kathy|princess/i.test(n)) s -= 80;
  if (/en-IN/i.test(v.lang)) s += 12; else if (/en-GB|en-US/i.test(v.lang)) s += 8;
  if (v.localService === false) s += 5;
  return s;
}
function pickVoice(): SpeechSynthesisVoice | null {
  if (voiceCache) return voiceCache;
  const vs = window.speechSynthesis?.getVoices() ?? [];
  if (!vs.length) return null;
  voiceCache = [...vs].sort((a, b) => voiceScore(b) - voiceScore(a))[0] ?? null;
  return voiceCache;
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.addEventListener?.('voiceschanged', () => { voiceCache = undefined; });

export const canSpeak = () => typeof window !== 'undefined' && ('speechSynthesis' in window || typeof Audio !== 'undefined');
const tell = (on: boolean) => window.dispatchEvent(new CustomEvent('vinc-speak', { detail: on }));
let clip: HTMLAudioElement | null = null;

/** Reads a line aloud in a character's voice (after the player has tapped something, as browsers require). */
export function speak(text: string, force = false, who: Speaker = 'narrator') {
  if (typeof window === 'undefined' || (!force && !settings.voice)) return;
  stopSpeaking();
  const key = voiceKey(text, who);
  if (manifest?.has(key)) {
    clip = new Audio(`/voice/${key}.mp3`);
    clip.onplay = () => tell(true); clip.onended = () => tell(false); clip.onerror = () => { tell(false); device(text); };
    clip.play().catch(() => device(text));
    return;
  }
  device(text);
}
function device(text: string) {
  if (!('speechSynthesis' in window)) return;
  const s = window.speechSynthesis; s.cancel();
  const u = new SpeechSynthesisUtterance(speechText(text));
  const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
  u.rate = 0.98; u.pitch = 1;
  u.onstart = () => tell(true); u.onend = () => tell(false); u.onerror = () => tell(false);
  s.speak(u);
}
export function stopSpeaking() {
  if (typeof window === 'undefined') return;
  if (clip) { clip.pause(); clip = null; tell(false); }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

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
