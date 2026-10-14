'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const EMAIL = 'hello@kryptonsec.com';
  const ENDPOINT = `https://formsubmit.co/ajax/${EMAIL}`;
  const PAGES = [
    ['index.html', 'Home'],
    ['services.html', 'Services'],
    ['about.html', 'About'],
    ['contact.html', 'Contact'],
  ];
  const SERVICES = [
    ['pentest', 'Penetration Testing'], ['soc', 'SOC-as-a-Service'],
    ['cloud', 'Cloud Security'], ['compliance', 'Compliance and GRC'],
    ['intel', 'Threat Intelligence'], ['awareness', 'Security Awareness'],
  ];
  const current = location.pathname.split('/').pop() || 'index.html';

  function mountLayout() {
    const links = PAGES.map(([href, label]) =>
      `<li><a href="${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
    $('#site-header').outerHTML = `
      <header id="hdr"><div class="wrap header-inner">
        <a class="brand" href="index.html" aria-label="Krypton home">KRYPTON<span> SECURITY</span></a>
        <nav aria-label="Primary"><ul id="menu">${links}<li><a class="cta" href="contact.html">Contact us</a></li></ul></nav>
        <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="menu"><b></b><b></b></button>
      </div></header>
      <div class="scrim"></div>
      <button class="top" aria-label="Back to top">Back to top ↑</button>`;

    const page = PAGES.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('');
    const services = SERVICES.map(([id, label]) => `<li><a href="services.html#${id}">${label}</a></li>`).join('');
    $('#site-footer').outerHTML = `
      <footer><div class="wrap">
        <div class="fg">
          <div class="footer-intro">
            <a class="brand" href="index.html">KRYPTON<span> SECURITY</span></a>
            <p>Cybersecurity services built around clear advice, practical action and the risks that matter to your organisation.</p>
            <a class="footer-email" href="mailto:${EMAIL}">${EMAIL}</a>
          </div>
          <div><h4>Company</h4><ul>${page}</ul></div>
          <div><h4>Services</h4><ul>${services}</ul></div>
          <div><h4>Location</h4><p>Lagos, Nigeria</p><p><a href="contact.html">Contact our team</a></p></div>
        </div>
        <div class="legal"><span>&copy; ${new Date().getFullYear()} Krypton Security. All rights reserved.</span><span>Cybersecurity for organisations.</span></div>
      </div></footer>`;
  }

  function initNav() {
    const btn = $('.burger'), menu = $('#menu'), scrim = $('.scrim');
    if (!btn || !menu || !scrim) return;
    const set = (open) => {
      menu.classList.toggle('open', open);
      scrim.classList.toggle('on', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    scrim.addEventListener('click', () => set(false));
    menu.addEventListener('click', (event) => { if (event.target.closest('a')) set(false); });
    addEventListener('keydown', (event) => { if (event.key === 'Escape') set(false); });
    matchMedia('(min-width: 861px)').addEventListener('change', (event) => { if (event.matches) set(false); });
  }

  function initScroll() {
    const header = $('#hdr'), top = $('.top');
    if (!header || !top) return;
    const update = () => {
      header.classList.toggle('stuck', scrollY > 8);
      top.classList.toggle('on', scrollY > 600);
    };
    addEventListener('scroll', update, { passive: true });
    top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
    update();
  }

  function initMotion() {
    const targets = $$('[data-rv], [data-stagger] > *');
    if (!targets.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((target) => target.classList.add('revealed'));
      return;
    }
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((target) => observer.observe(target));
  }

  function initForm() {
    const form = $('#cf');
    if (!form) return;
    const note = $('.note', form), submit = $('[type=submit]', form);
    const rules = {
      name: (value) => value.trim().length >= 2,
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
      organisation: (value) => value.trim().length >= 2,
      message: (value) => value.trim().length >= 10,
    };
    const check = (field) => {
      const valid = !rules[field.name] || rules[field.name](field.value);
      field.setAttribute('aria-invalid', String(!valid));
      return valid;
    };
    const say = (type, message) => { note.className = `note on ${type}`; note.textContent = message; };
    const topic = new URLSearchParams(location.search).get('topic');
    const preset = $$('option', form).find((option) => option.dataset.topic === topic);
    if (preset) preset.selected = true;
    form.addEventListener('input', (event) => {
      if (event.target.getAttribute('aria-invalid') === 'true') check(event.target);
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const invalid = $$('[name]', form).filter((field) => field.name in rules && !check(field));
      if (invalid.length) { invalid[0].focus(); say('err', 'Please correct the highlighted fields.'); return; }
      submit.disabled = true;
      submit.textContent = 'Sending…';
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        say('ok', 'Message received. We will get back to you as soon as possible.');
      } catch {
        say('err', `We could not send your message. Please email ${EMAIL} instead.`);
      } finally {
        submit.disabled = false;
        submit.textContent = 'Send enquiry';
      }
    });
  }

  function boot() {
    mountLayout();
    initNav();
    initScroll();
    initMotion();
    initForm();
  }
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
