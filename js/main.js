/* ТСК «Сибстроймаркет» — клиентская логика */
(function () {
  'use strict';

  /* ---------- Мобильное меню ---------- */
  var burger = document.querySelector('[data-burger]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        burger.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Модальные окна ---------- */
  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var m = document.querySelector('[data-modal="' + btn.dataset.modalOpen + '"]');
      if (m) { m.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
    });
  });
  document.querySelectorAll('[data-modal]').forEach(function (m) {
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-modal-close]')) {
        m.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.lightbox.is-open').forEach(function (m) {
        m.classList.remove('is-open'); document.body.style.overflow = '';
      });
    }
  });

  /* ---------- Маска телефона +7 (___) ___-__-__ ---------- */
  document.querySelectorAll('[data-phone]').forEach(function (input) {
    input.addEventListener('input', function () {
      var d = input.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      var p = ['+7 (', ') ', '-', '-'], out = '', di = 1;
      if (d.length === 0) { input.value = ''; return; }
      out = '+7';
      var groups = [3, 3, 2, 2], seps = [' (', ') ', '-', '-'];
      for (var i = 0; i < groups.length; i++) {
        var g = d.slice(di, di + groups[i]);
        if (!g) break;
        out += seps[i] + g;
        di += groups[i];
        if (g.length < groups[i]) break;
      }
      input.value = out;
    });
  });

  /* ---------- Отправка форм ---------- */
  var ENDPOINT = '/api/send.php';
  var TEST_MODE = true; // На боевом хостинге выставить false после настройки send.php
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // honeypot
      var hp = form.querySelector('[name="company_site"]');
      if (hp && hp.value) return;
      // валидация телефона
      var phone = form.querySelector('[data-phone]');
      if (phone && phone.value.replace(/\D/g, '').length !== 11) {
        phone.classList.add('is-error'); phone.focus(); return;
      }
      if (phone) phone.classList.remove('is-error');
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      var data = new FormData(form);
      data.append('form_type', form.dataset.form);
      data.append('page', location.pathname);
      var done = function () {
        form.querySelectorAll('input, select, textarea, button').forEach(function (el) {
          if (el.type !== 'hidden') el.style.display = 'none';
        });
        var ok = form.querySelector('[data-form-success]');
        if (ok) ok.classList.add('is-visible');
        if (typeof ym === 'function' && window.YM_ID) ym(window.YM_ID, 'reachGoal', 'zayavka');
      };
      if (TEST_MODE) {
        // Тестовый режим: заявка сохраняется локально, см. README (настройка send.php)
        try {
          var log = JSON.parse(localStorage.getItem('test_zayavki') || '[]');
          var row = {}; data.forEach(function (v, k) { row[k] = v; });
          row.date = new Date().toISOString(); log.push(row);
          localStorage.setItem('test_zayavki', JSON.stringify(log));
        } catch (err) {}
        setTimeout(done, 500);
      } else {
        fetch(ENDPOINT, { method: 'POST', body: data })
          .then(function (r) { return r.json(); })
          .then(function (res) { if (res.ok) done(); else throw new Error(res.error || 'send failed'); })
          .catch(function () {
            btn.disabled = false;
            alert('Не удалось отправить заявку. Позвоните нам: +7 (950) 133-33-45');
          });
      }
    });
  });

  /* ---------- Лайтбокс галереи ---------- */
  var lb = document.querySelector('[data-lightbox]');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-gallery] a'));
    var idx = 0;
    var show = function (i) {
      idx = (i + links.length) % links.length;
      lbImg.src = links[idx].href;
      lbImg.alt = links[idx].querySelector('img') ? links[idx].querySelector('img').alt : '';
    };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(i); lb.classList.add('is-open'); document.body.style.overflow = 'hidden'; });
    });
    lb.querySelector('[data-lb-close]').addEventListener('click', function () { lb.classList.remove('is-open'); document.body.style.overflow = ''; });
    lb.querySelector('[data-lb-prev]').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('[data-lb-next]').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) { lb.classList.remove('is-open'); document.body.style.overflow = ''; } });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    // свайп
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  }

  /* ---------- Фильтры каталога/портфолио ---------- */
  var filterRoot = document.querySelector('[data-filters]');
  if (filterRoot) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-item]'));
    var searchInput = filterRoot.querySelector('[data-filter-search]');
    var countEl = filterRoot.querySelector('[data-filter-count]');
    var state = {};
    var apply = function () {
      var q = (searchInput && searchInput.value || '').toLowerCase();
      var shown = 0;
      items.forEach(function (el) {
        var ok = true;
        Object.keys(state).forEach(function (k) {
          if (state[k] && el.dataset[k] !== state[k]) ok = false;
        });
        if (ok && q) ok = el.textContent.toLowerCase().indexOf(q) !== -1;
        el.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = 'Найдено: ' + shown;
    };
    filterRoot.querySelectorAll('[data-filter-key]').forEach(function (ctrl) {
      var key = ctrl.dataset.filterKey;
      if (ctrl.tagName === 'SELECT') {
        ctrl.addEventListener('change', function () { state[key] = ctrl.value; apply(); });
      }
    });
    filterRoot.querySelectorAll('[data-chip]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var key = chip.dataset.chip, val = chip.dataset.value;
        var siblings = filterRoot.querySelectorAll('[data-chip="' + key + '"]');
        siblings.forEach(function (s) { s.classList.remove('is-active'); });
        if (state[key] === val) { state[key] = ''; }
        else { state[key] = val; chip.classList.add('is-active'); }
        apply();
      });
    });
    if (searchInput) searchInput.addEventListener('input', apply);
    var reset = filterRoot.querySelector('[data-filter-reset]');
    if (reset) reset.addEventListener('click', function () {
      state = {};
      filterRoot.querySelectorAll('select').forEach(function (s) { s.value = ''; });
      filterRoot.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-active'); });
      if (searchInput) searchInput.value = '';
      apply();
    });
    apply();
  }

  /* ---------- Анимация появления ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-animate]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-animate]').forEach(function (el) { el.classList.add('is-in'); });
  }
})();
