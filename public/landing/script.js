function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  navLinks.classList.toggle('nav-links--open');
}

// Smooth scroll do sekcji (#funkcje, #cennik)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const id = a.getAttribute('href');
  const el = document.querySelector(id);
  if (!el) return;

  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // zamknij mobile menu po kliknięciu
  const navLinks = document.querySelector('.nav-links');
  navLinks?.classList.remove('nav-links--open');
});
// ===== DEMO SLIDER =====
(function initDemoSlider(){
  const slides = Array.from(document.querySelectorAll('.demo-slide'));
  const dots = Array.from(document.querySelectorAll('.demo-dotbtn'));
  const prevBtn = document.querySelector('.demo-prev');
  const nextBtn = document.querySelector('.demo-next');

  if (!slides.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let idx = 0;
  let timer = null;

  function show(i){
    idx = (i + slides.length) % slides.length;

    slides.forEach((s, n) => s.classList.toggle('is-active', n === idx));
    dots.forEach((d, n) => d.classList.toggle('is-active', n === idx));
  }

  function next(){ show(idx + 1); }
  function prev(){ show(idx - 1); }

  function start(){
    if (prefersReduced) return;
    stop();
    timer = setInterval(next, 4200);
  }

  function stop(){
    if (timer) clearInterval(timer);
    timer = null;
  }

  // dot click
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      start();
    });
  });

  // arrows
  prevBtn?.addEventListener('click', () => { prev(); start(); });
  nextBtn?.addEventListener('click', () => { next(); start(); });

  // pause on hover
  const stage = document.querySelector('.demo-stage');
  stage?.addEventListener('mouseenter', stop);
  stage?.addEventListener('mouseleave', start);

  // keyboard (when demo visible)
  window.addEventListener('keydown', (e) => {
    const demo = document.getElementById('demo');
    if (!demo) return;
    const rect = demo.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft') { prev(); start(); }
    if (e.key === 'ArrowRight') { next(); start(); }
  });

  // init
  show(0);
  start();
})();
