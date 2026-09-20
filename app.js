/* =============================================================
   ACTIONPhysio Clinic — Storyfront
   Vanilla JS, no dependencies. Everything degrades: if this file
   never loads, the pages still read and every link still works.
   ============================================================= */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return RM.matches; };

  /* Pauline's line — the one on the Google listing, the Facebook contact
     card and labelled "WhatsApp" in their Instagram bio. Hellen's number
     is click-to-call only, the way their own posters present it. */
  var WA = '254723205509';

  /* ---------------------------------------------------------
     1. Smart sticky header — back on ANY upward scroll
     --------------------------------------------------------- */
  var head = document.querySelector('.site-head');
  if (head) {
    var last = window.pageYOffset, ticking = false;
    var onScroll = function () {
      var y = window.pageYOffset;
      if (y > last && y > 180 && !document.querySelector('.drawer.open')) {
        head.classList.add('hide');
      } else {
        head.classList.remove('hide');
      }
      last = y < 0 ? 0 : y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     2. Mobile drawer
     --------------------------------------------------------- */
  var burger = document.querySelector('.burger');
  var drawer = document.querySelector('.drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      if (open) head && head.classList.remove('hide');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     3. Scroll reveal
     --------------------------------------------------------- */
  var rv = document.querySelectorAll('.rv');
  if (rv.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el, i) {
      el.style.transitionDelay = (i % 5) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    rv.forEach(function (el) { el.classList.add('seen'); });
  }
  /* Belt and braces: never leave the page blank if an observer misfires. */
  setTimeout(function () {
    document.querySelectorAll('.rv:not(.seen)').forEach(function (el) { el.classList.add('seen'); });
  }, 2600);

  /* ---------------------------------------------------------
     4. Hero word rotator
     Only conditions their own testimonials actually name. Adding to
     this list means putting an unverified medical claim on the page —
     don't, until Pauline confirms it.
     --------------------------------------------------------- */
  var slot = document.getElementById('slot');
  if (slot) {
    var words = ['back pain.', 'knee pain.', 'a stiff wrist.', 'that ankle.',
                 'bad posture.', 'getting back on the hill.'];
    var i = 0, cur = null, visible = true;
    var put = function (t) {
      var u = document.createElement('u');
      u.textContent = t;
      slot.appendChild(u);
      if (reduced()) { if (cur) cur.remove(); cur = u; return; }
      if (cur) {
        var old = cur;
        old.classList.remove('in'); old.classList.add('out');
        setTimeout(function () { old.remove(); }, 520);
      }
      window.requestAnimationFrame(function () { u.classList.add('in'); });
      cur = u;
    };
    put(words[0]);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { visible = e.isIntersecting; });
      }, { threshold: 0.2 }).observe(slot.closest('.hero') || slot);
    }
    if (!reduced()) {
      setInterval(function () {
        if (!visible || document.hidden) return;
        i = (i + 1) % words.length;
        put(words[i]);
      }, 2600);
    }
  }

  /* ---------------------------------------------------------
     5. SVG line-draw on the arcs
     --------------------------------------------------------- */
  document.querySelectorAll('[data-draw]').forEach(function (path) {
    if (!path.getTotalLength) return;
    var L = path.getTotalLength();
    path.style.strokeDasharray = L;
    path.style.strokeDashoffset = reduced() ? 0 : L;
    if (reduced() || !('IntersectionObserver' in window)) { path.style.strokeDashoffset = 0; return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        o.unobserve(e.target);
        path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
          { duration: 2200, delay: 220, easing: 'cubic-bezier(.36,0,.2,1)', fill: 'forwards' });
      });
    }, { threshold: 0.25 });
    o.observe(path.closest('section') || path);
  });

  /* ---------------------------------------------------------
     6. Lightbox
     --------------------------------------------------------- */
  var strip = document.querySelector('.photo-strip');
  var lb = document.querySelector('.lb');
  if (strip && lb) {
    var btns = Array.prototype.slice.call(strip.querySelectorAll('button'));
    /* The <img> is created here rather than sitting in the markup with an
       empty src — nothing loads until someone actually opens the lightbox. */
    var lbImg = lb.querySelector('img');
    if (!lbImg) {
      lbImg = document.createElement('img');
      lbImg.alt = '';
      lb.querySelector('figure').insertBefore(lbImg, lb.querySelector('figcaption'));
    }
    var lbCap = lb.querySelector('.cap');
    var lbCount = lb.querySelector('.count');
    var idx = 0, opener = null;

    var show = function (n) {
      idx = (n + btns.length) % btns.length;
      var src = btns[idx].dataset.full;
      var cap = btns[idx].dataset.caption || '';
      lbImg.src = src;
      lbImg.alt = btns[idx].querySelector('img').alt;
      lbCap.textContent = cap;
      lbCount.textContent = (idx + 1) + ' of ' + btns.length;
    };
    var open = function (n, from) {
      opener = from; show(n);
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
      lb.querySelector('.x').focus();
    };
    var close = function () {
      lb.classList.remove('on');
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };
    btns.forEach(function (b, n) { b.addEventListener('click', function () { open(n, b); }); });
    lb.querySelector('.x').addEventListener('click', close);
    lb.querySelector('.pv').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.nx').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------------------------------------------------------
     7. Booking form → pre-filled WhatsApp message
     Static only. Nothing is stored, nothing is sent to a server.
     No condition / diagnosis / reason-for-visit field, by design.
     --------------------------------------------------------- */
  document.querySelectorAll('form[data-book]').forEach(function (form) {
    var areaWrap = form.querySelector('[data-area-wrap]');
    var preview = form.querySelector('[data-preview]');
    var dateEl = form.querySelector('[name=date]');

    /* no past dates */
    if (dateEl) {
      var t = new Date();
      dateEl.min = t.getFullYear() + '-' +
        String(t.getMonth() + 1).padStart(2, '0') + '-' +
        String(t.getDate()).padStart(2, '0');
    }

    var mode = function () {
      var m = form.querySelector('[name=mode]:checked');
      return m ? m.value : 'clinic';
    };
    var syncArea = function () {
      if (!areaWrap) return;
      var home = mode() === 'home';
      areaWrap.hidden = !home;
      var sel = areaWrap.querySelector('select');
      if (sel) sel.required = home;
    };
    form.querySelectorAll('[name=mode]').forEach(function (r) {
      r.addEventListener('change', function () { syncArea(); build(); });
    });
    syncArea();

    var fmtDate = function (v) {
      if (!v) return '';
      var p = v.split('-');
      var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return p[2].replace(/^0/, '') + ' ' + M[parseInt(p[1], 10) - 1] + ' ' + p[0];
    };

    function compose() {
      var d = new FormData(form);
      var home = mode() === 'home';
      var L = [];
      L.push('Hello ACTIONPhysio Clinic 👋');
      L.push('I’d like to request an appointment.');
      L.push('');
      L.push('Name: ' + (d.get('name') || '—'));
      L.push('Appointment: ' + (home ? 'Home visit' : 'In clinic — Ngong Lane Plaza'));
      if (home) L.push('Area: ' + (d.get('area') || '—'));
      L.push('Preferred date: ' + (fmtDate(d.get('date')) || '—'));
      L.push('Preferred time: ' + (d.get('time') || '—'));
      L.push('');
      L.push('(Sent from your website — I understand this is a request, not a confirmed booking.)');
      return L.join('\n');
    }

    function build() {
      if (preview) preview.textContent = compose();
    }
    form.addEventListener('input', build);
    build();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var wrap = f.closest('.field');
        var err = wrap && wrap.querySelector('.err');
        var bad = !f.value || (f.type === 'date' && f.value < f.min);
        if (f.closest('[hidden]')) bad = false;
        f.setAttribute('aria-invalid', String(!!bad));
        if (err) err.classList.toggle('show', !!bad);
        if (bad && ok) { ok = false; f.focus(); }
      });
      if (!ok) return;
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(compose()), '_blank', 'noopener');
    });
  });
})();
