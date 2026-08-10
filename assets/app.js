(() => {
  const CHANNEL_NAME = 'ai-statistics-basic-presentation';
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL_NAME) : null;
  const slideMaxSteps = {1:6,2:5,3:5,4:5,5:6,6:5,7:5,8:2};
  const stepLabels = {
    1:['도입 화면','1단계 · 기존 학습법 70점','2단계 · AI 학습법 75점','3단계 · +5점 강조','4단계 · 효과 질문','5단계 · 우연 질문','6단계 · 통계적 가설검정'],
    2:['도입 화면','1단계 · 관찰된 차이','2단계 · 바로 결론할 수 없음','3단계 · 왜 그럴까요?','4단계 · 우연에 의한 변동','5단계 · 가설검정 정의'],
    3:['도입 화면','1단계 · 귀무가설 H₀','2단계 · H₀ 사례','3단계 · 대립가설 H₁','4단계 · H₁ 사례','5단계 · H₀에서 출발'],
    4:['도입 화면','1단계 · 질문과 가설','2단계 · 유의수준 α','3단계 · p-value','4단계 · 비교 및 판단','5단계 · 핵심 판단 요소'],
    5:['도입 화면','1단계 · 유의수준 α','2단계 · α=0.05','3단계 · p-value','4단계 · 정확한 정의','5단계 · 오개념 주의','6단계 · 핵심 요약'],
    6:['도입 화면','1단계 · α=0.05','2단계 · p=0.03','3단계 · p<α','4단계 · H₀ 기각','5단계 · 결론'],
    7:['도입 화면','1단계 · 유의성≠효과크기','2단계 · 작은 차이 예시','3단계 · 실제 중요성 질문','4단계 · 분석가의 태도','5단계 · 핵심 메시지'],
    8:['도입 화면','1단계 · 핵심 4단계','2단계 · 최종 정의']
  };

  const slideKey = 'stats-current-slide';
  const stepKey = (slide) => `stats-slide-${String(slide).padStart(2,'0')}-step`;
  const clampSlide = (value) => Math.min(8, Math.max(1, Number(value) || 1));
  const clampStep = (slide, value) => Math.min(slideMaxSteps[slide], Math.max(0, Number(value) || 0));
  const readSlide = () => clampSlide(localStorage.getItem(slideKey));
  const readStep = (slide) => clampStep(slide, localStorage.getItem(stepKey(slide)));

  function writeState(slide, step, broadcast = true) {
    const s = clampSlide(slide);
    const st = clampStep(s, step);
    localStorage.setItem(slideKey, String(s));
    localStorage.setItem(stepKey(s), String(st));
    renderPresentation(s, st);
    renderScript(s, st);
    if (broadcast && channel) channel.postMessage({type:'state', slide:s, step:st});
  }

  function renderPresentation(slide, step) {
    document.querySelectorAll('.slide').forEach((el) => el.classList.toggle('is-current-slide', Number(el.dataset.slide) === slide));
    const current = document.querySelector(`.slide[data-slide="${slide}"]`);
    if (current) {
      current.querySelectorAll('.step-item').forEach((el) => {
        const showAt = Number(el.dataset.showStep || 0);
        el.classList.toggle('is-visible', step >= showAt);
      });
    }
    const n = document.querySelector('#slideNumber'); if (n) n.textContent = String(slide).padStart(2,'0');
    const status = document.querySelector('#stepStatus'); if (status) status.textContent = stepLabels[slide][step] || '';
    const prev = document.querySelector('#prevStep');
    const next = document.querySelector('#nextStep');
    if (prev) prev.disabled = slide === 1 && step === 0;
    if (next) next.disabled = slide === 8 && step === slideMaxSteps[8];
  }

  function renderScript(slide, step) {
    document.querySelectorAll('[data-script-slide]').forEach((el) => el.classList.toggle('is-current-script', Number(el.dataset.scriptSlide) === slide));
    document.querySelectorAll('[data-script-slide] .stage-button').forEach((button) => {
      const card = button.closest('[data-script-slide]');
      const activeSlide = Number(card?.dataset.scriptSlide) === slide;
      button.classList.toggle('is-active', activeSlide && Number(button.dataset.step) === step);
    });
    const label = `${String(slide).padStart(2,'0')} / 08`;
    const a = document.querySelector('#scriptSlideNumber'); if (a) a.textContent = label;
    const b = document.querySelector('#scriptProgress'); if (b) b.textContent = label;
    const prev = document.querySelector('#prevSlide'); if (prev) prev.disabled = slide === 1;
    const next = document.querySelector('#nextSlide'); if (next) next.disabled = slide === 8;
  }

  function forward() {
    const slide = readSlide(), step = readStep(slide), max = slideMaxSteps[slide];
    if (step < max) writeState(slide, step + 1);
    else if (slide < 8) writeState(slide + 1, readStep(slide + 1));
  }

  function backward() {
    const slide = readSlide(), step = readStep(slide);
    if (step > 0) writeState(slide, step - 1);
    else if (slide > 1) writeState(slide - 1, slideMaxSteps[slide - 1]);
  }

  function goSlide(delta) {
    const next = clampSlide(readSlide() + delta);
    if (next !== readSlide()) writeState(next, readStep(next));
  }

  document.querySelector('#prevStep')?.addEventListener('click', backward);
  document.querySelector('#nextStep')?.addEventListener('click', forward);
  document.querySelector('#openScript')?.addEventListener('click', () => {
    const width = Math.min(920, Math.round(window.screen.availWidth * 0.5));
    const height = Math.min(960, Math.round(window.screen.availHeight * 0.92));
    window.open('script.html','statisticsPresenterScript',`popup=yes,width=${width},height=${height},left=20,top=20,resizable=yes,scrollbars=yes`);
  });

  document.querySelectorAll('.stage-button').forEach((button) => button.addEventListener('click', () => writeState(readSlide(), Number(button.dataset.step))));
  document.querySelector('#resetSlide')?.addEventListener('click', () => writeState(readSlide(), 0));
  document.querySelector('#prevSlide')?.addEventListener('click', () => goSlide(-1));
  document.querySelector('#nextSlide')?.addEventListener('click', () => goSlide(1));

  window.addEventListener('keydown', (event) => {
    if (['ArrowRight',' ','PageDown','Enter'].includes(event.key)) { event.preventDefault(); forward(); }
    if (['ArrowLeft','PageUp','Backspace'].includes(event.key)) { event.preventDefault(); backward(); }
    if (event.key.toLowerCase() === 's') document.querySelector('#openScript')?.click();
    if (event.key === 'Home') writeState(readSlide(),0);
    if (event.key === 'End') writeState(readSlide(),slideMaxSteps[readSlide()]);
  });

  channel?.addEventListener('message', (event) => {
    if (event.data?.type === 'state') writeState(event.data.slide, event.data.step, false);
  });
  window.addEventListener('storage', (event) => {
    if (event.key === slideKey || event.key?.startsWith('stats-slide-')) renderAll();
  });
  function renderAll() { const s = readSlide(); writeState(s, readStep(s), false); }
  renderAll();
})();
