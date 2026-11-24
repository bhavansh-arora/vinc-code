'use client';
/**
 * Background music for the game, composed live with Web Audio (no music files).
 * Each world has its own little tune: a mode, a chord loop, a melody grown from a seed, bass, chords and drums.
 * Music starts only after the player has tapped something (browsers require it) and can be switched off (🎵).
 */
import { useEffect } from 'react';
import { settings } from './fx';

type Song = {
  bpm: number; root: number; mode: number[]; prog: number[];
  /** 16-step patterns: x = play. */
  bass: string; arp: string; kick: string; snare: string; hat: string; rhythm: string[];
  lead: OscillatorType; leadDecay: number; bassWave: OscillatorType; pad?: boolean; drone?: boolean; tabla?: boolean; swing?: number; seed: number; vol: number;
};

const MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10], DORIAN = [0, 2, 3, 5, 7, 9, 10], PENTA_MIN = [0, 3, 5, 7, 10], PENTA_MAJ = [0, 2, 4, 7, 9];
const RAGA = [0, 1, 4, 5, 7, 8, 11];

export const SONGS: Record<string, Song> = {
  meadow: { bpm: 112, root: 60, mode: MAJOR, prog: [0, 4, 5, 3], bass: 'x...x...x...x.x.', arp: '..x...x...x...x.', kick: 'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.', rhythm: ['x.x.x...x.x.x...', 'x...x.x.x...x...'], lead: 'triangle', leadDecay: 0.22, bassWave: 'triangle', seed: 3, vol: 0.06 },
  orchard: { bpm: 104, root: 65, mode: MAJOR, prog: [0, 3, 4, 0], bass: 'x..x..x.x..x..x.', arp: 'x.x.x.x.x.x.x.x.', kick: 'x.....x.x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', rhythm: ['x..x..x.x.x.....', 'x.x.x.x.x...x...'], lead: 'sine', leadDecay: 0.3, bassWave: 'triangle', seed: 11, vol: 0.06 },
  hills: { bpm: 96, root: 55, mode: PENTA_MAJ, prog: [0, 3, 1, 4], bass: 'x.......x...x...', arp: 'x...x...x...x...', kick: 'x.......x.......', snare: '........x.......', hat: '....x.......x...', rhythm: ['x...x.x.x.......', 'x.x.x...x...x...'], lead: 'triangle', leadDecay: 0.35, bassWave: 'sine', pad: true, seed: 5, vol: 0.06 },
  river: { bpm: 100, root: 62, mode: MAJOR, prog: [0, 4, 5, 3], bass: 'x.....x...x.....', arp: 'xxxxxxxxxxxxxxxx', kick: 'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.', rhythm: ['x...x...x.x.x...', 'x.x...x.x...x...'], lead: 'sine', leadDecay: 0.28, bassWave: 'triangle', seed: 17, vol: 0.05 },
  beach: { bpm: 118, root: 65, mode: MAJOR, prog: [0, 3, 4, 4], bass: 'x..x..x...x..x..', arp: '..x..x....x..x..', kick: 'x..x....x..x....', snare: '....x..x....x...', hat: 'x.xxx.xxx.xxx.xx', rhythm: ['x.xx.x.x..x.x...', '..x.x.xx.x..x...'], lead: 'square', leadDecay: 0.14, bassWave: 'triangle', seed: 23, vol: 0.045 },
  lagoon: { bpm: 92, root: 57, mode: PENTA_MIN, prog: [0, 3, 2, 4], bass: 'x.......x.......', arp: 'x..x..x.x..x..x.', kick: 'x.........x.....', snare: '........x.......', hat: '..x...x...x...x.', rhythm: ['x...x...x.x.....', 'x.x...x...x.x...'], lead: 'sine', leadDecay: 0.45, bassWave: 'sine', pad: true, seed: 29, vol: 0.06 },
  jungle: { bpm: 108, root: 52, mode: PENTA_MIN, prog: [0, 2, 3, 1], bass: 'x..x..x.x..x..x.', arp: 'x.x.x.x.x.x.x.x.', kick: 'x..x..x...x.x...', snare: '....x.......x..x', hat: 'xx.xxx.xxx.xxx.x', rhythm: ['x.x.x..x.x.x....', 'x..x.x.x..x.x...'], lead: 'sine', leadDecay: 0.12, bassWave: 'triangle', seed: 31, vol: 0.055 },
  factory: { bpm: 124, root: 48, mode: MINOR, prog: [0, 5, 3, 4], bass: 'x.x.x.x.x.x.x.x.', arp: 'x.xx.x.xx.xx.x.x', kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.', rhythm: ['x.x.x.x.x...x...', 'xx..x.x.x.x.....'], lead: 'square', leadDecay: 0.1, bassWave: 'square', seed: 37, vol: 0.04 },
  canyon: { bpm: 96, root: 50, mode: DORIAN, prog: [0, 6, 3, 4], bass: 'x..x....x..x....', arp: '..x...x...x...x.', kick: 'x.......x.......', snare: '....x..x....x...', hat: 'x..x..x.x..x..x.', rhythm: ['x...x.x...x.x...', 'x.x.x...x...x...'], lead: 'sawtooth', leadDecay: 0.12, bassWave: 'triangle', seed: 41, vol: 0.04, swing: 0.12 },
  bazaar: { bpm: 110, root: 61, mode: RAGA, prog: [0, 0, 3, 4], bass: 'x.......x.......', arp: '..x...x...x...x.', kick: '................', snare: '................', hat: '................', rhythm: ['x.xx.x.xx.x.x...', 'x.x.xx.x.x..x...'], lead: 'sawtooth', leadDecay: 0.16, bassWave: 'sine', drone: true, tabla: true, seed: 43, vol: 0.04 },
  kitchen: { bpm: 128, root: 58, mode: MAJOR, prog: [0, 5, 1, 4], bass: 'x...x...x...x...', arp: '..x...x...x...x.', kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', rhythm: ['x.x.x.x.x.x.x...', 'x..xx..xx..x....'], lead: 'triangle', leadDecay: 0.12, bassWave: 'triangle', seed: 47, vol: 0.05, swing: 0.18 },
  space: { bpm: 84, root: 57, mode: MINOR, prog: [0, 5, 2, 6], bass: 'x...............', arp: 'x.x.x.x.x.x.x.x.', kick: 'x...............', snare: '................', hat: '........x.......', rhythm: ['x.......x...x...', 'x...x.......x...'], lead: 'sine', leadDecay: 0.6, bassWave: 'sine', pad: true, seed: 53, vol: 0.055 },
  story: { bpm: 100, root: 60, mode: MAJOR, prog: [0, 5, 3, 4], bass: 'x.....x.x.......', arp: 'x.x.x.x.x.x.x.x.', kick: 'x.......x.......', snare: '....x.......x...', hat: '..x...x...x...x.', rhythm: ['x.x.x...x...x...', 'x...x.x.x.x.....'], lead: 'triangle', leadDecay: 0.3, bassWave: 'triangle', pad: true, seed: 59, vol: 0.055 }
};

function rng(seed: number) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
/** An 8-bar melody (scale degrees, null = rest) grown from chord tones and small steps, so it loops nicely. */
function compose(song: Song): (number | null)[] {
  const r = rng(song.seed), out: (number | null)[] = [];
  const motifs = song.rhythm.map((rh, k) => {
    const notes: (number | null)[] = []; let d = 2 + Math.floor(r() * 3);
    for (const ch of rh) {
      if (ch !== 'x') { notes.push(null); continue; }
      const move = [-2, -1, -1, 0, 1, 1, 2, 3][Math.floor(r() * 8)];
      d = Math.max(0, Math.min(9, d + move)); notes.push(d + k);
    }
    return notes;
  });
  for (let bar = 0; bar < 8; bar++) {
    const m = motifs[(bar >> 1) % motifs.length], shift = song.prog[bar % 4];
    m.forEach(n => out.push(n === null ? null : n + (bar % 2 ? shift : 0)));
  }
  out[out.length - 16] = song.prog[3] + 4; // a little lift into the loop
  return out;
}
const freq = (song: Song, degree: number, octave = 0) => {
  const len = song.mode.length, o = Math.floor(degree / len), idx = ((degree % len) + len) % len;
  return 440 * Math.pow(2, (song.root + song.mode[idx] + 12 * (o + octave) - 69) / 12);
};

let ctx: AudioContext | null = null, master: GainNode | null = null, noise: AudioBuffer | null = null;
let timer: ReturnType<typeof setInterval> | null = null, current: string | null = null, wanted: string | null = null;
let step = 0, next = 0, melody: (number | null)[] = [];

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}
function note(t: number, f: number, dur: number, type: OscillatorType, vol: number, lp?: number) {
  const a = ctx!, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = o;
  if (lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
  node.connect(g).connect(master!); o.start(t); o.stop(t + dur + 0.05);
}
function drum(t: number, kind: 'kick' | 'snare' | 'hat' | 'dha' | 'na') {
  const a = ctx!;
  if (kind === 'kick' || kind === 'dha') {
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(kind === 'dha' ? 180 : 130, t); o.frequency.exponentialRampToValueAtTime(kind === 'dha' ? 70 : 42, t + 0.18);
    g.gain.setValueAtTime(kind === 'dha' ? 0.5 : 0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(master!); o.start(t); o.stop(t + 0.3); return;
  }
  if (kind === 'na') { note(t, 620, 0.12, 'sine', 0.25); return; }
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noise; f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
  g.gain.setValueAtTime(kind === 'hat' ? 0.12 : 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'hat' ? 0.05 : 0.14));
  s.connect(f).connect(g).connect(master!); s.start(t); s.stop(t + 0.2);
}
function tick() {
  if (!ctx || !current) return;
  const song = SONGS[current], dt = 60 / song.bpm / 4;
  while (next < ctx.currentTime + 0.15) {
    const s16 = step % 16, bar = Math.floor(step / 16) % 8, chord = song.prog[bar % 4];
    const t = next + (song.swing && s16 % 2 ? dt * song.swing : 0);
    if (song.bass[s16] === 'x') note(t, freq(song, chord, -2), dt * 3, song.bassWave, 0.32, 900);
    if (song.arp[s16] === 'x') note(t, freq(song, chord + [0, 2, 4, 2][s16 % 4]), dt * 1.6, 'sine', 0.08);
    const m = melody[step % melody.length];
    if (m !== null && m !== undefined) note(t, freq(song, m, 1), song.leadDecay + dt, song.lead, song.lead === 'square' || song.lead === 'sawtooth' ? 0.07 : 0.16, song.lead === 'sawtooth' ? 2400 : undefined);
    if (song.pad && s16 === 0) [0, 2, 4].forEach(k => note(t, freq(song, chord + k), dt * 15, 'sine', 0.05));
    if (song.drone && s16 % 8 === 0) { note(t, freq(song, 0, -1), dt * 9, 'sawtooth', 0.04, 600); note(t, freq(song, 4, -1), dt * 9, 'sawtooth', 0.03, 600); }
    if (song.tabla) { const tb = 'd.n.n.d.d.n.n.d.'[s16]; if (tb === 'd') drum(t, 'dha'); else if (tb === 'n') drum(t, 'na'); }
    if (song.kick[s16] === 'x') drum(t, 'kick');
    if (song.snare[s16] === 'x') drum(t, 'snare');
    if (song.hat[s16] === 'x') drum(t, 'hat');
    next += dt; step++;
  }
}

/** Play a world's tune (or keep playing it). Safe to call often; does nothing if music is off. */
export function playMusic(theme: string) {
  if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
  wanted = SONGS[theme] ? theme : 'story';
  if (!settings.music) return;
  const a = audio(); if (!a || !master) return;
  if (a.state === 'suspended') a.resume().catch(() => {});
  if (current === wanted && timer) return;
  const start = () => {
    current = wanted; melody = compose(SONGS[current!]); step = 0; next = a.currentTime + 0.1;
    master!.gain.cancelScheduledValues(a.currentTime); master!.gain.setValueAtTime(0.0001, a.currentTime);
    master!.gain.linearRampToValueAtTime(SONGS[current!].vol, a.currentTime + 1.5);
    if (!timer) timer = setInterval(tick, 40);
  };
  if (current && timer) { master.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.4); setTimeout(start, 450); } else start();
}
export function stopMusic(fade = 0.6) {
  if (!ctx || !master) return;
  master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
  master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);
  setTimeout(() => { if (timer) clearInterval(timer); timer = null; current = null; }, fade * 1000 + 50);
}
/** Quieter while someone is talking or a big moment plays. */
export function duck(on: boolean) {
  if (!ctx || !master || !current) return;
  const v = SONGS[current].vol * (on ? 0.35 : 1);
  master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.3);
}
if (typeof window !== 'undefined') window.addEventListener('vinc-speak', e => duck(!!(e as CustomEvent).detail));
export function setMusicOn(on: boolean) { settings.music = on; if (on && wanted) playMusic(wanted); else stopMusic(); }

/* ---------- React helper ---------- */
let stopTimer: ReturnType<typeof setTimeout> | null = null;
/** Plays a world's tune while the component is on screen (from the first tap, as browsers require). */
export function useMusic(theme: string) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
    const go = () => playMusic(theme);
    if (ctx && ctx.state === 'running') go();
    window.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('keydown', go, { once: true });
    return () => {
      window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go);
      stopTimer = setTimeout(() => stopMusic(), 700);
    };
  }, [theme]);
}
