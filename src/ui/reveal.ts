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
