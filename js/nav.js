(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  // Shrink the nav bar slightly once the page has scrolled.
  let ticking = false;
  function updateScrolled() {
    nav.classList.toggle('scrolled', window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrolled);
    }
  }, { passive: true });
  updateScrolled();

  // Mobile drop-down menu.
  const toggle = nav.querySelector('.menu-toggle');
  const links = nav.querySelector('.nav-links');
  if (!toggle || !links) return;

  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.matchMedia('(min-width: 761px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
})();
