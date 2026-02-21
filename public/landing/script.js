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
/* =========================
   LoftDesk landing helpers
   (append-only, safe)
========================= */

// 1) MOBILE MENU (obsługa onclick z HTML)
window.toggleMobileMenu = window.toggleMobileMenu || function toggleMobileMenu() {
  const navLinks = document.querySelector(".nav-links");
  const btn = document.querySelector(".mobile-menu-btn");
  if (!navLinks) return;

  const isOpen = navLinks.classList.toggle("is-open");

  // a11y
  if (btn) {
    btn.setAttribute("aria-expanded", String(isOpen));
    btn.setAttribute("aria-label", isOpen ? "Zamknij menu" : "Otwórz menu");
  }

  // opcjonalnie blokada scrolla na mobile (bezpieczna)
  document.body.classList.toggle("menu-open", isOpen);
};

// domyślne a11y dla przycisku
(function initMobileMenuA11y() {
  const btn = document.querySelector(".mobile-menu-btn");
  if (!btn) return;
  if (!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
  if (!btn.hasAttribute("aria-label")) btn.setAttribute("aria-label", "Otwórz menu");
})();


// 2) DEMO SLIDER (autoplay + strzałki + kropki)
(function initDemoSlider() {
  // zabezpieczenie przed podwójną inicjalizacją
  if (window.__loftdeskDemoSliderInit) return;
  window.__loftdeskDemoSliderInit = true;

  const frame = document.querySelector(".demo-frame");
  const stage = document.querySelector(".demo-stage");
  const slides = Array.from(document.querySelectorAll(".demo-slide"));
  const dots = Array.from(document.querySelectorAll(".demo-dotbtn"));
  const prevBtn = document.querySelector(".demo-prev");
  const nextBtn = document.querySelector(".demo-next");

  if (!frame || !stage || slides.length === 0) return;

  let current = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  if (current === -1) current = 0;

  let autoplayTimer = null;
  const AUTOPLAY_MS = 4500;
  let paused = false;

  function setActive(index) {
    const total = slides.length;
    if (!total) return;

    current = (index + total) % total;

    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      // lekkie wsparcie dla click-through / focus
      slide.style.pointerEvents = active ? "auto" : "none";
    });

    dots.forEach((dot, i) => {
      const active = i === current;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
      dot.setAttribute("tabindex", active ? "0" : "-1");
    });
  }

  function nextSlide() {
    setActive(current + 1);
  }

  function prevSlide() {
    setActive(current - 1);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (paused || slides.length <= 1) return;
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS);
  }

  function restartAutoplay() {
    startAutoplay();
  }

  // init aria na kropkach
  dots.forEach((dot, i) => {
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Slajd ${i + 1}`);
    dot.addEventListener("click", () => {
      setActive(i);
      restartAutoplay();
    });
  });

  // strzałki
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      prevSlide();
      restartAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      nextSlide();
      restartAutoplay();
    });
  }

  // klawiatura (gdy fokus jest w sekcji demo)
  frame.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
      restartAutoplay();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
      restartAutoplay();
    }
  });

  // hover / focus pause
  const pause = () => {
    paused = true;
    stopAutoplay();
  };
  const resume = () => {
    paused = false;
    startAutoplay();
  };

  frame.addEventListener("mouseenter", pause);
  frame.addEventListener("mouseleave", resume);
  frame.addEventListener("focusin", pause);
  frame.addEventListener("focusout", resume);

  // pauza gdy karta niewidoczna
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  // swipe (mobile) – delikatnie, bez bibliotek
  let touchStartX = 0;
  let touchEndX = 0;
  const SWIPE_MIN = 40;

  stage.addEventListener("touchstart", (e) => {
    if (!e.touches || !e.touches.length) return;
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener("touchmove", (e) => {
    if (!e.touches || !e.touches.length) return;
    touchEndX = e.touches[0].clientX;
  }, { passive: true });

  stage.addEventListener("touchend", () => {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) >= SWIPE_MIN) {
      if (diff > 0) prevSlide();
      else nextSlide();
      restartAutoplay();
    }
    touchStartX = 0;
    touchEndX = 0;
  });

  // inicjalizacja
  setActive(current);
  startAutoplay();
})();