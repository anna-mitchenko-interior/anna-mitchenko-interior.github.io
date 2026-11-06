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

// Reference-inspired reading sequence: only the introduction is pinned.
// The actual step cards scroll naturally, while their headings fill with ink.
const processSection = document.querySelector('.process-section');
if (processSection) {
  const track = processSection.querySelector('.process-track');
  const sticky = processSection.querySelector('.process-sticky');
  const steps = [...processSection.querySelectorAll('.step')];
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  let framePending = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  function paintSteps() {
    framePending = false;
    if (!processSection.classList.contains('process-enhanced')) return;
    let current = 0, nearest = Infinity;
    steps.forEach((step, index) => {
      const top = step.getBoundingClientRect().top;
      const progress = clamp((innerHeight * 0.78 - top) / (innerHeight * 0.38));
      step.style.setProperty('--step-fill', `${(1 - progress) * 100}%`);
      step.style.setProperty('--step-copy-opacity', String(0.55 + 0.45 * progress));
      const distance = Math.abs(top - innerHeight * 0.28);
      if (distance < nearest) { nearest = distance; current = index; }
    });
    processSection.dataset.activeStep = String(current + 1);
  }
  function schedulePaint() {
    if (!framePending) { framePending = true; requestAnimationFrame(paintSteps); }
  }
  function measureSteps() {
    const supported = CSS.supports('background-clip', 'text');
    processSection.classList.toggle('process-enhanced', !motionPreference.matches && supported);
    track.style.removeProperty('height');
    steps.forEach(step => { step.style.cssText = ''; step.removeAttribute('aria-hidden'); });
    if (motionPreference.matches) {
      delete processSection.dataset.activeStep;
      return;
    }
    const intro = sticky.querySelector('.process-intro');
    const pinTop = Math.max(24, Math.min(120, innerHeight * 0.12));
    processSection.classList.toggle('process-can-pin', intro.offsetHeight < innerHeight - pinTop - 32);
    processSection.style.setProperty('--process-pin-top', `${pinTop}px`);
    paintSteps();
  }
  addEventListener('scroll', schedulePaint, { passive: true });
  addEventListener('resize', measureSteps, { passive: true });
  motionPreference.addEventListener('change', measureSteps);
  document.fonts.ready.then(measureSteps);
  measureSteps();
}

// A restrained reading reveal inspired by the reference: grey type fills with ink,
// thin rules draw across the grid, and portfolio photos reveal once on entry.
const revealPreference = matchMedia('(prefers-reduced-motion: reduce)');
function initEntranceMotion() {
  if (!('IntersectionObserver' in window) || revealPreference.matches) return;
  const titles = document.querySelectorAll('.manifesto h2, .portfolio-intro h2, .about-copy h2, .services-intro h2, .contact-copy h2');
  const rules = document.querySelectorAll('.section-rule');
  const photos = document.querySelectorAll('.project-main, .portrait');
  if (CSS.supports('background-clip', 'text')) titles.forEach(title => title.classList.add('motion-title'));
  rules.forEach(rule => rule.classList.add('motion-line'));
  photos.forEach(photo => photo.classList.add('motion-photo'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('.motion-title, .motion-line, .motion-photo').forEach(element => observer.observe(element));
  document.documentElement.classList.add('motion-ready');
  revealPreference.addEventListener('change', () => {
    if (revealPreference.matches) {
      observer.disconnect();
      document.documentElement.classList.remove('motion-ready');
    }
  });
}
document.fonts.ready.then(initEntranceMotion);

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
