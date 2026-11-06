const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  toggle.querySelector('span').textContent = open ? '−' : '+';
});
navigation?.addEventListener('click', event => {
  if (!event.target.closest('a')) return;
  navigation.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.querySelector('span').textContent = '+';
});

// One shared stage: the incoming step rises over the outgoing step as the page scrolls.
// Without JavaScript or with reduced motion, the full readable list remains available.
const processSection = document.querySelector('.process-section');
if (processSection) {
  const track = processSection.querySelector('.process-track');
  const sticky = processSection.querySelector('.process-sticky');
  const steps = [...processSection.querySelectorAll('.step')];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let travel = 0, pinTop = 24, framePending = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  function paintSteps() {
    framePending = false;
    if (!processSection.classList.contains('process-enhanced')) return;
    const progress = clamp((pinTop - track.getBoundingClientRect().top) / travel);
    const position = progress * (steps.length - 1);
    const current = Math.min(Math.floor(position), steps.length - 1);
    const transition = current === steps.length - 1 ? 0 : ease(clamp((position - current - 0.58) / 0.42));
    const accessibleStep = transition >= 0.5 ? Math.min(current + 1, steps.length - 1) : current;
    steps.forEach((step, index) => {
      let opacity = 0, offset = 32;
      if (index === current) { opacity = 1 - transition; offset = -12 * transition; }
      if (index === current + 1 && transition > 0) { opacity = transition; offset = 32 * (1 - transition); }
      step.style.opacity = String(opacity);
      step.style.transform = `translate3d(0, ${offset}px, 0)`;
      step.style.visibility = opacity === 0 ? 'hidden' : 'visible';
      step.style.zIndex = String(index + 1);
      step.setAttribute('aria-hidden', String(index !== accessibleStep));
    });
    processSection.dataset.activeStep = String(accessibleStep + 1);
  }
  function schedulePaint() {
    if (!framePending) { framePending = true; requestAnimationFrame(paintSteps); }
  }
  function measureSteps() {
    processSection.classList.toggle('process-enhanced', !motionPreference.matches);
    if (motionPreference.matches) {
      track.style.removeProperty('height');
      steps.forEach(step => { step.style.cssText = ''; step.removeAttribute('aria-hidden'); });
      delete processSection.dataset.activeStep;
      return;
    }
    pinTop = Math.max(24, Math.min(120, innerHeight * 0.14));
    // All the actual text must fit while pinned, including small landscape screens.
    if (sticky.offsetHeight > innerHeight - pinTop - 24) pinTop = 24;
    if (sticky.offsetHeight > innerHeight - 48) {
      processSection.classList.remove('process-enhanced');
      track.style.removeProperty('height');
      steps.forEach(step => { step.style.cssText = ''; step.removeAttribute('aria-hidden'); });
      return;
    }
    travel = Math.max(400, innerHeight * 0.7) * (steps.length - 1);
    processSection.style.setProperty('--process-pin-top', `${pinTop}px`);
    track.style.height = `${Math.ceil(sticky.offsetHeight + travel)}px`;
    paintSteps();
  }
  addEventListener('scroll', schedulePaint, { passive: true });
  addEventListener('resize', measureSteps, { passive: true });
  motionPreference.addEventListener('change', measureSteps);
  document.fonts.ready.then(measureSteps);
  measureSteps();
}

const dialog = document.querySelector('.gallery');
let galleryPhotos = [], currentSlide = 0, galleryOpener;
function showSlide(index) {
  currentSlide = (index + galleryPhotos.length) % galleryPhotos.length;
  const image = galleryPhotos[currentSlide];
  const target = dialog.querySelector('.gallery-image');
  target.src = image.src;
  target.alt = image.alt;
  dialog.querySelector('.gallery-counter').textContent = `${currentSlide + 1} / ${galleryPhotos.length}`;
}
document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => {
  galleryOpener = button;
  const card = button.closest('.project');
  galleryPhotos = [...card.querySelectorAll('.photo-button img')];
  dialog.querySelector('.gallery-caption').textContent = card.querySelector('h3').textContent;
  showSlide(Number(button.dataset.slide));
  dialog.showModal();
  document.body.style.overflow = 'hidden';
}));
dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
dialog.querySelector('.gallery-prev').addEventListener('click', () => showSlide(currentSlide - 1));
dialog.querySelector('.gallery-next').addEventListener('click', () => showSlide(currentSlide + 1));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showSlide(currentSlide - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showSlide(currentSlide + 1); }
});
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog.addEventListener('close', () => { document.body.style.overflow = ''; galleryOpener?.focus({ preventScroll: true }); });

const form = document.querySelector('.contact-form');
const contact = document.querySelector('#visitor-contact');
contact.addEventListener('input', () => contact.setCustomValidity(''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const value = contact.value.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const phoneValid = /^\+?[\d\s()\-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15;
  if (!emailValid && !phoneValid) { contact.setCustomValidity('Укажите email или телефон с кодом города / страны.'); contact.reportValidity(); return; }
  if (!form.reportValidity()) return;
  const submit = form.querySelector('[type="submit"]');
  const status = form.querySelector('.form-status');
  const fallback = form.querySelector('.form-email-fallback');
  const data = new FormData(form);
  const mailBody = `Имя: ${data.get('name')}\nКонтакт: ${data.get('contact')}\n\n${data.get('message') || ''}`;
  fallback.href = `mailto:anmitchenko@gmail.com?subject=${encodeURIComponent('Заявка на дизайн интерьера')}&body=${encodeURIComponent(mailBody)}`;
  status.hidden = false; fallback.hidden = true;
  if (form.dataset.delivery === 'email') {
    status.textContent = 'Заявка подготовлена. Нажмите «Отправить письмо Анне», чтобы открыть её в почтовой программе.';
    fallback.hidden = false; return;
  }
  if (location.protocol === 'file:' || ['localhost', '127.0.0.1', '::1'].includes(location.hostname)) {
    status.textContent = 'Это локальный просмотр. Заявку можно отправить Анне письмом по ссылке ниже.';
    fallback.hidden = false; return;
  }
  submit.disabled = true; status.classList.remove('error'); status.textContent = 'Отправляю заявку…';
  try {
    const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
    if (!response.ok) throw new Error(`Form HTTP ${response.status}`);
    form.reset(); status.textContent = 'Спасибо! Заявка отправлена. Анна свяжется с вами по указанным контактам.';
  } catch {
    status.classList.add('error'); status.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз или отправьте письмо Анне.';
    fallback.hidden = false;
  } finally { submit.disabled = false; }
});
