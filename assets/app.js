(() => {
  const CHANNEL_NAME = 'ai-statistics-basic-presentation';
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  const maxStep = 6;
  const stepLabels = [
    '도입 화면',
    '1단계 · 기존 학습법 70점',
    '2단계 · AI 학습법 75점',
    '3단계 · +5점 강조',
    '4단계 · 효과 질문',
    '5단계 · 우연 질문',
    '6단계 · 통계적 가설검정'
  ];

  function clampStep(value) {
    return Math.min(maxStep, Math.max(0, Number(value) || 0));
  }

  function writeStep(step, broadcast = true) {
    const next = clampStep(step);
    localStorage.setItem('stats-slide-01-step', String(next));
    renderPresentation(next);
    renderScript(next);
    if (broadcast && channel) channel.postMessage({ type: 'step', slide: 1, step: next });
  }

  function readStep() {
    return clampStep(localStorage.getItem('stats-slide-01-step'));
  }

  function renderPresentation(step) {
    const slide = document.querySelector('#slide01');
    if (!slide) return;

    slide.dataset.step = String(step);
    document.querySelectorAll('.step-item').forEach((el) => {
      const showAt = Number(el.dataset.showStep || 0);
      el.classList.toggle('is-visible', step >= showAt);
    });

    const status = document.querySelector('#stepStatus');
    if (status) status.textContent = stepLabels[step];

    const prev = document.querySelector('#prevStep');
    const next = document.querySelector('#nextStep');
    if (prev) prev.disabled = step === 0;
    if (next) next.disabled = step === maxStep;
  }

  function renderScript(step) {
    document.querySelectorAll('.stage-button').forEach((button) => {
      const buttonStep = Number(button.dataset.step || 0);
      button.classList.toggle('is-active', buttonStep === step);
    });
  }

  function bindPresentation() {
    const slide = document.querySelector('#slide01');
    if (!slide) return;

    document.querySelector('#prevStep')?.addEventListener('click', () => writeStep(readStep() - 1));
    document.querySelector('#nextStep')?.addEventListener('click', () => writeStep(readStep() + 1));

    document.querySelector('#openScript')?.addEventListener('click', () => {
      const width = Math.min(920, Math.round(window.screen.availWidth * 0.5));
      const height = Math.min(960, Math.round(window.screen.availHeight * 0.92));
      window.open(
        'script.html',
        'statisticsPresenterScript',
        `popup=yes,width=${width},height=${height},left=20,top=20,resizable=yes,scrollbars=yes`
      );
    });

    window.addEventListener('keydown', (event) => {
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(event.key)) {
        event.preventDefault();
        writeStep(readStep() + 1);
      }
      if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) {
        event.preventDefault();
        writeStep(readStep() - 1);
      }
      if (event.key.toLowerCase() === 's') {
        document.querySelector('#openScript')?.click();
      }
      if (event.key === 'Home') writeStep(0);
      if (event.key === 'End') writeStep(maxStep);
    });
  }

  function bindScript() {
    const buttons = document.querySelectorAll('.stage-button');
    if (!buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener('click', () => writeStep(Number(button.dataset.step)));
    });

    document.querySelector('#resetSlide')?.addEventListener('click', () => writeStep(0));

    window.addEventListener('keydown', (event) => {
      if (['ArrowRight', 'PageDown'].includes(event.key)) writeStep(readStep() + 1);
      if (['ArrowLeft', 'PageUp'].includes(event.key)) writeStep(readStep() - 1);
    });
  }

  channel?.addEventListener('message', (event) => {
    if (event.data?.type === 'step' && event.data?.slide === 1) {
      const step = clampStep(event.data.step);
      localStorage.setItem('stats-slide-01-step', String(step));
      renderPresentation(step);
      renderScript(step);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'stats-slide-01-step') {
      const step = clampStep(event.newValue);
      renderPresentation(step);
      renderScript(step);
    }
  });

  bindPresentation();
  bindScript();
  const initialStep = readStep();
  renderPresentation(initialStep);
  renderScript(initialStep);
})();
