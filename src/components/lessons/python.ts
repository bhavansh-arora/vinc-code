'use client';
/** Runs Python in the browser: one Pyodide Web Worker per page (public/lessons/worker.js), restarted if a run hangs. */
import { useEffect, useState } from 'react';
import type { Check } from '@/data/lessons';
import type { BoardRun } from '@/lib/blocks';

export type PyResult = { passed: boolean; missing?: string[]; runs: (BoardRun & { stdout: string })[]; stdout: string; error: string | null; line: number | null; blocks?: number };
type Result = PyResult;

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let seq = 0;
const waiting = new Map<number, (r: Result) => void>();
const listeners = new Set<(s: 'loading' | 'ready' | 'error') => void>();
let status: 'loading' | 'ready' | 'error' = 'loading';
function setStatus(s: typeof status) { status = s; listeners.forEach(f => f(s)); }

function startWorker() {
  setStatus('loading');
  worker = new Worker('/lessons/worker.js');
  ready = new Promise<void>((resolve, reject) => {
    worker!.onmessage = e => {
      const m = e.data;
      if (m.type === 'ready') { setStatus('ready'); resolve(); }
      else if (m.type === 'fatal') { setStatus('error'); reject(new Error(m.error)); }
      else if (m.type === 'result') { waiting.get(m.id)?.(m.result); waiting.delete(m.id); }
    };
    worker!.onerror = () => { setStatus('error'); reject(new Error('Python could not start.')); };
  });
  ready.catch(() => {});
}

export async function runPython(code: string, check: Check): Promise<Result> {
  if (!worker) startWorker();
  try { await ready; } catch { return { passed: false, runs: [], stdout: '', line: null, error: 'Python could not load. Check your internet connection and reload the page.' }; }
  const id = ++seq;
  return new Promise<Result>(resolve => {
    const timer = setTimeout(() => {
      waiting.delete(id); worker?.terminate(); worker = null; startWorker();
      resolve({ passed: false, runs: [], stdout: '', line: null, error: 'Your program ran for too long, so it was stopped. Is there a loop that never ends?' });
    }, 12000);
    waiting.set(id, r => { clearTimeout(timer); resolve(r); });
    worker!.postMessage({ id, code, check });
  });
}

export function usePythonStatus(enabled: boolean) {
  const [s, setS] = useState(status);
  useEffect(() => {
    if (!enabled) return;
    if (!worker) startWorker();
    setS(status); listeners.add(setS); return () => { listeners.delete(setS); };
  }, [enabled]);
  return enabled ? s : 'ready';
}

