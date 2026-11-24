'use client';
import { useEffect, useRef } from 'react';

/** Fades children up as they scroll into view. Content is visible without JavaScript and for reduced motion. */
export default function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) return; // already on screen: leave it alone
    el.classList.add('lp-hidden');
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { el.style.transitionDelay = delay + 'ms'; el.classList.remove('lp-hidden'); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <div ref={ref} className={'lp-reveal ' + className}>{children}</div>;
}
