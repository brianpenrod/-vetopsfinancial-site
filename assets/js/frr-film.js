/* One quiet play-through. Native controls and the direct film link work without JS. */
(() => {
  const panel = document.querySelector('[data-frr-film]');
  if (!panel) return;
  const video = panel.querySelector('video');
  const toggle = panel.querySelector('[data-film-toggle]');
  const caption = panel.querySelector('[data-film-caption]');
  const error = panel.querySelector('.frr-film-error');
  const seek = panel.querySelector('[data-film-seek]');
  const position = panel.querySelector('#frr-film-position');
  const clock = panel.querySelector('[data-film-clock]');
  if (!video || !toggle || !caption || !error || !seek || !position || !clock) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const closing = 'Before you launch. Know what to check.';
  const chapters = [
    { from: 0, copy: 'You built it with AI.' },
    { from: 4, copy: 'It works in the demo.' },
    { from: 8, copy: 'Ready for real customers?' },
    { from: 14, copy: closing },
  ];
  let autoAttempted = false;
  let inView = false;
  let hasPlayed = false;
  const formatTime = seconds => `0:${String(Math.floor(seconds)).padStart(2, '0')}`;

  const update = () => {
    const playing = !video.paused && !video.ended;
    toggle.dataset.playing = String(playing);
    toggle.textContent = playing ? 'Pause film' : video.ended ? 'Replay film' : 'Play film';
    toggle.setAttribute('aria-label', `${playing ? 'Pause' : video.ended ? 'Replay' : 'Play'} The Missing Piece film`);
    const chapter = [...chapters].reverse().find(item => video.currentTime >= item.from) || chapters[0];
    const text = hasPlayed ? chapter.copy : closing;
    if (caption.textContent !== text) caption.textContent = text;
    const duration = Number.isFinite(video.duration) ? video.duration : 18;
    position.max = String(duration);
    position.value = String(video.currentTime);
    position.setAttribute('aria-valuetext', `${Math.floor(video.currentTime)} seconds of ${Math.round(duration)} seconds`);
    clock.textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`;
  };

  const attemptAutoPlay = () => {
    if (autoAttempted || !inView || document.hidden || motion.matches || connection?.saveData) return;
    autoAttempted = true;
    video.muted = true;
    video.play().catch(() => { /* Browser may require the visible Play film button. */ });
  };

  toggle.addEventListener('click', () => {
    autoAttempted = true;
    if (!video.paused && !video.ended) {
      video.pause();
      return;
    }
    if (video.ended) video.currentTime = 0;
    error.hidden = true;
    video.play().catch(() => { error.hidden = false; });
  });
  position.addEventListener('input', () => {
    autoAttempted = true;
    hasPlayed = true;
    video.currentTime = Number(position.value);
    update();
  });
  video.addEventListener('play', () => {
    hasPlayed = true;
    autoAttempted = true;
    error.hidden = true;
    update();
  });
  ['pause', 'ended', 'timeupdate', 'seeked'].forEach(event => video.addEventListener(event, update));
  video.addEventListener('loadedmetadata', () => { position.disabled = false; update(); });
  const showError = () => { error.hidden = false; update(); };
  video.addEventListener('error', showError);
  video.querySelector('source')?.addEventListener('error', showError);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.35;
      if (!inView) video.pause();
      else attemptAutoPlay();
    }, { threshold: [0, 0.35] }).observe(video);
  }
  motion.addEventListener('change', event => {
    if (event.matches) video.pause();
  });
  connection?.addEventListener('change', () => {
    if (connection.saveData) video.pause();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else attemptAutoPlay();
  });
  video.controls = false;
  toggle.hidden = false;
  seek.hidden = false;
  position.disabled = video.readyState === 0;
  update();
})();
