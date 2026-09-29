/* Native players and direct MP4 links work without this enhancement. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const panels = [...document.querySelectorAll('[data-video-panel]')];
  let heroAutoAttempted = false;
  panels.forEach(panel => {
    const video = panel.querySelector('video');
    const toggle = panel.querySelector('[data-video-toggle]');
    const error = panel.querySelector('.media-error');
    if (!video || !toggle) return;
    toggle.hidden = false;
    const label = toggle.dataset.label;
    const update = () => {
      const playing = !video.paused && !video.ended;
      toggle.dataset.playing = String(playing);
      toggle.textContent = playing ? 'Pause film' : video.ended ? 'Replay film' : 'Play film';
      toggle.setAttribute('aria-label', `${playing ? 'Pause' : video.ended ? 'Replay' : 'Play'} ${label}`);
    };
    toggle.addEventListener('click', () => {
      if (video.id === 'watch-film') heroAutoAttempted = true;
      if (video.paused || video.ended) {
        if (video.ended) video.currentTime = 0;
        video.play().catch(() => { if (error) error.hidden = false; });
      } else video.pause();
    });
    video.addEventListener('play', () => {
      panels.forEach(other => {
        const player = other.querySelector('video');
        if (player && player !== video) player.pause();
      });
      update();
    });
    ['pause', 'ended', 'loadedmetadata'].forEach(event => video.addEventListener(event, update));
    video.addEventListener('error', () => { if (error) error.hidden = false; update(); });
    update();
  });
  const hero = document.getElementById('watch-film');
  if (hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) { hero.pause(); return; }
        if (!heroAutoAttempted && !reducedMotion.matches && !navigator.connection?.saveData) {
          heroAutoAttempted = true;
          hero.muted = true;
          hero.play().catch(() => { /* Manual controls remain available. */ });
        }
      });
    }, { threshold: 0.35 });
    observer.observe(hero);
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches && hero) hero.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) panels.forEach(panel => panel.querySelector('video')?.pause());
  });
})();
