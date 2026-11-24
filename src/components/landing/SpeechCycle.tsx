'use client';
import { useEffect, useState } from 'react';

const LINES = [
  'Hi! Can you help me find my missing parts?',
  'I only do exactly what your code says. Even silly things!',
  'Beep-ah! A spark! Can we reach it in 5 blocks?',
  'Glitch hid a bug in my code. Will you catch it?'
];

export default function SpeechCycle() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI(n => (n + 1) % LINES.length), 3800);
    return () => clearInterval(t);
  }, []);
  return <div className="lp-speech" aria-live="off"><span key={i}>{LINES[i]}</span></div>;
}
