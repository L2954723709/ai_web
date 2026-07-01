/**
 * effects.js — All visual effects and interactions
 * Cursor glow, raster strips, floating bubbles, scroll reveal,
 * counter animation, typewriter, 3D tilt, magnetic buttons,
 * navigation scroll, parallax, form submit.
 */
const Effects = (function() {
  'use strict';

  // ---- Raster Strips ----
  function buildRaster() {
    const overlay = document.getElementById('rasterOverlay');
    if (!overlay || window.innerWidth <= 768) return;
    let html = '';
    for (let i = 0; i < 28; i++) html += '<div class="raster-strip"></div>';
    overlay.innerHTML = html;
  }

  // ---- Floating Bubbles ----
  function buildBubbles() {
    if (window.innerWidth <= 768) return;
    const container = document.getElementById('floatBubbles');
    if (!container) return;
    const icons = ['🧠','💻','🤖','📊','🔬','⚡','🎯','🌐'];
    const positions = [
      { left:'8%', top:'25%' },{ left:'18%', top:'55%' },
      { left:'78%', top:'20%' },{ left:'85%', top:'60%' },
      { left:'5%', top:'75%' },{ left:'90%', top:'78%' },
      { left:'45%', top:'12%' },{ left:'55%', top:'85%' },
    ];
    positions.forEach((pos, i) => {
      const b = document.createElement('div');
      b.className = 'bubble';
      b.style.cssText = `left:${pos.left};top:${pos.top};animation:bubbleDrift ${6+i*1.5}s ease-in-out ${i*0.5}s infinite;`;
      b.innerHTML = `<div class="glow-ring" style="animation-delay:${i*0.3}s"></div><div class="icon-inner">${icons[i]}</div>`;
      container.appendChild(b);
    });
  }

  // ---- Cursor Glow ----
  function initCursorGlow() {
    if (window.innerWidth <= 768) return;
    const glow = document.getElementById('cursorGlow');
    if (!glow) return;
    let mx = -1000, my = -1000, tx = -1000, ty = -1000;
    document.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    document.addEventListener('touchmove', e => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    (function update() {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      glow.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      glow.style.opacity = tx < 0 ? '0' : '1';
      requestAnimationFrame(update);
    })();
  }

  // ---- Scroll Reveal (IntersectionObserver) ----
  function initReveal() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  // ---- Counter Animation ----
  function initCounters() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.getAttribute('data-count'));
        if (isNaN(target)) return;
        const dur = 2200, start = performance.now();
        (function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
          const plusEl = el.querySelector('.plus');
          el.innerHTML = val + (plusEl ? '<span class="plus">+</span>' : '');
          if (p < 1) requestAnimationFrame(tick);
          else el.innerHTML = target + (plusEl ? '<span class="plus">+</span>' : '');
        })(start);
        obs.unobserve(el);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
  }

  // ---- Typewriter ----
  function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const words = [
      '在大模型时代探索智能的边界',
      '用代码构建未来的AI应用',
      '让机器学习变得触手可及',
      '连接每一个热爱AI的灵魂',
      '从这里，走向AI的星辰大海',
    ];
    let wi = 0, ci = 0, deleting = false;
    (function type() {
      const cur = words[wi];
      if (!deleting) {
        el.textContent = cur.substring(0, ci + 1);
        ci++;
        if (ci === cur.length) { setTimeout(() => { deleting = true; type(); }, 2000); return; }
      } else {
        el.textContent = cur.substring(0, ci - 1);
        ci--;
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      }
      setTimeout(type, deleting ? 35 : 65);
    })();
  }

  // ---- 3D Tilt ----
  function initTilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const rx = (y - r.height / 2) / (r.height / 2) * -12;
        const ry = (x - r.width / 2) / (r.width / 2) * 12;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-10px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
      });
    });
  }

  // ---- Magnetic Buttons ----
  function initMagnetic() {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        if (typeof gsap !== 'undefined') {
          gsap.to(btn, { x: x * 0.28, y: y * 0.28, duration: 0.4, ease: 'power2.out' });
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' });
        }
      });
    });
  }

  // ---- Navigation ----
  function initNavigation() {
    const nav = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!nav || !toggle || !links) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });

    toggle.addEventListener('click', () => {
      links.classList.toggle('mobile-on');
      toggle.classList.toggle('active');
    });

    document.querySelectorAll('[data-nav]').forEach(a => {
      a.addEventListener('click', () => {
        links.classList.remove('mobile-on');
        toggle.classList.remove('active');
      });
    });
  }

  // ---- Parallax on Scroll ----
  function initParallax() {
    window.addEventListener('scroll', () => {
      const sy = window.scrollY;
      document.querySelectorAll('.glass-card, .member-card').forEach((el, i) => {
        const old = el.style.transform || '';
        const clean = old.replace(/translateY\([^)]*\)/g, '').trim();
        el.style.transform = clean + ` translateY(${sy * (0.02 + i * 0.008) * 0.3}px)`;
      });
    }, { passive: true });
  }

  // ---- Form Submit ----
  function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (!btn) return;
      const origHTML = btn.innerHTML;
      btn.innerHTML = '✓ 发送成功！';
      btn.style.background = 'linear-gradient(135deg, #00ffc8, #00c6ff)';
      btn.style.boxShadow = '0 4px 30px rgba(0,255,200,0.3)';
      setTimeout(() => {
        btn.innerHTML = origHTML;
        btn.style.background = '';
        btn.style.boxShadow = '';
        form.reset();
      }, 3000);
    });
  }

  // ---- Full Init ----
  function init() {
    buildRaster();
    buildBubbles();
    initCursorGlow();
    initReveal();
    initCounters();
    initTypewriter();
    initTilt();
    initMagnetic();
    initNavigation();
    initParallax();
    initForm();
  }

  return { init };
})();
