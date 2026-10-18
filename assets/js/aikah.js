/* =============================================================================
   AIKAH — interaction layer
   No dependencies. Lenis (smooth scroll) is optional and detected at runtime.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ---------------------------------------------------------------------------
     Preloader + smooth scroll bootstrap
     ------------------------------------------------------------------------ */
  const preloader = $('#preloader');
  const preloaderFill = $('#preloader-fill');
  const preloaderPct = $('#preloader-pct');

  const state = { ready: false, progress: 0, target: 0 };

  const paintProgress = () => {
    const pct = Math.round(state.progress);
    if (preloaderFill) preloaderFill.style.width = `${pct}%`;
    if (preloaderPct) preloaderPct.textContent = String(pct).padStart(3, '0');
  };

  const tickProgress = () => {
    state.target = Math.min(state.target + 2 + Math.random() * 5, 100);
    state.progress = lerp(state.progress, state.target, 0.14);
    paintProgress();

    if (state.target < 100 || state.progress < 99.4) {
      requestAnimationFrame(tickProgress);
    } else {
      state.progress = 100;
      paintProgress();
      finishPreload();
    }
  };

  const finishPreload = () => {
    if (state.ready) return;
    state.ready = true;

    preloader?.classList.add('is-done');
    lenis?.start();

    // Reveal the hero only after the curtain lifts, so the entrance reads as one move.
    window.setTimeout(() => {
      initReveals();
      document.body.classList.add('is-ready');
    }, reduceMotion ? 0 : 220);

    window.setTimeout(() => preloader?.remove(), 1200);
  };

  /* ---------------------------------------------------------------------------
     Lenis — cinematic smooth scrolling (graceful fallback to native)
     ------------------------------------------------------------------------ */
  let lenis = null;

  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      smoothWheel: true,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    lenis.stop();
  }

  /* ---------------------------------------------------------------------------
     Split headings into word masks for staggered reveal
     ------------------------------------------------------------------------ */
  const splitHeading = (el) => {
    if (el.dataset.split === 'done') return;
    el.dataset.split = 'done';

    const text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;

    el.setAttribute('aria-label', text);

    const frag = document.createDocumentFragment();
    text.split(' ').forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');
      outer.style.setProperty('--delay', `${i * 55}ms`);

      const inner = document.createElement('span');
      inner.className = 'word__inner';
      inner.textContent = word;

      outer.appendChild(inner);
      frag.appendChild(outer);
      frag.appendChild(document.createTextNode(' '));
    });

    el.textContent = '';
    el.appendChild(frag);
  };

  /* ---------------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------------ */
  const initReveals = () => {
    const targets = [
      ...$$('[data-reveal]'),
      ...$$('[data-split]:not([data-reveal])'),
      ...$$('.rule-draw'),
    ];

    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
    );

    targets.forEach((el) => io.observe(el));
  };

  $$('[data-split]').forEach(splitHeading);

  /* ---------------------------------------------------------------------------
     Header — condense on scroll, hide when moving down
     ------------------------------------------------------------------------ */
  const header = $('#site-header');
  let lastY = window.scrollY;

  const onScrollHeader = (y) => {
    if (!header) return;
    header.classList.toggle('is-stuck', y > 24);

    const goingDown = y > lastY && y > 260;
    header.classList.toggle('is-hidden', goingDown);
    lastY = y;
  };

  if (lenis) lenis.on('scroll', ({ scroll }) => onScrollHeader(scroll));
  else window.addEventListener('scroll', () => onScrollHeader(window.scrollY), { passive: true });

  /* ---------------------------------------------------------------------------
     Starfield — twinkling canvas with scroll parallax
     ------------------------------------------------------------------------ */
  const initStarfield = () => {
    const canvas = $('#starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let visible = true;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = clamp(window.devicePixelRatio || 1, 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = clamp(Math.round((w * h) / 9000), 90, 340);
      stars = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.25 + depth * 1.05,
          depth,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.1,
          warm: Math.random() > 0.82,
        };
      });
    };

    const draw = (time) => {
      if (visible) {
        const scroll = window.scrollY || 0;
        ctx.clearRect(0, 0, w, h);

        for (const s of stars) {
          const twinkle = 0.45 + 0.55 * Math.sin(time * 0.0011 * s.speed + s.phase);
          const y = s.y - scroll * (0.04 + s.depth * 0.1);
          const wrapped = ((y % h) + h) % h;

          ctx.beginPath();
          ctx.arc(s.x, wrapped, s.r, 0, Math.PI * 2);
          ctx.fillStyle = s.warm
            ? `rgba(198, 224, 255, ${0.55 * twinkle})`
            : `rgba(255, 255, 255, ${0.75 * twinkle})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };

    build();
    requestAnimationFrame(draw);

    window.addEventListener('resize', build, { passive: true });

    // Stop painting when the hero scrolls away.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0 }
      ).observe(canvas);
    }
  };

  /* ---------------------------------------------------------------------------
     Parallax layers

     Uses the independent CSS `translate` property rather than `transform`, so it
     composes with Tailwind's centering transforms instead of overwriting them.
     ------------------------------------------------------------------------ */
  const supportsTranslateProp =
    typeof CSS !== 'undefined' && CSS.supports && CSS.supports('translate', '0 1px');

  const initParallax = () => {
    if (reduceMotion || !supportsTranslateProp) return;
    const layers = $$('[data-parallax]');
    if (!layers.length) return;

    let ticking = false;

    const apply = () => {
      const y = window.scrollY || 0;
      layers.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax) || 0;
        const max = parseFloat(el.dataset.parallaxMax);
        let offset = -y * speed;
        if (!Number.isNaN(max)) offset = clamp(offset, -max, max);
        el.style.translate = `0 ${offset.toFixed(2)}px`;
      });
      ticking = false;
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
  };

  /* ---------------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------------ */
  const initCursor = () => {
    if (!finePointer || reduceMotion) return;

    const ring = $('#cursor');
    const dot = $('#cursor-dot');
    const label = $('#cursor-label');
    if (!ring || !dot) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    const dotPos = { ...target };

    const move = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      ring.style.opacity = '1';
      dot.style.opacity = '1';
    };

    const animate = () => {
      ringPos.x = lerp(ringPos.x, target.x, 0.14);
      ringPos.y = lerp(ringPos.y, target.y, 0.14);
      dotPos.x = lerp(dotPos.x, target.x, 0.4);
      dotPos.y = lerp(dotPos.y, target.y, 0.4);

      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%)`;

      if (label && label.classList.contains('is-active')) {
        label.style.left = `${ringPos.x}px`;
        label.style.top = `${ringPos.y}px`;
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', move, { passive: true });
    requestAnimationFrame(animate);

    const setLabel = (text) => {
      if (!label) return;
      label.textContent = text || '';
      label.classList.toggle('is-active', Boolean(text));
      ring.classList.toggle('is-active', Boolean(text));
    };

    document.addEventListener('mouseover', (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-cursor]') : null;
      setLabel(el ? el.dataset.cursor : '');
    });

    document.addEventListener('mouseleave', () => {
      ring.style.opacity = '0';
      dot.style.opacity = '0';
    });
  };

  /* ---------------------------------------------------------------------------
     Spotlight glow — pointer position drives the panel gradient
     ------------------------------------------------------------------------ */
  const initSpotlight = () => {
    if (!finePointer) return;

    $$('.panel--glow').forEach((panel) => {
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        panel.style.setProperty('--mx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        panel.style.setProperty('--my', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      });
    });
  };

  /* ---------------------------------------------------------------------------
     Hero graphic — reacts to pointer position
     ------------------------------------------------------------------------ */
  const initMouseParallax = () => {
    if (!finePointer || reduceMotion) return;

    const els = $$('[data-mouse-parallax]');
    if (!els.length) return;

    const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let current = { ...pointer };
    let raf = 0;

    const loop = () => {
      current.x = lerp(current.x, pointer.x, 0.055);
      current.y = lerp(current.y, pointer.y, 0.055);

      const nx = (current.x / window.innerWidth - 0.5) * 2;
      const ny = (current.y / window.innerHeight - 0.5) * 2;

      els.forEach((el) => {
        const amount = parseFloat(el.dataset.mouseParallax) || 12;
        el.style.translate = `${(-nx * amount).toFixed(2)}px ${(-ny * amount).toFixed(2)}px`;
      });

      raf = requestAnimationFrame(loop);
    };

    window.addEventListener(
      'mousemove',
      (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
      },
      { passive: true }
    );

    raf = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    });
  };

  /* ---------------------------------------------------------------------------
     Subtle 3D tilt
     ------------------------------------------------------------------------ */
  const initTilt = () => {
    if (!finePointer || reduceMotion) return;

    $$('[data-tilt], [data-tilt-card]').forEach((el) => {
      const max = el.hasAttribute('data-tilt-card') ? 3.2 : 7;

      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = `perspective(1100px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`;
      };

      const onLeave = () => {
        el.style.transition = 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.transform = 'perspective(1100px) rotateY(0deg) rotateX(0deg)';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  };

  /* ---------------------------------------------------------------------------
     Anchor navigation via Lenis (keeps easing consistent)
     ------------------------------------------------------------------------ */
  const initAnchors = () => {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const targetEl = document.querySelector(id);
        if (!targetEl) return;

        e.preventDefault();
        if (lenis) lenis.scrollTo(targetEl, { offset: -72, duration: 1.35 });
        else targetEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  };

  /* ---------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  initStarfield();
  initParallax();
  initMouseParallax();
  initCursor();
  initSpotlight();
  initTilt();
  initAnchors();

  if (reduceMotion) {
    state.target = 100;
    state.progress = 100;
    paintProgress();
    finishPreload();
  } else {
    requestAnimationFrame(tickProgress);
    // Hard ceiling so a stalled asset can never trap the visitor behind the curtain.
    window.setTimeout(finishPreload, 2600);
  }
})();
