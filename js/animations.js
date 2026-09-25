(function () {
  const targets = document.querySelectorAll('.section-head, .feature-card, .step, .band-inner, .step-card');
  const lines = document.querySelectorAll('.steps');
  if (!targets.length && !lines.length) return;

  if (!('IntersectionObserver' in window)) return;

  // Only hide elements once we know we can reveal them again.
  targets.forEach((el) => el.classList.add('reveal'));
  lines.forEach((el) => el.classList.add('line-reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      // Stagger whatever enters the viewport together, so a row of three
      // cascades on desktop and a single-column card on a phone isn't delayed.
      let batch = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains('reveal')) {
          el.style.transitionDelay = `${Math.min(batch, 4) * 70}ms`;
          batch++;
        }
        el.classList.add('visible');
        el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
        observer.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  targets.forEach((el) => observer.observe(el));
  lines.forEach((el) => observer.observe(el));
})();
