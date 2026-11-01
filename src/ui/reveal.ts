/** Scroll reveals: elements with data-reveal rise into place once, when they first enter the viewport. Skipped under
 *  reduced motion and when IntersectionObserver is missing (the CSS only hides them under html.ts-js). */
import { useEffect, type RefObject } from 'react';

export function useReveal(root: RefObject<HTMLElement | null>, dep: unknown = null) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = [...el.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)')];
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((i) => i.classList.add('is-in'));
      return;
    }
    document.documentElement.classList.add('ts-js');
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }),
      { root: el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY !== 'visible' ? el : null, threshold: 0.12 },
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root, dep]);
}

/** Scroll stage for a scroll container: writes --sy (pixels scrolled) and --sp (0..1 progress) on the root for
 *  parallax and the progress bar, and counts [data-count] figures up from 0 when they first enter. Nothing moves
 *  under reduced motion: the figures print their final value and the variables stay at 0. */
export function useScrollStage(root: RefObject<HTMLElement | null>, dep: unknown = null) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const write = () => {
      raf = 0;
      const max = el.scrollHeight - el.clientHeight || 1;
      el.style.setProperty('--sy', String(el.scrollTop));
      el.style.setProperty('--sp', (el.scrollTop / max).toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(write); };
    el.addEventListener('scroll', onScroll, { passive: true });
    write();
    const counts = [...el.querySelectorAll<HTMLElement>('[data-count]')];
    const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io?.unobserve(en.target);
      const t = en.target as HTMLElement, end = Number(t.textContent);
      if (!Number.isFinite(end) || end <= 0) return;
      const t0 = performance.now(), dur = 1100;
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        t.textContent = String(Math.round(end * e));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { root: el, threshold: 0.6 }) : null;
    counts.forEach((c) => io?.observe(c));
    return () => { el.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); io?.disconnect(); };
  }, [root, dep]);
}
