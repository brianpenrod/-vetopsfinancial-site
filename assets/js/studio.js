/* Native players and direct MP4 links work without this enhancement. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 640px)');
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
      if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE && video.readyState === 0) {
        showError();
        return;
      }
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
    const showError = () => { video.pause(); if (error) error.hidden = false; update(); };
    video.addEventListener('error', showError);
    video.querySelectorAll('source').forEach(source => source.addEventListener('error', showError));
    // A metadata request can fail before this deferred script attaches listeners.
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) showError();
    update();
  });
  const hero = document.getElementById('watch-film');
  if (hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) { hero.pause(); return; }
        if (!heroAutoAttempted && !reducedMotion.matches && !smallScreen.matches && !navigator.connection?.saveData) {
          heroAutoAttempted = true;
          hero.muted = true;
          hero.play().catch(() => { /* Manual controls remain available. */ });
        }
      });
    }, { threshold: 0.35 });
    observer.observe(hero);
  }
  reducedMotion.addEventListener('change', event => {
    if (event.matches) panels.forEach(panel => panel.querySelector('video')?.pause());
  });
  smallScreen.addEventListener('change', event => {
    if (event.matches && hero) hero.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) panels.forEach(panel => panel.querySelector('video')?.pause());
  });

  const copyButton = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('[data-copy-status]');
  const fallback = document.querySelector('[data-email-fallback]');
  const emailField = document.getElementById('studio-email');
  if (copyButton && copyStatus && fallback && emailField) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(emailField.value);
        fallback.hidden = true;
        copyStatus.textContent = 'Email address copied. Paste it into your email app.';
      } catch {
        fallback.hidden = false;
        emailField.focus();
        emailField.select();
        copyStatus.textContent = 'Copy the selected address, then paste it into your email app.';
      }
    });
  }
})();
