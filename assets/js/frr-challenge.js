/* Fictional teaching examples only. No code upload, scan, score, or assessment. */
const challenge = document.querySelector('[data-frr-challenge]');
if (challenge) {
  const scenarios = [
    {
      title: 'The tests passed.',
      context: 'But they ran on last week’s build.',
      tag: 'Different version',
      options: ['Evidence for this version', 'The release date'],
      answers: [
        'That is the useful connection: do these results cover the version you want to release? A passing result from another build leaves that question open.',
        'The release date tells you when. It does not tell you whether last week’s results cover today’s version. Ask for evidence tied to the build you plan to release.'
      ],
      takeaway: 'Match the evidence to the version.'
    },
    {
      title: 'Checkout worked.',
      context: 'But nobody tried a failed payment.',
      tag: 'Untested path',
      options: ['Another successful purchase', 'A failed-payment test'],
      answers: [
        'Another successful purchase repeats the happy path. A failed-payment test can help show whether the order, charge status, and customer message remain consistent when something goes wrong.',
        'That explores a path the demo did not show. Check what happens to the order, charge status, and customer message when a payment fails.'
      ],
      takeaway: 'Explore what happens when a step fails.'
    },
    {
      title: 'The backup exists.',
      context: 'But nobody has tried restoring it.',
      tag: 'Recovery unknown',
      options: ['Restore a separate test copy', 'Confirm the backup file is there'],
      answers: [
        'A restore in a separate test environment helps show whether the saved data can actually be recovered. Keep the live system out of that experiment.',
        'Finding the file confirms that a file exists. It does not show that the data can be recovered. A restore in a separate test environment helps answer that question.'
      ],
      takeaway: 'A backup and a tested recovery are different.'
    }
  ];
  const stage = challenge.querySelector('[data-stage]');
  const title = challenge.querySelector('[data-scenario-title]');
  const context = challenge.querySelector('[data-scenario-context]');
  const tag = challenge.querySelector('[data-scenario-tag]');
  const count = challenge.querySelector('[data-count]');
  const progress = challenge.querySelector('[data-progress]');
  const choices = [...challenge.querySelectorAll('[data-choice]')];
  const feedback = challenge.querySelector('[data-feedback]');
  const takeaway = challenge.querySelector('[data-takeaway]');
  const next = challenge.querySelector('[data-next]');
  const summary = challenge.querySelector('[data-summary]');
  const live = challenge.querySelector('[data-live]');
  let index = 0;
  let answered = false;

  function showScenario(focus = false) {
    const item = scenarios[index];
    answered = false;
    title.textContent = item.title;
    context.textContent = item.context;
    tag.textContent = item.tag;
    count.textContent = `SCENARIO 0${index + 1} / 03`;
    progress.style.setProperty('--progress', `${((index + 1) / 3) * 100}%`);
    progress.setAttribute('aria-label', `Scenario ${index + 1} of 3`);
    choices.forEach((button, option) => {
      button.querySelector('span').textContent = item.options[option];
      button.disabled = false;
      button.removeAttribute('aria-pressed');
      button.classList.remove('is-selected');
    });
    feedback.hidden = true;
    feedback.textContent = '';
    takeaway.textContent = '';
    next.hidden = true;
    next.textContent = index === 2 ? 'See the takeaway →' : 'Next scenario →';
    live.textContent = '';
    if (focus) title.focus();
  }
  choices.forEach((button, option) => {
    button.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      choices.forEach(other => {
        other.disabled = true;
        other.setAttribute('aria-pressed', String(other === button));
      });
      button.classList.add('is-selected');
      feedback.textContent = scenarios[index].answers[option];
      feedback.hidden = false;
      takeaway.textContent = scenarios[index].takeaway;
      next.hidden = false;
      live.textContent = `${scenarios[index].takeaway} ${scenarios[index].answers[option]}`;
      next.focus();
    });
  });
  next.addEventListener('click', () => {
    if (!answered) return;
    if (index < scenarios.length - 1) {
      index += 1;
      showScenario(true);
    } else {
      stage.hidden = true;
      summary.hidden = false;
      summary.querySelector('h3').focus();
      live.textContent = 'Three scenarios explored. These examples do not assess your app.';
    }
  });
  challenge.querySelector('[data-restart]').addEventListener('click', () => {
    index = 0;
    summary.hidden = true;
    stage.hidden = false;
    showScenario(true);
  });
  showScenario();
  challenge.querySelector('[data-fallback]').hidden = true;
  challenge.querySelector('[data-interactive]').hidden = false;
}
