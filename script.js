/* ==========================================================================
   CRESCEBEM — MOTOR INTERATIVO 3D
   Cards inclináveis, parallax, botões magnéticos, contadores animados,
   barra de progresso, cursor luminoso e revelações com profundidade.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches || ('ontouchstart' in window);

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Seletores com efeito de inclinação 3D automática */
  var TILT_SELECTOR = [
    '[data-tilt]', '.card', '.resource-card', '.depo', '.depoimento-card',
    '.foto-card', '.mission-card', '.value-card', '.stat-item', '.auth-card',
    '.channel-card', '.team-member', '.mini > div', '.hero-card', '.photo-wrap',
    '.favorito-card', '.pedido-card', '.contact-form', '.contact-info'
  ].join(', ');

  /* ---------------------------------------------------------------- MENU */
  function burger() {
    var btn = $('#burger');
    var links = $('#links') || $('.nav-links') || $('.menu-links');
    if (!btn || !links) return;
    btn.addEventListener('click', function () {
      links.classList.toggle('open');
      btn.classList.toggle('active');
      var icon = btn.querySelector('i');
      if (icon) icon.className = links.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    });
    $$('a', links).forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('open');
        btn.classList.remove('active');
        var icon = btn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }

  function navScroll() {
    var nav = $('.nav');
    if (!nav) return;
    function upd() { nav.classList.toggle('scrolled', window.scrollY > 60); }
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  function activeLink() {
    var page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.links a, .menu-links a, .user-menu a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').toLowerCase().split('#')[0];
      if (href && href === page) a.classList.add('active');
    });
  }

  /* ------------------------------------------------- BARRA / VOLTAR AO TOPO */
  function progressBar() {
    var bar = document.createElement('div');
    bar.className = 'progress';
    document.body.appendChild(bar);
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  }

  function toTop() {
    var btn = document.createElement('button');
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    document.body.appendChild(btn);
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------- REVELAÇÃO 3D */
  function reveal() {
    var groups = $$('[data-stagger]');
    groups.forEach(function (group) {
      $$(':scope > *', group).forEach(function (child, i) {
        if (!child.classList.contains('reveal')) {
          child.classList.add('reveal');
          child.setAttribute('data-delay', String(i * 90));
        }
      });
    });

    var els = $$('.reveal');
    if (!els.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10) || 0;
          window.setTimeout(function () { entry.target.classList.add('in'); }, delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------ INCLINAÇÃO 3D */
  function tilt() {
    if (reduceMotion || isTouch) return;
    $$(TILT_SELECTOR).forEach(function (el) {
      if (el.__crescerTilt) return;
      el.__crescerTilt = true;

      var max = parseFloat(el.getAttribute('data-tilt-max') || '9');
      var lift = parseFloat(el.getAttribute('data-tilt-lift') || '14');
      /* camadas com profundidade dentro do hero/cenário são comandadas pelo parallax */
      var inScene = el.closest && el.closest('.hero, .page-hero');
      var depthLayers = inScene ? [] : $$('[data-depth]', el);

      function onMove(e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var ry = (px - 0.5) * max * 2;
        var rx = (0.5 - py) * max * 2;
        el.classList.add('tilting');
        el.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(' + lift + 'px)';
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        depthLayers.forEach(function (layer) {
          var d = parseFloat(layer.getAttribute('data-depth')) || 1;
          layer.style.transform = 'translate3d(' + ((px - 0.5) * 16 * d).toFixed(1) + 'px,' + ((py - 0.5) * 16 * d).toFixed(1) + 'px,0)';
        });
      }

      function onLeave() {
        el.classList.remove('tilting');
        el.style.transform = '';
        depthLayers.forEach(function (layer) { layer.style.transform = ''; });
      }

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  /* --------------------------------------------- PARALLAX DO HERO / CENÁRIO */
  function parallaxScenes() {
    if (reduceMotion || isTouch) return;

    $$('.hero, .page-hero').forEach(function (scene) {
      var card = $('.hero-card', scene);
      var slides = $('.slides', scene);
      var layers = $$('[data-depth]', scene);

      scene.addEventListener('mousemove', function (e) {
        var r = scene.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;

        if (card) {
          card.style.transform = 'perspective(1000px) rotateY(' + (px * 10).toFixed(2) + 'deg) rotateX(' + (-py * 10).toFixed(2) + 'deg)';
        }
        if (slides) {
          slides.style.transform = 'translate3d(' + (px * -20).toFixed(1) + 'px,' + (py * -16).toFixed(1) + 'px,0) scale(1.06)';
        }
        layers.forEach(function (layer) {
          var d = parseFloat(layer.getAttribute('data-depth')) || 1;
          layer.style.transform = 'translate3d(' + (px * 34 * d).toFixed(1) + 'px,' + (py * 30 * d).toFixed(1) + 'px,0)';
        });
      });

      scene.addEventListener('mouseleave', function () {
        if (card) card.style.transform = '';
        if (slides) slides.style.transform = '';
        layers.forEach(function (layer) { layer.style.transform = ''; });
      });
    });
  }

  /* ------------------------------------------------------ BOTÕES MAGNÉTICOS */
  function magnetic() {
    if (reduceMotion || isTouch) return;
    $$('.btn, .wpp, .arrow, .filtro-btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        var scale = btn.classList.contains('wpp') ? ' scale(1.08)' : '';
        btn.style.transform = 'translate(' + (x * 12).toFixed(1) + 'px,' + (y * 10).toFixed(1) + 'px)' + scale;
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* -------------------------------------------------------- CONTADORES */
  function counters() {
    var els = $$('[data-count]');
    if (!els.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var format = function (n) { return prefix + n.toLocaleString('pt-BR') + suffix; };

      if (reduceMotion) { el.textContent = format(target); return; }

      var start = null;
      var duration = 1500;
      function step(now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(Math.round(target * eased));
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
        });
      }, { threshold: 0.4 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(run);
    }
  }

  /* ------------------------------------------------------ CURSOR LUMINOSO */
  function cursorGlow() {
    if (reduceMotion || isTouch) return;
    var glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    var x = window.innerWidth / 2, y = window.innerHeight / 2, tx = x, ty = y, shown = false;

    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; glow.style.opacity = '1'; }
    });
    document.addEventListener('mouseleave', function () { glow.style.opacity = '0'; });

    (function loop() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)';
      window.requestAnimationFrame(loop);
    })();
  }

  /* --------------------------------------------------------- INICIALIZAÇÃO */
  function init() {
    try { burger(); } catch (e) { }
    try { navScroll(); } catch (e) { }
    try { activeLink(); } catch (e) { }
    try { progressBar(); } catch (e) { }
    try { toTop(); } catch (e) { }
    try { reveal(); } catch (e) { }
    try { tilt(); } catch (e) { }
    try { parallaxScenes(); } catch (e) { }
    try { magnetic(); } catch (e) { }
    try { counters(); } catch (e) { }
    try { cursorGlow(); } catch (e) { }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
