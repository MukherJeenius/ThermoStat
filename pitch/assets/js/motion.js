/* Keynote motion layer (GSAP). The deck works without it: CSS transitions are the fallback. */
(() => {
  if (!window.gsap) return;
  const root = document.documentElement;
  if (root.classList.contains('embed')) return;
  gsap.registerPlugin(SplitText, DrawSVGPlugin);
  root.classList.add('gsap');

  // Split masked headline lines into words on first use (after fonts load); each word rises out of its own mask.
  const words = new Map();
  const split = slide => slide.querySelectorAll('.mask > span').forEach(line => {
    if (!words.has(line)) words.set(line, SplitText.create(line, { type: 'words', mask: 'words', wordsClass: 'w' }).words);
  });

  const delayOf = el => parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;

  document.addEventListener('deck:enter', async e => {
    const { slide, reduced } = e.detail;
    if (document.fonts && document.fonts.status !== 'loaded') { gsap.set(slide.querySelectorAll('.mask > span'), { opacity: 0 }); await document.fonts.ready; gsap.set(slide.querySelectorAll('.mask > span'), { opacity: 1 }); }
    if (!slide.classList.contains('is-active')) return;
    split(slide);
    gsap.killTweensOf(slide.querySelectorAll('.w, .draw, .frame'));
    if (reduced) {
      gsap.set(slide.querySelectorAll('.w'), { yPercent: 0, opacity: 1 });
      gsap.set(slide.querySelectorAll('.draw'), { drawSVG: '100%' });
      return;
    }
    // Headline words: staggered masked rise.
    slide.querySelectorAll('.mask > span').forEach(line => {
      gsap.fromTo(words.get(line) || [], { yPercent: 118, rotate: 2 },
        { yPercent: 0, rotate: 0, duration: 1.25, ease: 'expo.out', stagger: 0.06, delay: delayOf(line) });
    });
    // Heat lines and rings: drawn on with a slow in-out.
    slide.querySelectorAll('.draw').forEach(p => {
      const dur = parseFloat(getComputedStyle(p).getPropertyValue('--dur')) || 2.2;
      gsap.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'power2.inOut', delay: delayOf(p) });
    });
    // A slow settle of the whole frame (subtle depth on every cut).
    gsap.fromTo(slide.querySelector('.frame'), { scale: 1.03, filter: 'blur(10px)' },
      { scale: 1, filter: 'blur(0px)', duration: 1.3, ease: 'expo.out', clearProps: 'transform,filter' });
  });
})();
