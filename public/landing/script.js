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
