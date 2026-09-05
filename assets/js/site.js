/* Progressive enhancements: content and links remain usable without JavaScript. */
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const menu = menuButton && document.getElementById(menuButton.getAttribute('aria-controls'));
if (menuButton && menu) {
  menuButton.hidden = false;
  const closeMenu = (restoreFocus = false) => {
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = 'Menu';
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.textContent = expanded ? 'Close menu' : 'Menu';
    menu.classList.toggle('is-open', expanded);
  });
  menu.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu();
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
  });
  window.matchMedia('(max-width: 900px)').addEventListener('change', () => closeMenu());
}
const demo = document.getElementById('homepage-demo');
if (demo) {
  document.querySelectorAll('[data-play-demo]').forEach(link => {
    link.addEventListener('click', () => {
      demo.focus({ preventScroll: true });
      demo.play().catch(() => { /* Native controls and the MP4 link remain available. */ });
    });
  });
}
