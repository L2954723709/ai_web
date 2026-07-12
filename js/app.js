(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

  function safeAnimate(el, frames, options) {
    if (!el || !el.animate) return null;
    try { return el.animate(frames, options); } catch (e) { return null; }
  }

  function safeSetPointerCapture(el, pointerId) {
    if (!el || !el.setPointerCapture) return;
    try { el.setPointerCapture(pointerId); } catch (e) {}
  }

  function safeStorageGet(key, fallback) {
    try { return window.localStorage ? window.localStorage.getItem(key) || fallback : fallback; }
    catch (e) { return fallback; }
  }

  function safeStorageSet(key, value) {
    try { if (window.localStorage) window.localStorage.setItem(key, value); }
    catch (e) {}
  }

  function setPagePerformanceMode(active) {
    var next = !!active;
    if (document.body.classList.contains('game-performance-mode') === next) return;
    document.body.classList.toggle('game-performance-mode', next);
    try { document.dispatchEvent(new CustomEvent('ai:performance-mode', { detail: { active: next } })); }
    catch (e) {
      var ev = document.createEvent('Event');
      ev.initEvent('ai:performance-mode', false, false);
      document.dispatchEvent(ev);
    }
  }

  function showToast(message) {
    var toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  function initNav() {
    var nav = $('#navbar');
    var toggle = $('#navToggle');
    var links = $('#navLinks');
    if (!nav || !toggle || !links) return;

    function onScroll() {
      nav.classList.toggle('scrolled', window.scrollY > 40);
      var current = '';
      $$('main section[id]').forEach(function (section) {
        if (section.getBoundingClientRect().top < window.innerHeight * 0.42) current = section.id;
      });
      $$('#navLinks a').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }

    toggle.addEventListener('click', function () {
      var open = !links.classList.contains('mobile-on');
      links.classList.toggle('mobile-on', open);
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });

    $$('[data-nav]').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('mobile-on');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  function initCounters() {
    var counters = $$('[data-count]');
    if (!counters.length) return;
    var started = false;
    function run() {
      if (started) return;
      started = true;
      counters.forEach(function (el) {
        var target = Number(el.dataset.count || 0);
        var start = performance.now();
        function tick(now) {
          var p = Math.min(1, (now - start) / 1200);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
    if (!('IntersectionObserver' in window)) return run();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run();
          observer.disconnect();
        }
      });
    });
    observer.observe(counters[0]);
  }

  function initPointerEffects() {
    var orb = $('#cursorOrb');
    var x = window.innerWidth / 2;
    var y = window.innerHeight / 2;
    var tx = x;
    var ty = y;
    if (orb && !prefersReducedMotion && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        tx = e.clientX;
        ty = e.clientY;
      }, { passive: true });
      (function loop() {
        x += (tx - x) * 0.14;
        y += (ty - y) * 0.14;
        orb.style.transform = 'translate3d(' + (x - 210) + 'px,' + (y - 210) + 'px,0)';
        requestAnimationFrame(loop);
      })();
    }

    $$('[data-tilt]').forEach(function (card) {
      if (prefersReducedMotion || !window.matchMedia('(pointer:fine)').matches) return;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 10;
        var ry = (px - 0.5) * 12;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        card.style.transform = 'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });

    $$('.magnetic').forEach(function (btn) {
      if (prefersReducedMotion || !window.matchMedia('(pointer:fine)').matches) return;
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - r.left - r.width / 2;
        var dy = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.18).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  function initNeuralBackground() {
    var canvas = $('#neuralBg');
    if (!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    var w = 0, h = 0, dpr = 1, tick = 0, particles = [], bgRaf = 0;
    var isMobileBg = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
    var count = prefersReducedMotion ? 18 : (isMobileBg ? 22 : 72);

    function resize() {
      isMobileBg = window.matchMedia('(max-width: 700px), (pointer: coarse)').matches;
      count = prefersReducedMotion ? 18 : (isMobileBg ? 22 : 72);
      dpr = Math.min(isMobileBg ? 1.25 : 2, window.devicePixelRatio || 1);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.42 * dpr,
          vy: (Math.random() - 0.5) * 0.42 * dpr,
          r: (1 + Math.random() * 2.2) * dpr,
          hue: Math.random() > 0.5 ? 186 : 286
        });
      }
    }

    function backgroundActive() {
      return !prefersReducedMotion && !document.hidden && !document.body.classList.contains('game-performance-mode');
    }

    function scheduleBackground() {
      if (!bgRaf && backgroundActive()) bgRaf = requestAnimationFrame(draw);
    }

    function draw() {
      bgRaf = 0;
      if (!backgroundActive()) return;
      tick += 1;
      ctx.clearRect(0, 0, w, h);
      var grad = ctx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.46, Math.max(w, h) * 0.62);
      grad.addColorStop(0, 'rgba(0,245,255,0.085)');
      grad.addColorStop(0.45, 'rgba(138,92,255,0.045)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (!prefersReducedMotion) {
          p.x += p.vx + Math.sin((tick + i) * 0.01) * 0.08 * dpr;
          p.y += p.vy + Math.cos((tick + i) * 0.012) * 0.08 * dpr;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.fillStyle = p.hue === 186 ? 'rgba(0,245,255,.72)' : 'rgba(255,61,242,.58)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        for (var j = i + 1; j < particles.length; j += (isMobileBg ? 2 : 1)) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var max = (isMobileBg ? 92 : 135) * dpr;
          if (dist < max) {
            ctx.strokeStyle = 'rgba(0,245,255,' + ((1 - dist / max) * 0.16).toFixed(3) + ')';
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      scheduleBackground();
    }

    resize();
    window.addEventListener('resize', function () { resize(); scheduleBackground(); }, { passive: true });
    document.addEventListener('visibilitychange', scheduleBackground);
    document.addEventListener('ai:performance-mode', scheduleBackground);
    if (prefersReducedMotion) {
      ctx.clearRect(0, 0, w, h);
    } else {
      scheduleBackground();
    }
  }

  var galleryData = [
    { src: 'assets/images/gallery/gallery-01.jpg', thumb: 'assets/images/gallery/thumbs/gallery-01-thumb.webp', title: 'AI 神经网络可视化', cat: 'ai', desc: '深度神经网络的拓扑结构可视化', shape: 'wide' },
    { src: 'assets/images/gallery/gallery-02.jpg', thumb: 'assets/images/gallery/thumbs/gallery-02-thumb.webp', title: '机器学习工作坊', cat: 'event', desc: '手把手训练第一个模型', shape: '' },
    { src: 'assets/images/gallery/gallery-03.jpg', thumb: 'assets/images/gallery/thumbs/gallery-03-thumb.webp', title: '智能机器人实验', cat: 'project', desc: '强化学习与机器人控制', shape: 'tall' },
    { src: 'assets/images/gallery/gallery-04.jpg', thumb: 'assets/images/gallery/thumbs/gallery-04-thumb.webp', title: '数据科学竞赛', cat: 'event', desc: 'Kaggle 团队协作现场', shape: '' },
    { src: 'assets/images/gallery/gallery-05.jpg', thumb: 'assets/images/gallery/thumbs/gallery-05-thumb.webp', title: '计算机视觉应用', cat: 'project', desc: '实时检测与语义分割', shape: 'wide' },
    { src: 'assets/images/gallery/gallery-06.jpg', thumb: 'assets/images/gallery/thumbs/gallery-06-thumb.webp', title: 'NLP 技术研讨', cat: 'ai', desc: '大语言模型原理探讨', shape: '' },
    { src: 'assets/images/gallery/gallery-07.jpg', thumb: 'assets/images/gallery/thumbs/gallery-07-thumb.webp', title: 'AI 创客马拉松', cat: 'event', desc: '48 小时极限编程挑战', shape: 'wide' },
    { src: 'assets/images/gallery/gallery-08.jpg', thumb: 'assets/images/gallery/thumbs/gallery-08-thumb.webp', title: '生成式 AI 艺术', cat: 'project', desc: 'Stable Diffusion 创意作品', shape: '' },
    { src: 'assets/images/gallery/gallery-09.jpg', thumb: 'assets/images/gallery/thumbs/gallery-09-thumb.webp', title: '社团技术分享会', cat: 'event', desc: '每周五的技术交流之夜', shape: '' },
    { src: 'assets/images/gallery/gallery-10.jpg', thumb: 'assets/images/gallery/thumbs/gallery-10-thumb.webp', title: '知识图谱构建', cat: 'ai', desc: '从非结构化数据到知识网络', shape: 'tall' },
    { src: 'assets/images/gallery/gallery-11.jpg', thumb: 'assets/images/gallery/thumbs/gallery-11-thumb.webp', title: '强化学习实战', cat: 'project', desc: '从游戏 AI 到工业控制', shape: 'wide' },
    { src: 'assets/images/gallery/gallery-12.jpg', thumb: 'assets/images/gallery/thumbs/gallery-12-thumb.webp', title: '年度成果展览', cat: 'event', desc: '展示一年来的 AI 研究成果', shape: '' }
  ];

  var orbitVideoBackgrounds = [
    { src: 'assets/videos/neural-loop.webm', fallback: 'assets/videos/neural-loop.mp4', poster: 'assets/videos/neural-loop-poster.webp' },
    { src: 'assets/videos/data-tunnel.webm', fallback: 'assets/videos/data-tunnel.mp4', poster: 'assets/videos/data-tunnel-poster.webp' },
    { src: 'assets/videos/orbital-core.webm', fallback: 'assets/videos/orbital-core.mp4', poster: 'assets/videos/orbital-core-poster.webp' }
  ];

  function toWebp(path) { return path.replace(/\.jpg$/i, '.webp'); }

  function initShowcase() {
    var stage = $('#cinemaStage');
    var main = $('#cinemaImage');
    var title = $('#cinemaTitle');
    var desc = $('#cinemaDesc');
    var count = $('#cinemaIndex');
    var side = $('#cinemaSide');
    var track = $('#marqueeTrack');
    if (!stage || !main || !galleryData.length) return;
    var active = 0;
    var timer = null;

    function setImage(index, fromUser) {
      active = (index + galleryData.length) % galleryData.length;
      var item = galleryData[active];
      stage.classList.add('switching');
      window.setTimeout(function () {
        main.src = toWebp(item.src);
        main.onerror = function () { imgFallback(main, item.src); };
        main.alt = item.title;
        if (title) title.textContent = item.title;
        if (desc) desc.textContent = item.desc;
        if (count) count.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(galleryData.length).padStart(2, '0');
        stage.classList.remove('switching');
      }, fromUser ? 80 : 170);
    }
    function imgFallback(img, src) { img.onerror = null; img.src = src; }

    if (side) {
      side.innerHTML = '';
      [2, 4, 7, 10].forEach(function (idx, order) {
        var item = galleryData[idx % galleryData.length];
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'float-photo';
        card.style.animationDelay = (-order * 0.7) + 's';
        card.innerHTML = '<img loading="lazy" decoding="async" alt=""><span></span>';
        $('img', card).src = item.thumb;
        $('img', card).alt = item.title;
        $('span', card).textContent = item.title;
        card.addEventListener('click', function () { setImage(idx, true); openLightbox(idx); });
        side.appendChild(card);
      });
    }

    if (track) {
      track.innerHTML = '';
      galleryData.concat(galleryData).forEach(function (item, i) {
        var realIndex = i % galleryData.length;
        var tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'marquee-tile';
        tile.setAttribute('aria-label', '查看 ' + item.title);
        tile.innerHTML = '<img loading="lazy" decoding="async" alt="">';
        $('img', tile).src = item.thumb;
        $('img', tile).alt = item.title;
        tile.addEventListener('click', function () { setImage(realIndex, true); openLightbox(realIndex); });
        track.appendChild(tile);
      });
    }

    $('.cinema-main', stage).addEventListener('click', function () { openLightbox(active); });
    function startAutoShowcase() {
      clearInterval(timer);
      timer = window.setInterval(function () {
        if (document.hidden) return;
        setImage(active + 1, false);
      }, prefersReducedMotion ? 5600 : 4200);
    }

    setImage(0, true);
    startAutoShowcase();
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) startAutoShowcase();
    });
  }

  function initGallery() {
    var filters = $('#galleryFilters');
    var grid = $('#galleryGrid');
    if (!filters || !grid) return;
    var cats = [
      { key: 'all', label: '全部' },
      { key: 'ai', label: 'AI 探索' },
      { key: 'project', label: '项目实战' },
      { key: 'event', label: '活动记录' }
    ];
    var current = 'all';

    cats.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = cat.label;
      btn.dataset.cat = cat.key;
      btn.setAttribute('role', 'tab');
      if (cat.key === 'all') btn.className = 'active';
      btn.addEventListener('click', function () {
        current = cat.key;
        $$('#galleryFilters button').forEach(function (b) { b.classList.toggle('active', b.dataset.cat === current); });
        render();
      });
      filters.appendChild(btn);
    });

    function render() {
      var items = current === 'all' ? galleryData : galleryData.filter(function (item) { return item.cat === current; });
      grid.innerHTML = '';
      items.forEach(function (item, index) {
        var realIndex = galleryData.indexOf(item);
        var card = document.createElement('article');
        card.className = 'gallery-item ' + item.shape;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', '打开图片：' + item.title);
        card.innerHTML = '<img alt="" loading="lazy" decoding="async"><div class="gallery-meta"><strong></strong><span></span></div>';
        var img = $('img', card);
        $('strong', card).textContent = item.title;
        $('span', card).textContent = item.desc;
        img.src = item.thumb;
        img.alt = item.title;
        img.onload = function () { card.classList.add('loaded'); };
        if (img.complete) card.classList.add('loaded');
        function open() { openLightbox(realIndex); }
        card.addEventListener('click', open);
        card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        grid.appendChild(card);
        setTimeout(function () { card.classList.add('show'); }, 35 + index * 45);
      });
    }

    buildLightbox();
    render();
  }


  function initMemoryOrbit() {
    var scene = $('#memoryOrbit');
    if (!scene || !galleryData || !galleryData.length) return;
    buildLightbox();
    var stage = $('[data-memory-stage]', scene);
    var slides = $('[data-memory-slides]', scene);
    var backdrop = $('[data-memory-backdrop]', scene);
    var lanes = $$('[data-memory-lane]', scene);
    var orb = $('[data-memory-orb]', scene);
    var home = $('[data-memory-home]', scene);
    var particles = $('[data-memory-particles]', scene);
    if (!stage || !lanes.length) return;

    var isSmall = window.matchMedia('(max-width: 700px)').matches;
    var radiusScale = 1;
    var drumAngles = [0, 0, 0];
    var viewRx = isSmall ? -5 : -6;
    var viewRy = 0;
    var drumLast = 0;
    var drumPaintLast = 0;
    var drumRaf = 0;
    var activeBg = 0;
    var bgTimer = 0;
    var particleSmallMode = null;
    var sceneVisible = true;

    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

    function rowItems(row) {
      var count = isSmall ? 8 : 12;
      var offset = row * 4;
      var list = [];
      for (var i = 0; i < count; i++) list.push(galleryData[(offset + i) % galleryData.length]);
      return list;
    }

    function baseRadius() {
      var width = scene.clientWidth || window.innerWidth;
      var base = isSmall ? width * 0.34 : width * 0.36;
      return clamp(base * radiusScale, isSmall ? 150 : 290, isSmall ? 330 : 670);
    }

    function laneY(row) {
      return (row - 1) * (isSmall ? 92 : 124);
    }

    function applyLaneTransform(lane, row) {
      var y = lane.style.getPropertyValue('--lane-y') || '0px';
      var angle = drumAngles[row];
      lane.style.transform = 'translate3d(0,' + y + ',0) rotateY(' + angle.toFixed(3) + 'deg)';
    }

    function applyAllLanes() {
      lanes.forEach(function (lane, row) { applyLaneTransform(lane, row); });
    }

    function applyStageView() {
      stage.style.setProperty('--view-rx', viewRx.toFixed(2) + 'deg');
      stage.style.setProperty('--view-ry', viewRy.toFixed(2) + 'deg');
      if (orb) {
        orb.style.setProperty('--orb-rx', (-viewRx).toFixed(2) + 'deg');
        orb.style.setProperty('--orb-ry', viewRy.toFixed(2) + 'deg');
      }
    }

    function resetStageView() {
      viewRx = isSmall ? -5 : -6;
      viewRy = 0;
      applyStageView();
      safeAnimate(stage, [
        { filter: 'drop-shadow(0 0 0 rgba(0,245,255,0))' },
        { filter: 'drop-shadow(0 0 32px rgba(0,245,255,.55))' },
        { filter: 'drop-shadow(0 0 0 rgba(0,245,255,0))' }
      ], { duration: 520, easing: 'ease-out' });
    }

    function buildParticles() {
      if (!particles) return;
      var small = window.matchMedia('(max-width: 700px)').matches;
      if (particles.children.length && particleSmallMode === small) return;
      particleSmallMode = small;
      particles.innerHTML = '';
      var total = small ? 18 : 42;
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('i');
        var ring = i % 3;
        var r0 = small ? 104 : 158;
        var r1 = small ? 134 : 194;
        var r2 = small ? 166 : 232;
        dot.style.setProperty('--a', (i * 360 / total).toFixed(2) + 'deg');
        dot.style.setProperty('--r', (ring === 0 ? r0 : ring === 1 ? r1 : r2) + 'px');
        dot.style.setProperty('--z', ((i % 7) - 3) * (small ? 10 : 16) + 'px');
        dot.style.setProperty('--s', (small ? (ring === 0 ? 3 : 2) : (ring === 0 ? 4 : ring === 1 ? 3 : 2)) + 'px');
        dot.style.setProperty('--d', (-i * 0.18).toFixed(2) + 's');
        particles.appendChild(dot);
      }
    }

    function drumActive() {
      return sceneVisible && !document.hidden && !document.body.classList.contains('game-performance-mode');
    }

    function scheduleDrum() {
      if (!drumRaf && drumActive()) drumRaf = requestAnimationFrame(tickDrum);
    }

    function tickDrum(now) {
      drumRaf = 0;
      if (!drumActive()) {
        drumLast = 0;
        return;
      }
      if (isSmall && drumPaintLast && now - drumPaintLast < 33) {
        scheduleDrum();
        return;
      }
      drumPaintLast = now;
      if (!drumLast) drumLast = now;
      var dt = Math.min(isSmall ? 66 : 48, now - drumLast) / 1000;
      drumLast = now;
      var speeds = isSmall ? [-18, 22, -18] : [-14, 18, -14];
      lanes.forEach(function (lane, row) {
        drumAngles[row] = (drumAngles[row] + speeds[row] * dt) % 360;
        applyLaneTransform(lane, row);
      });
      var core = $('.memory-orbit-core', scene);
      if (core) core.style.setProperty('--core-spin', ((now * 0.018) % 360).toFixed(2) + 'deg');
      scheduleDrum();
    }

    function videoBgActive() {
      return !document.hidden && !document.body.classList.contains('game-performance-mode') && !(navigator.connection && navigator.connection.saveData);
    }

    function playOrbitVideo(video) {
      if (!video || !videoBgActive()) return;
      if (!video.dataset.loaded) { video.load(); video.dataset.loaded = '1'; }
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    function setBackground(index) {
      if (!slides) return;
      var videos = $$('video', slides);
      if (!videos.length) return;
      activeBg = (index + videos.length) % videos.length;
      var activeVideo = videos[activeBg];
      if (activeVideo && activeVideo.poster) {
        slides.style.setProperty('--orbit-bg-poster', 'url("' + activeVideo.poster + '")');
        if (backdrop && backdrop.getAttribute('src') !== activeVideo.poster) backdrop.src = activeVideo.poster;
      }
      videos.forEach(function (video, i) {
        var on = i === activeBg;
        video.classList.toggle('is-on', on);
        if (on) playOrbitVideo(video);
        else video.pause();
      });
    }

    function randomBackground() {
      if (!slides) return;
      var videos = $$('video', slides);
      if (!videos.length) return;
      var next = activeBg;
      if (videos.length > 1) {
        while (next === activeBg) next = Math.floor(Math.random() * videos.length);
      }
      setBackground(next);
    }

    function syncVideoBackgrounds() {
      if (!slides) return;
      var videos = $$('video', slides);
      if (!videos.length) return;
      if (!videoBgActive()) { videos.forEach(function (video) { video.pause(); }); return; }
      setBackground(activeBg);
    }

    function buildSlides() {
      if (!slides || slides.children.length) return;
      orbitVideoBackgrounds.forEach(function (item, i) {
        var video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = i === 0 ? 'metadata' : 'none';
        video.poster = item.poster;
        video.setAttribute('aria-hidden', 'true');
        video.dataset.src = item.src;
        video.dataset.fallback = item.fallback;
        var source = document.createElement('source');
        source.src = item.src;
        source.type = 'video/webm';
        video.appendChild(source);
        var fallback = document.createElement('source');
        fallback.src = item.fallback;
        fallback.type = 'video/mp4';
        video.appendChild(fallback);
        if (i === 0) video.className = 'is-on';
        slides.appendChild(video);
      });
      setBackground(0);
      bgTimer = window.setInterval(function () { if (videoBgActive()) randomBackground(); }, 4200);
    }

    function setZoom(nextScale) {
      radiusScale = clamp(nextScale, 0.78, 1.28);
      var radius = baseRadius();
      lanes.forEach(function (lane) {
        lane.style.setProperty('--drum-radius', radius.toFixed(1) + 'px');
        $$('.memory-orbit-card', lane).forEach(function (card) {
          card.style.setProperty('--radius', radius.toFixed(1) + 'px');
        });
      });
    }

    function buildLane(lane, row) {
      var items = rowItems(row);
      var radius = baseRadius();
      lane.innerHTML = '';
      lane.style.setProperty('--lane-y', laneY(row) + 'px');
      lane.style.setProperty('--drum-radius', radius.toFixed(1) + 'px');
      lane.classList.toggle('reverse', row === 1);
      items.forEach(function (item, i) {
        var index = galleryData.indexOf(item);
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'memory-orbit-card';
        card.setAttribute('aria-label', item.title);
        card.style.setProperty('--angle', (i * 360 / items.length).toFixed(2) + 'deg');
        card.style.setProperty('--radius', radius.toFixed(1) + 'px');
        card.innerHTML = '<img loading="lazy" decoding="async" alt="">';
        var img = $('img', card);
        img.src = item.thumb || toWebp(item.src);
        img.alt = item.title;
        card.addEventListener('click', function () { openLightbox(index); });
        lane.appendChild(card);
      });
      applyLaneTransform(lane, row);
    }

    function build() {
      isSmall = window.matchMedia('(max-width: 700px)').matches;
      lanes.forEach(buildLane);
      buildParticles();
      setZoom(radiusScale);
      viewRx = clamp(viewRx, isSmall ? -24 : -32, isSmall ? 18 : 24);
      applyAllLanes();
      applyStageView();
    }

    $$('[data-memory-zoom]', scene).forEach(function (btn) {
      btn.addEventListener('click', function () {
        setZoom(radiusScale + (btn.dataset.memoryZoom === 'in' ? 0.08 : -0.08));
        safeAnimate(scene, [{ transform: 'scale(1)' }, { transform: 'scale(1.006)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
      });
    });

    if (home) home.addEventListener('click', resetStageView);

    if (orb) {
      var orbDragging = false;
      var orbX = 0;
      var orbY = 0;
      function endOrbDrag() {
        orbDragging = false;
        orb.classList.remove('is-dragging');
      }
      orb.addEventListener('pointerdown', function (e) {
        orbDragging = true;
        orbX = e.clientX;
        orbY = e.clientY;
        orb.classList.add('is-dragging');
        safeSetPointerCapture(orb, e.pointerId);
        e.preventDefault();
      });
      orb.addEventListener('pointermove', function (e) {
        if (!orbDragging) return;
        var dx = e.clientX - orbX;
        var dy = e.clientY - orbY;
        orbX = e.clientX;
        orbY = e.clientY;
        viewRy = (viewRy + dx * 0.24) % 360;
        viewRx = clamp(viewRx - dy * 0.2, isSmall ? -24 : -32, isSmall ? 18 : 24);
        applyStageView();
        e.preventDefault();
      });
      orb.addEventListener('pointerup', endOrbDrag);
      orb.addEventListener('pointercancel', endOrbDrag);
      orb.addEventListener('lostpointercapture', endOrbDrag);
      orb.addEventListener('dblclick', resetStageView);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        sceneVisible = entries[0] ? entries[0].isIntersecting : true;
        scheduleDrum();
        syncVideoBackgrounds();
      }, { rootMargin: '220px 0px' });
      observer.observe(scene);
    }

    window.addEventListener('resize', function () { build(); scheduleDrum(); }, { passive: true });
    document.addEventListener('visibilitychange', function () { scheduleDrum(); syncVideoBackgrounds(); });
    document.addEventListener('ai:performance-mode', function () { scheduleDrum(); syncVideoBackgrounds(); });
    buildSlides();
    build();
    cancelAnimationFrame(drumRaf);
    drumRaf = 0;
    drumLast = 0;
    scheduleDrum();
  }

  function buildLightbox() {
    if ($('#lightbox')) return;
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.id = 'lightbox';
    box.innerHTML = '<div class="lightbox-panel" role="dialog" aria-modal="true" aria-label="图片预览"><button class="lb-close" type="button" aria-label="关闭">×</button><button class="lb-arrow prev" type="button" aria-label="上一张">‹</button><button class="lb-arrow next" type="button" aria-label="下一张">›</button><img alt=""><div class="lightbox-caption"><div><strong></strong><span></span></div><em></em></div></div>';
    document.body.appendChild(box);
    $('.lb-close', box).addEventListener('click', closeLightbox);
    $('.lb-arrow.prev', box).addEventListener('click', function () { moveLightbox(-1); });
    $('.lb-arrow.next', box).addEventListener('click', function () { moveLightbox(1); });
    box.addEventListener('click', function (e) { if (e.target === box) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') moveLightbox(-1);
      if (e.key === 'ArrowRight') moveLightbox(1);
    });
  }

  var lightboxIndex = 0;
  function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    $('#lightbox').classList.add('open');
  }
  function closeLightbox() { var b = $('#lightbox'); if (b) b.classList.remove('open'); }
  function moveLightbox(dir) { lightboxIndex = (lightboxIndex + dir + galleryData.length) % galleryData.length; updateLightbox(); }
  function updateLightbox() {
    var box = $('#lightbox');
    var item = galleryData[lightboxIndex];
    if (!box || !item) return;
    var img = $('img', box);
    img.src = toWebp(item.src);
    img.onerror = function () { img.onerror = null; img.src = item.src; };
    img.alt = item.title;
    $('.lightbox-caption strong', box).textContent = item.title;
    $('.lightbox-caption span', box).textContent = item.desc;
    $('.lightbox-caption em', box).textContent = (lightboxIndex + 1) + ' / ' + galleryData.length;
  }

  function initMembers() {
    var grid = $('#membersGrid');
    if (!grid) return;
    var members = [
      { name: '林同学', role: 'Prompt Engineer', img: 'assets/images/team/member-01.jpg', tags: ['Agent', 'RAG'] },
      { name: '周同学', role: 'Vision Developer', img: 'assets/images/team/member-02.jpg', tags: ['CV', 'VLM'] },
      { name: '陈同学', role: 'AIGC Designer', img: 'assets/images/team/member-03.jpg', tags: ['Image', 'Motion'] },
      { name: '许同学', role: 'Frontend Hacker', img: 'assets/images/team/member-04.jpg', tags: ['Canvas', 'Deploy'] }
    ];
    grid.innerHTML = '';
    members.forEach(function (m) {
      var card = document.createElement('article');
      card.className = 'member-card reveal';
      card.innerHTML = '<div class="member-avatar"><img loading="lazy" decoding="async" alt=""></div><h3></h3><p></p><div class="member-tags"></div>';
      var img = $('img', card);
      img.src = toWebp(m.img);
      img.onerror = function () { img.onerror = null; img.src = m.img; };
      img.alt = m.name + '头像';
      $('h3', card).textContent = m.name;
      $('p', card).textContent = m.role;
      m.tags.forEach(function (t) { var s = document.createElement('span'); s.textContent = t; $('.member-tags', card).appendChild(s); });
      grid.appendChild(card);
    });
  }

  function initJoinActions() {
    var copyBtn = $('#copyEmail');
    var pulseBtn = $('#pulseSignal');
    var email = $('#clubEmail');
    if (copyBtn && email) {
      copyBtn.addEventListener('click', function () {
        var text = email.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () { showToast('邮箱已复制：' + text); }).catch(function () { fallbackCopy(text); });
        } else {
          fallbackCopy(text);
        }
      });
    }
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('邮箱已复制：' + text); }
      catch (e) { showToast('复制失败，请手动复制邮箱'); }
      document.body.removeChild(ta);
    }
    if (pulseBtn) {
      pulseBtn.addEventListener('click', function () {
        safeAnimate(document.documentElement, [
          { filter: 'saturate(1)' },
          { filter: 'saturate(1.8) hue-rotate(24deg)' },
          { filter: 'saturate(1)' }
        ], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)' });
        showToast('信号已点亮，欢迎接入实验舱');
      });
    }
  }


  function initGameHelp() {
    var openBtn = $('#gameHelpOpen');
    var modal = $('#gameHelpModal');
    var closeBtn = $('#gameHelpClose');
    if (!openBtn || !modal || !closeBtn) return;
    var lastFocus = null;

    function openHelp() {
      lastFocus = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('game-help-open');
      closeBtn.focus({ preventScroll: true });
    }

    function closeHelp() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('game-help-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    openBtn.addEventListener('click', openHelp);
    closeBtn.addEventListener('click', closeHelp);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeHelp(); });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeHelp();
      }
    }, true);
  }

  function initGame() {
    var canvas = $('#gameCanvas');
    var startBtn = $('#gameStart');
    var pauseBtn = $('#gamePause');
    var pulseBtn = $('#gamePulse');
    var dashBtn = $('#gameDash');
    var fullscreenBtn = $('#gameFullscreen');
    var mobilePulseBtn = $('#mobilePulseBtn');
    var mobileDashBtn = $('#mobileDashBtn');
    var mobilePauseBtn = $('#mobilePauseBtn');
    var mobileStartBtn = $('#mobileStartBtn');
    var mobileExitBtn = $('#mobileExitBtn');
    var reviveBtn = $('#gameRevive');
    var studyTimeBtn = $('#gameStudyTime');
    var gameOverChoice = $('#gameOverChoice');
    var gameOverSummary = $('#gameOverSummary');
    var gameNextRoundBtn = $('#gameNextRound');
    var joystickZone = $('#joystickZone');
    var joystickStick = $('#joystickStick');
    var gameCard = canvas ? canvas.closest('.game-card') : null;
    var gameSection = canvas ? canvas.closest('.game-section') : null;
    if (!canvas || !startBtn || !pulseBtn || !dashBtn || !fullscreenBtn || !gameCard) return;
    var ctx = canvas.getContext('2d');
    var baseGameW = 760;
    var baseGameH = 460;
    var gameW = baseGameW;
    var gameH = baseGameH;
    var renderRatio = 1;
    var scoreEl = $('#scoreValue');
    var comboEl = $('#comboValue');
    var waveEl = $('#waveValue');
    var lifeEl = $('#lifeValue');
    var pulseEl = $('#pulseValue');
    var dashEl = $('#dashValue');
    var bestEl = $('#bestValue');
    var stateEl = $('#gameState');
    var levelButtons = $$('#difficultyPanel button');
    var levels = {
      easy: { label: '简单', speed: 0.68, spawn: 1.38, lives: 5, scoreRate: 2.2, pulseGain: 10, waveTime: 15, color: '#00ffbf' },
      normal: { label: '普通', speed: 0.82, spawn: 1.08, lives: 4, scoreRate: 3.1, pulseGain: 11, waveTime: 13.2, color: '#00eaff' },
      hard: { label: '困难', speed: 1.08, spawn: 0.72, lives: 3, scoreRate: 4.3, pulseGain: 12, waveTime: 11.8, color: '#ffb14a' },
      insane: { label: '地狱', speed: 1.34, spawn: 0.50, lives: 2, scoreRate: 6.1, pulseGain: 13.5, waveTime: 10.6, color: '#ff3f68' }
    };
    var currentLevel = 'normal';
    var best = 0;
    var running = false;
    var paused = false;
    var over = false;
    var last = 0;
    var spawnTimer = 0;
    var scoreFloat = 0;
    var score = 0;
    var lives = levels.normal.lives;
    var shield = 0;
    var grace = 0;
    var runId = 0;
    var wave = 1;
    var waveClock = 0;
    var runTime = 0;
    var waveBreakTimer = 0;
    var bossDelay = 3.2;
    var bossSpawned = false;
    var bossDeck = [];
    var bossCursor = 0;
    var combo = 0;
    var comboTimer = 0;
    var pulse = 0;
    var pulseFlash = 0;
    var dashCooldown = 0;
    var pulseBurst = 0;
    var damageFlash = 0;
    var boostFlash = 0;
    var hitFlashTimer = 0;
    var keys = {};
    var pointer = { x: gameW / 2, y: gameH / 2, active: false };
    var joystick = { active: false, pointerId: null, dx: 0, dy: 0, mag: 0 };
    var player = { x: gameW / 2, y: gameH / 2, r: 16, speed: 340, faceX: 1, faceY: 0 };
    var hazards = [];
    var pickups = [];
    var particles = [];
    var rings = [];
    var bullets = [];
    var bossShots = [];
    var dangerZones = [];
    var playerTechs = [];
    var floatTexts = [];
    var gameNotices = [];
    var pendingBossDefeat = null;
    var bladeTime = 0;
    var gunTime = 0;
    var invincible = 0;
    var magnetTime = 0;
    var freezeTime = 0;
    var timeStopTime = 0;
    var speedBoostTime = 0;
    var overdriveTime = 0;
    var splitterTime = 0;
    var vampireTime = 0;
    var thornTime = 0;
    var repairTime = 0;
    var sanctuaryTime = 0;
    var echoCharges = 0;
    var itemRanks = Object.create(null);
    var pickupCount = 0;
    var rarityPity = 0;
    var siphonKills = 0;
    var synergyCooldown = 0;
    var thornRetaliateCooldown = 0;
    var dashSynergyCooldown = 0;
    var thornBurstPending = null;
    var siphonCycles = 0;
    var fireTimer = 0;
    var powerFlash = 0;
    var lastPowerName = '';
    var lastHudDomPaint = 0;
    var lastMobileFramePaint = 0;
    var lastSizeCheck = 0;
    var gameHudCache = { key: '', chips: [], width: 0, top: 0, gap: 0, chipH: 0, mobile: false };


    var quizModal = $('#quizModal');
    var quizClose = $('#quizClose');
    var quizModeEl = $('#quizMode');
    var quizScoreView = $('#quizScore');
    var quizChapter = $('#quizChapter');
    var quizDifficulty = $('#quizDifficulty');
    var quizTimer = $('#quizTimer');
    var quizTimerBar = $('#quizTimerBar');
    var quizQuestion = $('#quizQuestion');
    var quizCode = $('#quizCode');
    var quizOptions = $('#quizOptions');
    var quizFeedback = $('#quizFeedback');
    var quizFeedbackTitle = $('#quizFeedbackTitle');
    var quizExplanation = $('#quizExplanation');
    var quizNextBtn = $('#quizNext');
    var quizBank = Array.isArray(window.PYTHON_QUIZ_BANK) ? window.PYTHON_QUIZ_BANK : [];
    var quizById = Object.create(null);
    quizBank.forEach(function (item) { quizById[item.id] = item; });
    var QUIZ_KEY = 'lightCorePythonQuizV1';
    var GUARD_KEY = 'lightCorePlayGuardV1';
    var RUN_KEY = 'lightCoreDodgeRunV2';
    var GUARD_BASE_MS = 60 * 60 * 1000;
    var GUARD_REWARD_MS = 15 * 60 * 1000;
    var GUARD_REST_MS = 30 * 60 * 1000;
    var QUIZ_TIME_MS = 20 * 1000;
    var quizState = null;
    var quizTickTimer = 0;
    var guardBlocked = false;
    var guardTickAt = Date.now();
    var restoringRun = false;

    function parseStored(key, fallback) {
      try {
        var raw = safeStorageGet(key, '');
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    }

    function removeStored(key) {
      try { if (window.localStorage) window.localStorage.removeItem(key); } catch (e) {}
    }

    function saveQuizState() {
      if (quizState && quizState.active) safeStorageSet(QUIZ_KEY, JSON.stringify(quizState));
      else removeStored(QUIZ_KEY);
    }

    function randomQuizIds(count, recent) {
      var blocked = Object.create(null);
      (recent || []).forEach(function (id) { blocked[id] = true; });
      var ids = quizBank.map(function (item) { return item.id; }).filter(function (id) { return !blocked[id]; });
      for (var i = ids.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = ids[i]; ids[i] = ids[j]; ids[j] = temp;
      }
      if (ids.length < count) ids = ids.concat(quizBank.map(function (item) { return item.id; }));
      return ids.slice(0, count);
    }

    function ensureQuizQuestion() {
      if (!quizState) return null;
      var item = quizById[quizState.currentId];
      if (item) return item;
      if (!Array.isArray(quizState.queue) || !quizState.queue.length) quizState.queue = randomQuizIds(80, quizState.recent);
      quizState.currentId = quizState.queue.shift();
      quizState.deadline = Date.now() + QUIZ_TIME_MS;
      quizState.status = 'asking';
      quizState.selected = -1;
      quizState.correct = false;
      saveQuizState();
      return quizById[quizState.currentId];
    }

    function difficultyName(value) {
      return value >= 3 ? '困难' : value === 2 ? '中等' : '简单';
    }

    function renderQuiz() {
      if (!quizState || !quizModal) return;
      var item = ensureQuizQuestion();
      if (!item) {
        quizQuestion.textContent = '题库未加载，请重新打开网页。';
        return;
      }
      quizModeEl.textContent = quizState.mode === 'time' ? '学习换时' : '复活挑战';
      quizScoreView.textContent = String(quizState.score || 0);
      quizChapter.textContent = item.chapter;
      quizDifficulty.textContent = difficultyName(item.difficulty);
      quizQuestion.textContent = item.question;
      if (item.code) {
        quizCode.hidden = false;
        $('code', quizCode).textContent = item.code;
      } else {
        quizCode.hidden = true;
        $('code', quizCode).textContent = '';
      }
      quizOptions.innerHTML = '';
      item.options.forEach(function (option, index) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option';
        button.dataset.letter = String.fromCharCode(65 + index);
        button.textContent = option;
        if (quizState.status === 'feedback') {
          button.disabled = true;
          if (index === item.answer) button.classList.add('correct');
          if (!quizState.correct && index === quizState.selected) button.classList.add('wrong');
        }
        button.addEventListener('click', function () { answerQuiz(index, false); });
        quizOptions.appendChild(button);
      });
      var feedbackOn = quizState.status === 'feedback';
      quizFeedback.hidden = !feedbackOn;
      quizFeedback.classList.toggle('is-correct', feedbackOn && quizState.correct);
      quizFeedback.classList.toggle('is-wrong', feedbackOn && !quizState.correct);
      if (quizNextBtn) {
        quizNextBtn.hidden = !feedbackOn;
        quizNextBtn.textContent = feedbackOn && (quizState.score || 0) >= 5 ? '完成挑战' : '下一题';
      }
      if (feedbackOn) {
        var answerText = item.options[item.answer];
        quizFeedbackTitle.textContent = quizState.correct ? '回答正确 · +1 分' : (quizState.timedOut ? '时间到 · -1 分' : '回答错误 · -1 分');
        quizExplanation.textContent = '正确答案：' + String.fromCharCode(65 + item.answer) + ' · ' + answerText + '。' + item.explanation;
      }
      updateQuizTimer();
    }

    function mountQuizModal() {
      if (!quizModal) return;
      var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
      var host = fullscreenElement === gameCard ? gameCard : document.body;
      if (quizModal.parentNode !== host) host.appendChild(quizModal);
    }

    function openQuizModal() {
      if (!quizModal) return;
      mountQuizModal();
      quizModal.classList.add('open');
      quizModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('quiz-open');
      renderQuiz();
      clearInterval(quizTickTimer);
      quizTickTimer = window.setInterval(updateQuizTimer, 100);
    }

    function closeQuizModal() {
      if (!quizModal) return;
      quizModal.classList.remove('open');
      quizModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('quiz-open');
    }

    function suspendQuizChallenge() {
      if (!quizState || !quizState.active) {
        closeQuizModal();
        return;
      }
      var now = Date.now();
      quizState.suspended = true;
      if (quizState.status === 'asking') {
        quizState.remainingMs = Math.max(0, Math.min(QUIZ_TIME_MS, (quizState.deadline || now) - now));
        quizState.deadline = 0;
      } else if (quizState.status === 'feedback' && quizState.correct) {
        quizState.feedbackRemainingMs = Math.max(0, (quizState.feedbackUntil || now) - now);
        quizState.feedbackUntil = 0;
      }
      saveQuizState();
      clearInterval(quizTickTimer);
      closeQuizModal();
    }

    function resumeQuizChallenge() {
      if (!quizState || !quizState.suspended) return;
      var now = Date.now();
      quizState.suspended = false;
      if (quizState.status === 'asking') {
        var remaining = Number(quizState.remainingMs);
        if (!Number.isFinite(remaining)) remaining = QUIZ_TIME_MS;
        quizState.deadline = now + Math.max(0, Math.min(QUIZ_TIME_MS, remaining));
        quizState.remainingMs = 0;
      } else if (quizState.status === 'feedback' && quizState.correct) {
        var feedbackRemaining = Number(quizState.feedbackRemainingMs);
        if (!Number.isFinite(feedbackRemaining)) feedbackRemaining = 900;
        quizState.feedbackUntil = now + Math.max(0, feedbackRemaining);
        quizState.feedbackRemainingMs = 0;
      }
      saveQuizState();
    }

    function startQuizChallenge(mode) {
      if (!quizBank.length) { showToast('题库未加载'); return; }
      var stored = parseStored(QUIZ_KEY, null);
      if (stored && stored.active) quizState = stored;
      if (!quizState || !quizState.active || quizState.mode !== mode) {
        quizState = {
          version: 1, active: true, mode: mode, score: 0, queue: randomQuizIds(80, []),
          recent: [], currentId: '', deadline: 0, status: 'asking', selected: -1,
          correct: false, timedOut: false, feedbackUntil: 0, suspended: false,
          remainingMs: 0, feedbackRemainingMs: 0, startedAt: Date.now()
        };
        ensureQuizQuestion();
        saveQuizState();
      } else {
        resumeQuizChallenge();
      }
      openQuizModal();
    }

    function answerQuiz(index, timedOut) {
      if (!quizState || quizState.status !== 'asking') return;
      var item = quizById[quizState.currentId];
      if (!item) return;
      if (!timedOut && Date.now() > quizState.deadline) timedOut = true;
      var correct = !timedOut && index === item.answer;
      quizState.score = correct ? Math.min(5, (quizState.score || 0) + 1) : Math.max(0, (quizState.score || 0) - 1);
      quizState.status = 'feedback';
      quizState.selected = timedOut ? -1 : index;
      quizState.correct = correct;
      quizState.timedOut = !!timedOut;
      quizState.feedbackUntil = 0;
      quizState.recent = (quizState.recent || []).concat(item.id).slice(-80);
      saveQuizState();
      renderQuiz();
    }

    function advanceQuizQuestion() {
      if (!quizState || quizState.status !== 'feedback') return;
      if ((quizState.score || 0) >= 5) {
        completeQuizChallenge();
        return;
      }
      quizState.currentId = '';
      quizState.status = 'asking';
      quizState.selected = -1;
      quizState.correct = false;
      quizState.timedOut = false;
      quizState.feedbackUntil = 0;
      ensureQuizQuestion();
      saveQuizState();
      renderQuiz();
    }

    function updateQuizTimer() {
      if (!quizState || !quizState.active) return;
      if (quizState.status === 'feedback') {
        quizTimer.textContent = '0.0';
        quizTimerBar.style.transform = 'scaleX(0)';
        return;
      }
      var left = Math.max(0, quizState.deadline - Date.now());
      quizTimer.textContent = (left / 1000).toFixed(1);
      quizTimerBar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, left / QUIZ_TIME_MS)) + ')';
      if (left <= 0) answerQuiz(-1, true);
    }

    function completeQuizChallenge() {
      if (!quizState) return;
      var mode = quizState.mode;
      quizState.active = false;
      saveQuizState();
      quizState = null;
      clearInterval(quizTickTimer);
      closeQuizModal();
      if (mode === 'time') grantGuardReward();
      else reviveFromQuiz();
    }

    function readGuard() {
      var now = Date.now();
      var state = parseStored(GUARD_KEY, null);
      if (!state || !state.cycleStart || (state.lastActivity && now - state.lastActivity >= GUARD_REST_MS)) {
        state = { version: 1, cycleStart: now, usedMs: 0, bonusMs: 0, bonusCount: 0, lastActivity: now, updatedAt: now };
        safeStorageSet(GUARD_KEY, JSON.stringify(state));
      }
      state.usedMs = Math.max(0, Number(state.usedMs) || 0);
      state.bonusMs = Math.max(0, Number(state.bonusMs) || 0);
      return state;
    }

    function guardLimit(state) { return GUARD_BASE_MS + (state ? state.bonusMs : 0); }
    function isGuardLocked() {
      var state = readGuard();
      return state.usedMs >= guardLimit(state);
    }

    function syncGuardUi() {
      guardBlocked = isGuardLocked();
      gameCard.classList.toggle('guard-locked', guardBlocked);
      if (studyTimeBtn) studyTimeBtn.hidden = !guardBlocked;
      if (guardBlocked && running && !over) {
        paused = true;
        updateHud('防沉迷暂停 · 完成答题可增加 15 分钟');
        if (!quizState || !quizState.active || quizState.mode !== 'time') startQuizChallenge('time');
      }
    }

    function grantGuardReward() {
      var state = readGuard();
      state.bonusMs += GUARD_REWARD_MS;
      state.bonusCount = (state.bonusCount || 0) + 1;
      state.lastActivity = Date.now();
      state.updatedAt = Date.now();
      safeStorageSet(GUARD_KEY, JSON.stringify(state));
      guardBlocked = false;
      gameCard.classList.remove('guard-locked');
      if (studyTimeBtn) studyTimeBtn.hidden = true;
      if (running && !over) {
        paused = false;
        last = performance.now();
        updateHud('学习换时成功 · +15 分钟');
      }
      showToast('挑战通过，增加 15 分钟游玩时长');
    }

    function saveRunSnapshot(dead) {
      if (restoringRun) return;
      var data = {
        version: 3, dead: !!dead, active: !dead && running, paused: !dead && running && paused, level: currentLevel,
        score: score, scoreFloat: scoreFloat, wave: wave, runTime: runTime,
        lives: lives, shield: shield, pulse: pulse, combo: combo,
        itemRanks: itemRanks, pickupCount: pickupCount, updatedAt: Date.now()
      };
      safeStorageSet(RUN_KEY, JSON.stringify(data));
    }

    function clearRunSnapshot() { removeStored(RUN_KEY); }

    function restoreRunSnapshot() {
      var data = parseStored(RUN_KEY, null);
      if (!data || (!data.dead && !data.active) || !levels[data.level]) return false;
      restoringRun = true;
      setLevel(data.level);
      score = Math.max(0, Number(data.score) || 0);
      scoreFloat = Math.max(score, Number(data.scoreFloat) || score);
      wave = Math.max(1, Number(data.wave) || 1);
      runTime = Math.max(0, Number(data.runTime) || 0);
      lives = Math.max(0, Math.min(maxLives(), Number(data.lives) || level().lives));
      shield = Math.max(0, Number(data.shield) || 0);
      pulse = clamp(Number(data.pulse) || 0, 0, 100);
      combo = Math.max(0, Number(data.combo) || 0);
      itemRanks = data.itemRanks && typeof data.itemRanks === 'object' ? data.itemRanks : Object.create(null);
      pickupCount = Math.max(0, Number(data.pickupCount) || 0);
      hazards = []; pickups = []; particles = []; rings = []; bullets = []; bossShots = []; dangerZones = []; playerTechs = []; floatTexts = []; gameNotices = [];
      bossSpawned = false; bossDelay = 2.2; waveBreakTimer = 0; grace = 3;
      player.x = gameW / 2; player.y = gameH / 2;
      over = !!data.dead;
      running = !over;
      paused = running;
      if (over) {
        lives = 0;
        updateHud('已结束 · ' + level().label + ' · WAVE ' + wave);
      } else {
        lives = Math.max(1, lives);
        updateHud('已暂停 · ' + level().label + ' · WAVE ' + wave);
        runId += 1;
        last = performance.now();
        requestAnimationFrame(function (now) { loop(now, runId); });
      }
      restoringRun = false;
      if (running && !over) saveRunSnapshot(false);
      updateReviveUi();
      return true;
    }

    function positionGameOverChoice() {
      if (!gameOverChoice || gameOverChoice.hidden) return;
      requestAnimationFrame(function () {
        if (!gameOverChoice || gameOverChoice.hidden) return;
        gameOverChoice.style.left = canvas.offsetLeft + 'px';
        gameOverChoice.style.top = canvas.offsetTop + 'px';
        gameOverChoice.style.width = canvas.offsetWidth + 'px';
        gameOverChoice.style.height = canvas.offsetHeight + 'px';
      });
    }

    function updateReviveUi() {
      var canRevive = over && !!parseStored(RUN_KEY, null);
      if (reviveBtn) reviveBtn.hidden = !canRevive;
      if (gameOverChoice) gameOverChoice.hidden = !over;
      if (gameOverSummary) gameOverSummary.textContent = level().label + ' · WAVE ' + wave + ' · ' + score + ' 分';
      startBtn.hidden = over;
      if (mobileStartBtn) mobileStartBtn.hidden = over || !(fullscreenElement() === gameCard && isTouchLayout());
      positionGameOverChoice();
    }

    function reviveFromQuiz() {
      if (!over) return;
      over = false;
      running = true;
      paused = false;
      lives = Math.min(maxLives(), 2);
      shield = Math.max(shield, Math.round(maxShield() * 0.3));
      grace = 3.2;
      pulse = Math.max(pulse, 45);
      bossShots = [];
      dangerZones = [];
      bullets = [];
      hazards = hazards.filter(function (h) { return h && h.boss || Math.hypot(h.x - player.x, h.y - player.y) > 180; });
      if (!hazards.length) { bossSpawned = false; bossDelay = 1.8; }
      runId += 1;
      last = performance.now();
      clearRunSnapshot();
      saveRunSnapshot(false);
      updateReviveUi();
      addRing(player.x, player.y, '#57ffda', 20, 0.65, 180, true);
      addGameNotice('学习复活 · 3 秒保护', '#57ffda', 2.2);
      updateHud('已复活 · ' + level().label + ' · WAVE ' + wave);
      requestAnimationFrame(function (now) { loop(now, runId); });
    }

    function guardHeartbeat() {
      var now = Date.now();
      var delta = Math.max(0, Math.min(6000, now - guardTickAt));
      guardTickAt = now;
      var active = running && !paused && !over && !document.hidden && document.hasFocus() && !(quizModal && quizModal.classList.contains('open'));
      if (active) {
        var state = readGuard();
        state.usedMs += delta;
        state.lastActivity = now;
        state.updatedAt = now;
        safeStorageSet(GUARD_KEY, JSON.stringify(state));
        if (state.usedMs >= guardLimit(state)) syncGuardUi();
        saveRunSnapshot(false);
      }
    }

    function bestKey() { return 'lightCoreDodgeBest_' + currentLevel; }
    function readBest() { best = Number(safeStorageGet(bestKey(), '0') || 0); }
    function level() { return levels[currentLevel] || levels.normal; }
    function maxLives() { return level().lives + 2; }
    function maxShield() {
      var base = 75 + Math.min(95, wave * 7) + (currentLevel === 'easy' ? 28 : currentLevel === 'insane' ? -10 : 0);
      return Math.round(base * (1 + itemRank('guardian') * 0.06 + itemRank('repair') * 0.025));
    }
    function difficultyScale() { return 1 + (wave - 1) * 0.13 + Math.min(1.25, runTime / 150); }
    function arsenalPressure() {
      var offenseTypes = ['good', 'charge', 'speed', 'blade', 'bullet', 'invincible', 'nova', 'overdrive', 'berserk', 'storm', 'laser', 'mine', 'blackhole', 'phase', 'drone', 'meteor', 'surge', 'thornmail', 'vampire', 'splitter', 'sanctuary', 'miracle'];
      var offenseRanks = offenseTypes.reduce(function (sum, type) { return sum + itemRank(type); }, 0);
      var rankPressure = Math.max(0, offenseRanks - 3) * 0.055;
      var pickupPressure = Math.max(0, pickupCount - 7) * 0.010;
      var waveUnlock = 0.55 + Math.min(0.45, Math.max(0, wave - 1) * 0.09);
      return 1 + Math.min(1.45, (rankPressure + pickupPressure) * waveUnlock);
    }
    function enemyHpScale() { return 1.08 + (wave - 1) * 0.21 + Math.min(1.75, runTime / 110); }
    function enemyAtkScale() { return 0.94 + Math.floor((wave - 1) / 4) * 0.34 + Math.min(1.08, runTime / 180); }
    function hasBoss() { return hazards.some(function (h) { return h.boss; }); }
    function activePowerText() {
      if (overdriveTime > 0) return '超载' + Math.ceil(overdriveTime) + 's';
      if (timeStopTime > 0) return '时停' + Math.ceil(timeStopTime) + 's';
      if (invincible > 0) return '无敌' + Math.ceil(invincible) + 's';
      if (speedBoostTime > 0) return '疾行' + Math.ceil(speedBoostTime) + 's';
      if (bladeTime > 0) return '刀刃' + Math.ceil(bladeTime) + 's';
      if (gunTime > 0) return '弹幕' + Math.ceil(gunTime) + 's';
      if (freezeTime > 0) return '冻结' + Math.ceil(freezeTime) + 's';
      if (magnetTime > 0) return '牵引' + Math.ceil(magnetTime) + 's';
      if (shield > 0) return '盾' + Math.ceil(shield);
      return lastPowerName || '待命';
    }
    function multiplier() { return 1 + Math.min(3, combo * 0.14); }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }


    function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
    function isTouchLayout() { return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900; }
    function isMobileGameInput() { return isTouchLayout() || ((navigator.maxTouchPoints || 0) > 0 && window.innerWidth <= 900); }
    function isMobileFullscreen() { return fullscreenElement() === gameCard && isTouchLayout(); }
    function isLiteGameRender() { return isTouchLayout(); }
    function maxHazardCount() {
      if (!isLiteGameRender()) return currentLevel === 'insane' ? 84 : 72;
      return currentLevel === 'insane' ? 34 : currentLevel === 'hard' ? 31 : 28;
    }
    function maxRingCount() { return isLiteGameRender() ? 5 : 12; }

    function setReadyClasses(pulseReady, dashReady) {
      gameCard.classList.toggle('pulse-ready', !!pulseReady);
      gameCard.classList.toggle('dash-ready', !!dashReady);
      [pulseBtn, mobilePulseBtn].forEach(function (btn) { if (btn) btn.classList.toggle('is-ready', !!pulseReady); });
      [dashBtn, mobileDashBtn].forEach(function (btn) { if (btn) btn.classList.toggle('is-ready', !!dashReady); });
    }

    function setJoystickVisual(dx, dy) {
      if (!joystickStick) return;
      joystickStick.style.transform = 'translate3d(' + (dx * 46) + 'px,' + (dy * 46) + 'px,0)';
    }

    function resetJoystick() {
      joystick.active = false;
      joystick.pointerId = null;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.mag = 0;
      setJoystickVisual(0, 0);
    }

    function triggerHitFlash(strength) {
      damageFlash = Math.max(damageFlash, strength || 0.8);
      hitFlashTimer = 0.34;
      gameCard.classList.add('is-hit');
      clearTimeout(triggerHitFlash.timer);
      triggerHitFlash.timer = setTimeout(function () { gameCard.classList.remove('is-hit'); }, 360);
    }

    function fitEntityToCanvas(obj, oldW, oldH) {
      if (!obj || !oldW || !oldH) return;
      obj.x = clamp(obj.x / oldW * gameW, obj.r || 0, gameW - (obj.r || 0));
      obj.y = clamp(obj.y / oldH * gameH, obj.r || 0, gameH - (obj.r || 0));
    }

    function resizeGameCanvas(force) {
      var sizeNow = performance.now();
      var sizeInterval = isLiteGameRender() ? 260 : 180;
      if (!force && lastSizeCheck && sizeNow - lastSizeCheck < sizeInterval) return false;
      lastSizeCheck = sizeNow;
      var oldW = gameW;
      var oldH = gameH;
      var active = fullscreenElement() === gameCard;
      var targetW = baseGameW;
      var targetH = baseGameH;
      if (active) {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        var canvasRect = canvas.getBoundingClientRect();
        var cardRect = gameCard.getBoundingClientRect();
        targetW = Math.max(320, Math.round(canvasRect.width || cardRect.width || window.innerWidth || baseGameW));
        targetH = Math.max(320, Math.round(canvasRect.height || cardRect.height || window.innerHeight || baseGameH));
      } else {
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        var rect = canvas.getBoundingClientRect();
        if (rect.width > 80) targetW = Math.max(320, Math.round(rect.width));
        targetH = Math.round(targetW * baseGameH / baseGameW);
      }
      var nextRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, isLiteGameRender() ? 2 : 2.25));
      if (Math.abs(targetW - gameW) < 2 && Math.abs(targetH - gameH) < 2 && Math.abs(nextRatio - renderRatio) < 0.05) return false;
      gameW = targetW;
      gameH = targetH;
      renderRatio = nextRatio;
      canvas.style.width = active ? '100%' : '100%';
      canvas.style.height = active ? '100%' : targetH + 'px';
      canvas.width = Math.max(1, Math.round(gameW * renderRatio));
      canvas.height = Math.max(1, Math.round(gameH * renderRatio));
      ctx.setTransform(renderRatio, 0, 0, renderRatio, 0, 0);
      fitEntityToCanvas(player, oldW, oldH);
      fitEntityToCanvas(pointer, oldW, oldH);
      hazards.forEach(function (h) { fitEntityToCanvas(h, oldW, oldH); });
      pickups.forEach(function (p) { fitEntityToCanvas(p, oldW, oldH); });
      particles.forEach(function (p) { fitEntityToCanvas(p, oldW, oldH); });
      rings.forEach(function (r) { fitEntityToCanvas(r, oldW, oldH); });
      bullets.forEach(function (b) { fitEntityToCanvas(b, oldW, oldH); });
      floatTexts.forEach(function (t) { fitEntityToCanvas(t, oldW, oldH); });
      gameHudCache.key = '';
      return true;
    }

    function prepareCanvasDraw() {
      if (!canvas.width || !canvas.height) resizeGameCanvas(true);
      ctx.setTransform(renderRatio, 0, 0, renderRatio, 0, 0);
    }

    function syncFullscreenButton() {
      var active = fullscreenElement() === gameCard;
      var mobileActive = active && isTouchLayout();
      gameCard.classList.toggle('is-fullscreen', active);
      gameCard.classList.toggle('is-mobile-fullscreen', mobileActive);
      if (gameSection) {
        gameSection.classList.toggle('is-game-fullscreen', active);
        gameSection.classList.toggle('is-game-mobile-fullscreen', mobileActive);
      }
      fullscreenBtn.textContent = active ? '退出全屏' : '全屏';
      if (mobileExitBtn) mobileExitBtn.hidden = !active;
      if (mobilePauseBtn) mobilePauseBtn.hidden = !(mobileActive && running && !over);
      if (mobileStartBtn) mobileStartBtn.hidden = !mobileActive || over;
      setPagePerformanceMode(active);
      if (!mobileActive) resetJoystick();
      requestAnimationFrame(function () {
        resizeGameCanvas(true);
        positionGameOverChoice();
        draw(performance.now());
      });
    }

    function toggleFullscreen() {
      if (fullscreenElement() === gameCard) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }
      if (gameCard.requestFullscreen) gameCard.requestFullscreen().catch(function () {});
      else if (gameCard.webkitRequestFullscreen) gameCard.webkitRequestFullscreen();
    }

    function movePointerToClient(clientX, clientY) {
      if (isMobileFullscreen()) return;
      var r = canvas.getBoundingClientRect();
      pointer.x = clamp((clientX - r.left) / r.width * gameW, player.r, gameW - player.r);
      pointer.y = clamp((clientY - r.top) / r.height * gameH, player.r, gameH - player.r);
      pointer.active = true;
    }

    function updateJoystickFromClient(clientX, clientY) {
      if (!joystickZone) return;
      var r = joystickZone.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var rawX = clientX - cx;
      var rawY = clientY - cy;
      var radius = Math.max(28, Math.min(r.width, r.height) * 0.36);
      var len = Math.hypot(rawX, rawY);
      joystick.mag = clamp(len / radius, 0, 1);
      if (len > 1) {
        joystick.dx = rawX / len * joystick.mag;
        joystick.dy = rawY / len * joystick.mag;
      } else {
        joystick.dx = 0;
        joystick.dy = 0;
      }
      setJoystickVisual(joystick.dx, joystick.dy);
    }

    function addParticles(x, y, color, count, speed) {
      var lite = isLiteGameRender();
      var maxCount = lite ? 52 : 190;
      var realCount = lite ? Math.max(2, Math.ceil(count * 0.32)) : count;
      if (particles.length > maxCount) particles.splice(0, particles.length - maxCount);
      for (var i = 0; i < realCount && particles.length < maxCount; i++) {
        var a = Math.random() * Math.PI * 2;
        var s = speed * (0.35 + Math.random() * 0.85) * (lite ? 0.78 : 1);
        particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.22 + Math.random() * 0.3, max: 0.5, color: color, size: (lite ? 1.2 : 1.5) + Math.random() * (lite ? 2.4 : 3.5) });
      }
    }

    function colorAlpha(color, alpha) {
      if (color && color.charAt(0) === '#' && (color.length === 7 || color.length === 4)) {
        var hex = color.length === 4 ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] : color;
        var n = parseInt(hex.slice(1), 16);
        return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
      }
      return color || 'rgba(255,255,255,' + alpha + ')';
    }

    function addRing(x, y, color, radius, life, maxRadius, fill) {
      var maxRings = maxRingCount();
      if (rings.length >= maxRings) rings.splice(0, rings.length - maxRings + 1);
      var start = radius || 28;
      rings.push({ x: x, y: y, color: color, radius: start, max: maxRadius || Math.max(150, start * 5.2), life: life || 0.5, maxLife: life || 0.5, fill: !!fill });
    }

    function addFloatText(x, y, text, color) {
      var maxTexts = isLiteGameRender() ? 8 : 18;
      if (floatTexts.length >= maxTexts) floatTexts.splice(0, floatTexts.length - maxTexts + 1);
      floatTexts.push({ x: x, y: y, vy: -34 - Math.random() * 18, text: text, color: color || '#fff', life: 0.85, max: 0.85 });
    }

    function addGameNotice(text, color, life) {
      if (!text) return;
      var maxNotices = isLiteGameRender() ? 2 : 3;
      if (gameNotices.length >= maxNotices) gameNotices.splice(0, gameNotices.length - maxNotices + 1);
      gameNotices.push({ text: text, color: color || '#ffffff', life: life || 2.0, max: life || 2.0 });
    }

    function nearestHazard() {
      var bestHazard = null;
      var bestDist = Infinity;
      hazards.forEach(function (h) {
        if (!h || h.defeated) return;
        var d = Math.hypot(h.x - player.x, h.y - player.y);
        if (d < bestDist) { bestDist = d; bestHazard = h; }
      });
      return bestHazard;
    }

    function enemyStats(kind) {
      var table = {
        runner: { hp: 26, damage: 1, score: 8, color: '#ff7c4d' },
        seeker: { hp: 38, damage: 1, score: 10, color: '#ff3f68' },
        orbit: { hp: 48, damage: 1, score: 12, color: '#b56cff' },
        brute: { hp: 92, damage: 2, score: 19, color: '#ffb14a' },
        sniper: { hp: 58, damage: 2, score: 16, color: '#7ec8ff' }
      };
      return table[kind] || table.seeker;
    }

    function bossProfiles() {
      return [
        { type: 'serpent', name: '量子蛇', color: '#00ffbf', hp: 430, damage: 2, skillGap: 2.8, glyph: '蛇' },
        { type: 'prism', name: '棱镜眼', color: '#ff3df2', hp: 520, damage: 2, skillGap: 2.45, glyph: '◇' },
        { type: 'hydra', name: '九头核', color: '#ffb14a', hp: 610, damage: 3, skillGap: 3.1, glyph: '九' },
        { type: 'phantom', name: '幻影轮', color: '#8a5cff', hp: 470, damage: 2, skillGap: 2.15, glyph: '影' },
        { type: 'reactor', name: '熔炉心', color: '#ffe178', hp: 680, damage: 3, skillGap: 3.25, glyph: '炉' },
        { type: 'mantis', name: '裂刃螳', color: '#27ff7a', hp: 560, damage: 3, skillGap: 2.35, glyph: '刃' },
        { type: 'crown', name: '星冠塔', color: '#ffffff', hp: 730, damage: 3, skillGap: 3.0, glyph: '冠' },
        { type: 'nebula', name: '星云母体', color: '#7ec8ff', hp: 640, damage: 2, skillGap: 2.7, glyph: '云' },
        { type: 'eclipse', name: '日蚀眼', color: '#ff6b9f', hp: 560, damage: 2, skillGap: 2.55, glyph: '蚀' },
        { type: 'lotus', name: '莲华阵', color: '#ff8dff', hp: 520, damage: 2, skillGap: 2.35, glyph: '莲' },
        { type: 'railgun', name: '轨道炮', color: '#00d8ff', hp: 590, damage: 3, skillGap: 2.9, glyph: '轨' },
        { type: 'swarm', name: '蜂巢主脑', color: '#ffd34d', hp: 610, damage: 2, skillGap: 3.15, glyph: '蜂' },
        { type: 'mirror', name: '镜像魔方', color: '#b8f7ff', hp: 540, damage: 2, skillGap: 2.45, glyph: '镜' },
        { type: 'void', name: '虚空井', color: '#7b4dff', hp: 650, damage: 3, skillGap: 3.05, glyph: '空' },
        { type: 'comet', name: '彗星骑士', color: '#ff7c4d', hp: 570, damage: 3, skillGap: 2.35, glyph: '彗' },
        { type: 'clock', name: '时钟械神', color: '#7ec8ff', hp: 600, damage: 2, skillGap: 2.75, glyph: '时' },
        { type: 'phoenix', name: '不死鸟', color: '#ff4f3f', hp: 620, damage: 3, skillGap: 3.0, glyph: '凤' },
        { type: 'cube', name: '超立方', color: '#9efcff', hp: 670, damage: 2, skillGap: 2.85, glyph: '方' },
        { type: 'leviathan', name: '深海龙鲸', color: '#2ce6ff', hp: 720, damage: 3, skillGap: 3.25, glyph: '鲸' },
        { type: 'siren', name: '赛壬歌者', color: '#57ffda', hp: 560, damage: 2, skillGap: 2.5, glyph: '歌' },
        { type: 'samurai', name: '霓虹武士', color: '#ff3df2', hp: 610, damage: 3, skillGap: 2.2, glyph: '武' },
        { type: 'satellite', name: '卫星矩阵', color: '#ffffff', hp: 590, damage: 2, skillGap: 2.8, glyph: '星' },
        { type: 'glitch', name: '故障幽灵', color: '#00ffbf', hp: 500, damage: 2, skillGap: 2.15, glyph: '错' },
        { type: 'aurora', name: '极光圣女', color: '#b56cff', hp: 600, damage: 2, skillGap: 2.6, glyph: '极' },
        { type: 'titan', name: '泰坦锤', color: '#ffb14a', hp: 820, damage: 4, skillGap: 3.45, glyph: '锤' },
        { type: 'thorn', name: '荆棘王', color: '#27ff7a', hp: 650, damage: 3, skillGap: 2.75, glyph: '棘' },
        { type: 'monolith', name: '黑碑', color: '#c9d3ff', hp: 760, damage: 3, skillGap: 3.15, glyph: '碑' },
        { type: 'dragon', name: '星焰龙', color: '#ff5a2c', hp: 790, damage: 4, skillGap: 3.25, glyph: '龙' }
      ];
    }

    function shuffleBossDeck() {
      bossDeck = bossProfiles().slice();
      for (var i = bossDeck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = bossDeck[i]; bossDeck[i] = bossDeck[j]; bossDeck[j] = t;
      }
      bossCursor = 0;
    }

    function bossProfile(typeIndex) {
      if (!bossDeck.length || bossCursor >= bossDeck.length) shuffleBossDeck();
      var profile = bossDeck[bossCursor % bossDeck.length];
      bossCursor += 1;
      return profile || bossProfiles()[typeIndex % bossProfiles().length];
    }

    function damageHazardByIndex(index, amount, color, label) {
      var h = hazards[index];
      if (!h || h.defeated) return false;
      if (!h.hp && !h.maxHp) { destroyHazard(index, amount > 35 ? 16 : 10); return true; }
      if (h.boss) {
        var guardMax = Math.max(0.01, h.spawnGuardMax || 2.15);
        var guardRatio = clamp((h.spawnGuard || 0) / guardMax, 0, 1);
        var guardScale = 1 - guardRatio * 0.84;
        var armorScale = wave <= 3 ? 0.68 : wave <= 7 ? 0.74 : 0.80;
        var singleHitCap = Math.max(30, Math.round(h.maxHp * (0.18 - guardRatio * 0.11)));
        amount = Math.min(singleHitCap, Math.max(1, Math.round(amount * armorScale * guardScale)));
        var capacityRatio = wave <= 3 ? 0.14 : wave <= 7 ? 0.18 : 0.23;
        var recoveryRatio = wave <= 3 ? 0.16 : wave <= 7 ? 0.20 : 0.25;
        var capacityMax = h.maxHp * capacityRatio;
        var capacityElapsed = Math.max(0, runTime - (h.damageCapacityStamp || runTime));
        h.damageCapacity = Math.min(capacityMax, (h.damageCapacity == null ? capacityMax : h.damageCapacity) + capacityElapsed * h.maxHp * recoveryRatio);
        h.damageCapacityStamp = runTime;
        amount = Math.min(amount, h.damageCapacity);
        if (amount <= 0.1) return false;
        h.damageCapacity = Math.max(0, h.damageCapacity - amount);
      } else if (h.armorScale) {
        amount = Math.max(1, Math.round(amount * h.armorScale));
      }
      h.hp -= amount;
      h.hit = 0.16;
      if (!isLiteGameRender()) addParticles(h.x, h.y, color || h.color || '#ffffff', h.boss ? 5 : 3, h.boss ? 110 : 80);
      if (label && (!isLiteGameRender() || h.boss)) addFloatText(h.x, h.y - h.r - 8, label, color || '#fff');
      if (h.hp <= 0) {
        if (h.boss) { queueBossDefeat(h); return true; }
        destroyHazard(index, h.scoreValue);
        return true;
      }
      return false;
    }

    function takePlayerDamage(amount, color) {
      if (invincible > 0 || grace > 0) return false;
      var hit = Math.max(1, Math.ceil(amount || 1));
      if (shield > 0) {
        var shieldDamage = hit * 34;
        shield = Math.max(0, shield - shieldDamage);
        damageFlash = Math.max(damageFlash, 0.42);
        boostFlash = Math.max(boostFlash, 0.18);
        addRing(player.x, player.y, shield > 0 ? '#8a5cff' : '#ff3f68', 22, 0.28, 90, true);
        addParticles(player.x, player.y, shield > 0 ? '#8a5cff' : '#ffffff', 14, 140);
        addFloatText(player.x, player.y - 28, shield > 0 ? '-盾' + shieldDamage : '破盾', shield > 0 ? '#8a5cff' : '#ff3f68');
        if (thornTime > 0 && thornRetaliateCooldown <= 0) {
          var thornRank = Math.max(1, itemRank('thornmail'));
          thornBurstPending = {
            radius: 145 + thornRank * 15,
            normalDamage: 45 + thornRank * 20,
            bossDamage: 28 + thornRank * 14,
            color: '#27ff7a'
          };
          thornRetaliateCooldown = 0.45;
          addRing(player.x, player.y, '#27ff7a', 24, 0.3, thornBurstPending.radius, true);
          addFloatText(player.x, player.y - 42, '反伤脉冲', '#27ff7a');
        }
        if (shield <= 0) grace = Math.max(grace, 0.55);
        return true;
      }
      lives = Math.max(0, lives - hit);
      combo = 0; comboTimer = 0; grace = 1.35; damageFlash = 1;
      triggerHitFlash(hit >= 2 ? 1 : 0.72);
      pulse = Math.max(0, pulse - 14 * hit);
      addRing(player.x, player.y, color || '#ff3f68', 28, 0.34, 120, true);
      addParticles(player.x, player.y, '#ffffff', 18, 160);
      addFloatText(player.x, player.y - 30, '-' + hit + '♥', '#ff3f68');
      if (lives <= 0) endGame();
      return true;
    }

    function fireBullet(mode) {
      var enhanced = mode === 'enhanced' || gunTime > 0 || overdriveTime > 0;
      var hot = overdriveTime > 0;
      var bulletRank = enhanced ? Math.max(1, itemRank('bullet')) : 0;
      var shotOffsets = bulletRank >= 3 ? [-0.13, 0, 0.13] : bulletRank >= 2 ? [-0.08, 0.08] : [0];
      var maxBullets = isLiteGameRender() ? (enhanced ? 28 : 18) : (enhanced ? 64 : 34);
      if (bullets.length + shotOffsets.length > maxBullets) bullets.splice(0, Math.min(bullets.length, bullets.length + shotOffsets.length - maxBullets));
      var target = nearestHazard();
      var dx = target ? target.x - player.x : player.faceX;
      var dy = target ? target.y - player.y : player.faceY;
      var len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      var speed = hot ? 700 : enhanced ? 560 : 470;
      var color = hot ? '#ffe178' : enhanced ? '#00eaff' : '#9efcff';
      var baseDamage = hot ? 42 : enhanced ? 24 : Math.round(20 + Math.min(18, wave * 1.35));
      var damageScale = bulletRank >= 3 ? 0.72 : bulletRank >= 2 ? 0.85 : 1;
      for (var shotIndex = 0; shotIndex < shotOffsets.length; shotIndex++) {
        var spread = shotOffsets[shotIndex] + (Math.random() - 0.5) * (enhanced ? 0.055 : 0.08);
        var cs = Math.cos(spread);
        var sn = Math.sin(spread);
        var vx = dx * cs - dy * sn;
        var vy = dx * sn + dy * cs;
        bullets.push({
          x: player.x + vx * 22, y: player.y + vy * 22,
          vx: vx * speed, vy: vy * speed,
          r: hot ? 5.2 : enhanced ? 4.2 : 3.9,
          life: hot ? 1.35 : enhanced ? 1.15 : 1.05,
          color: color,
          pierce: (hot ? 3 : enhanced ? 1 : 0) + (bulletRank >= 3 ? 1 : 0),
          damage: Math.max(8, Math.round(baseDamage * damageScale)),
          core: !enhanced
        });
      }
      if (!isLiteGameRender()) addParticles(player.x + dx * 20, player.y + dy * 20, color, enhanced ? 3 + shotOffsets.length : 2, enhanced ? 86 : 58);
    }

    function pushPlayerBullet(angle, speed, damage, color, pierce, life, radius) {
      var maxBullets = isLiteGameRender() ? 30 : 72;
      if (bullets.length >= maxBullets) bullets.splice(0, bullets.length - maxBullets + 1);
      var vx = Math.cos(angle);
      var vy = Math.sin(angle);
      bullets.push({ x: player.x + vx * 23, y: player.y + vy * 23, vx: vx * (speed || 560), vy: vy * (speed || 560), r: radius || 4.2, life: life || 1.12, color: color || '#00eaff', pierce: pierce || 0, damage: damage || 24, core: false });
    }

    function fireRadialBullets(count, damage, color, speed, pierce) {
      var maxCount = isLiteGameRender() ? Math.min(count, 12) : count;
      for (var i = 0; i < maxCount; i++) pushPlayerBullet(Math.PI * 2 * i / maxCount, speed || 560, damage || 26, color || '#00eaff', pierce || 0, 1.18, 4.4);
      if (!isLiteGameRender()) addParticles(player.x, player.y, color || '#00eaff', 18, 210);
    }

    function spawnSplitBullets(source) {
      if (splitterTime <= 0 || !source || source.split) return;
      var rank = Math.max(1, itemRank('splitter'));
      var count = rank >= 3 ? 4 : rank === 2 ? 3 : 2;
      if (isLiteGameRender()) count = Math.min(count, 3);
      var maxBullets = isLiteGameRender() ? 30 : 72;
      var available = Math.max(0, maxBullets - bullets.length);
      count = Math.min(count, available);
      if (!count) return;
      var baseAngle = Math.atan2(source.vy || 0, source.vx || 1);
      var damageScale = rank >= 3 ? 0.58 : rank === 2 ? 0.53 : 0.48;
      for (var i = 0; i < count; i++) {
        var offset = count === 1 ? 0 : -0.68 + 1.36 * i / (count - 1);
        var angle = baseAngle + offset;
        var speed = Math.max(390, Math.hypot(source.vx || 0, source.vy || 0) * 0.82);
        bullets.push({
          x: source.x, y: source.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          r: Math.max(2.8, (source.r || 4) * 0.76), life: 0.72,
          color: source.color || '#b56cff', pierce: rank >= 3 ? 1 : 0,
          damage: Math.max(7, Math.round((source.damage || 24) * damageScale)),
          core: false, split: true
        });
      }
      if (!isLiteGameRender()) addRing(source.x, source.y, '#b56cff', 8, 0.18, 34);
    }

    function damageHazardsInRadius(x, y, radius, normalDamage, bossDamage, color, label) {
      var hit = 0;
      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        if (!h || h.defeated) continue;
        if (Math.hypot(h.x - x, h.y - y) < radius + h.r) {
          damageHazardByIndex(i, h.boss ? bossDamage : normalDamage, color || '#ffffff', h.boss && label ? label : null);
          hit += 1;
        }
      }
      resolvePendingBossDefeat();
      return hit;
    }

    function damageAllHazards(normalDamage, bossDamage, color, label) {
      var hit = 0;
      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        if (!h || h.defeated) continue;
        damageHazardByIndex(i, h.boss ? bossDamage : normalDamage, color || '#ffffff', h.boss && label ? label : null);
        hit += 1;
        if (pendingBossDefeat) break;
      }
      resolvePendingBossDefeat();
      return hit;
    }

    function damageHazardsAlongLine(x, y, angle, width, length, normalDamage, bossDamage, color, label) {
      var hit = 0;
      var ca = Math.cos(angle);
      var sa = Math.sin(angle);
      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        if (!h || h.defeated) continue;
        var dx = h.x - x;
        var dy = h.y - y;
        var along = dx * ca + dy * sa;
        var side = Math.abs(dx * sa - dy * ca);
        if (along > -h.r && along < length + h.r && side < width + h.r) {
          damageHazardByIndex(i, h.boss ? bossDamage : normalDamage, color || '#ffffff', h.boss && label ? label : null);
          hit += 1;
          if (pendingBossDefeat) break;
        }
      }
      resolvePendingBossDefeat();
      return hit;
    }

    function addDangerZone(kind, x, y, opts) {
      opts = opts || {};
      var maxZones = isLiteGameRender() ? 8 : 18;
      if (dangerZones.length >= maxZones) dangerZones.splice(0, dangerZones.length - maxZones + 1);
      dangerZones.push({
        kind: kind || 'lane', x: x, y: y, angle: opts.angle || 0, r: opts.r || 70,
        width: opts.width || 20, length: opts.length || Math.max(gameW, gameH) * 1.4,
        delay: opts.delay == null ? 0.45 : opts.delay, life: opts.life || 1.2, maxLife: opts.life || 1.2,
        color: opts.color || '#ff3f68', damage: opts.damage || 1, pull: opts.pull || 0,
        tick: 0, phase: Math.random() * Math.PI * 2
      });
    }

    function addPlayerTech(kind, opts) {
      opts = opts || {};
      var maxTechs = isLiteGameRender() ? 6 : 14;
      if (playerTechs.length >= maxTechs) playerTechs.splice(0, playerTechs.length - maxTechs + 1);
      playerTechs.push({
        kind: kind, x: opts.x == null ? player.x : opts.x, y: opts.y == null ? player.y : opts.y,
        angle: opts.angle == null ? Math.atan2(player.faceY, player.faceX) : opts.angle,
        life: opts.life || 2.4, maxLife: opts.life || 2.4, color: opts.color || '#00eaff',
        damage: opts.damage || 24, r: opts.r || 70, fire: opts.fire || 0.18, tick: 0,
        delay: opts.delay || 0, phase: Math.random() * Math.PI * 2
      });
    }

    function updateDangerZones(dt) {
      dangerZones.forEach(function (z) {
        z.delay -= dt;
        z.life -= dt;
        z.tick = Math.max(0, (z.tick || 0) - dt);
        if (z.delay > 0 || z.tick > 0 || timeStopTime > 0) return;
        var hit = false;
        if (z.kind === 'rift') {
          var dx = z.x - player.x;
          var dy = z.y - player.y;
          var d = Math.hypot(dx, dy) || 1;
          if (d < z.r * 1.8) {
            player.x += dx / d * Math.min(120, z.pull || 95) * dt;
            player.y += dy / d * Math.min(120, z.pull || 95) * dt;
          }
          hit = d < z.r + player.r;
        } else if (z.kind === 'quake') {
          hit = Math.hypot(player.x - z.x, player.y - z.y) < z.r + player.r;
        } else {
          var ca = Math.cos(z.angle);
          var sa = Math.sin(z.angle);
          var px = player.x - z.x;
          var py = player.y - z.y;
          var along = px * ca + py * sa;
          var side = Math.abs(px * sa - py * ca);
          hit = along > -player.r && along < z.length + player.r && side < z.width + player.r;
        }
        if (hit) {
          takePlayerDamage(z.damage, z.color);
          z.tick = 0.38;
        }
      });
      dangerZones = dangerZones.filter(function (z) { return z.life > 0; });
      player.x = clamp(player.x, player.r, gameW - player.r);
      player.y = clamp(player.y, player.r, gameH - player.r);
    }

    function updatePlayerTechs(dt) {
      playerTechs.forEach(function (t) {
        t.life -= dt;
        t.phase += dt;
        t.tick -= dt;
        if (t.kind === 'drone') {
          t.x = player.x; t.y = player.y;
          if (t.tick <= 0) {
            var target = nearestHazard();
            var count = isLiteGameRender() ? 2 : 3;
            for (var d = 0; d < count; d++) {
              var orbit = t.phase * 3 + Math.PI * 2 * d / count;
              var ox = player.x + Math.cos(orbit) * 46;
              var oy = player.y + Math.sin(orbit) * 32;
              var a = target ? Math.atan2(target.y - oy, target.x - ox) : orbit;
              pushPlayerBullet(a, 620, t.damage, t.color, 1, 1.05, 3.7);
              bullets[bullets.length - 1].x = ox; bullets[bullets.length - 1].y = oy;
            }
            t.tick = t.fire;
          }
        } else if (t.kind === 'blackhole') {
          for (var i = hazards.length - 1; i >= 0; i--) {
            var h = hazards[i];
            if (!h || h.defeated) continue;
            var dx = t.x - h.x;
            var dy = t.y - h.y;
            var dist = Math.hypot(dx, dy) || 1;
            if (dist < t.r * 2.2) {
              h.x += dx / dist * (1 - dist / (t.r * 2.2)) * 180 * dt;
              h.y += dy / dist * (1 - dist / (t.r * 2.2)) * 180 * dt;
            }
          }
          if (t.tick <= 0) { damageHazardsInRadius(t.x, t.y, t.r, t.damage, t.damage * 1.3, t.color, '-黑洞'); t.tick = 0.34; }
        } else if (t.kind === 'laser') {
          t.x = player.x; t.y = player.y; t.angle += dt * 0.95;
          if (t.tick <= 0) { damageHazardsAlongLine(t.x, t.y, t.angle, 20, Math.max(gameW, gameH) * 1.35, t.damage, t.damage * 1.5, t.color, '-光矛'); t.tick = 0.12; }
        } else if (t.kind === 'mine') {
          if (t.delay > 0) { t.delay -= dt; }
          else if (!t.done) { damageHazardsInRadius(t.x, t.y, t.r, 999, t.damage, t.color, '-震爆'); addRing(t.x, t.y, t.color, 22, 0.32, t.r + 42, true); t.done = true; t.life = Math.min(t.life, 0.24); }
        } else if (t.kind === 'chain') {
          if (t.tick <= 0) {
            var jumps = isLiteGameRender() ? 3 : 5;
            for (var j = 0; j < jumps; j++) {
              var best = -1, bestDist = Infinity;
              for (var k = 0; k < hazards.length; k++) {
                var hz = hazards[k];
                if (!hz || hz.defeated) continue;
                var dd = Math.hypot(hz.x - player.x, hz.y - player.y) + j * 20;
                if (dd < bestDist) { bestDist = dd; best = k; }
              }
              if (best >= 0) damageHazardByIndex(best, hazards[best].boss ? t.damage * 1.45 : t.damage, t.color, hazards[best].boss ? '-链电' : null);
              if (pendingBossDefeat) break;
            }
            resolvePendingBossDefeat();
            t.tick = t.fire;
          }
        } else if (t.kind === 'trail') {
          var trailDistance = 34 + Math.min(26, player.speed * 0.03);
          t.x += (player.x - player.faceX * trailDistance - t.x) * Math.min(1, dt * 12);
          t.y += (player.y - player.faceY * trailDistance - t.y) * Math.min(1, dt * 12);
          t.angle = Math.atan2(player.faceY, player.faceX) + Math.PI;
          if (t.tick <= 0) {
            damageHazardsInRadius(t.x, t.y, t.r, t.damage, t.damage * 0.58, t.color, '-风切');
            if (!isLiteGameRender()) addRing(t.x, t.y, t.color, 8, 0.16, t.r + 16);
            t.tick = t.fire;
          }
        } else if (t.kind === 'storm') {
          t.x = player.x; t.y = player.y;
          if (t.tick <= 0) {
            var stormCount = isLiteGameRender() ? 3 : 6;
            var direction = Math.sin(t.phase * 1.7) >= 0 ? 1 : -1;
            for (var stormIndex = 0; stormIndex < stormCount; stormIndex++) {
              var stormAngle = t.phase * 2.2 + Math.PI * 2 * stormIndex / stormCount;
              pushPlayerBullet(stormAngle, 500 + stormIndex * 9, t.damage, t.color, 1, 1.3, t.r || 4.2);
              bullets[bullets.length - 1].curve = direction * (0.72 + stormIndex * 0.035);
            }
            t.tick = t.fire;
          }
        } else if (t.kind === 'repair') {
          t.x = player.x; t.y = player.y;
          if (t.tick <= 0) {
            var repairRank = Math.max(1, itemRank('repair'));
            var restored = 4 + repairRank * 1.5;
            shield = Math.min(maxShield(), shield + restored);
            var repairTarget = nearestHazard();
            if (repairTarget) {
              var repairAngle = Math.atan2(repairTarget.y - player.y, repairTarget.x - player.x);
              pushPlayerBullet(repairAngle, 570, t.damage, t.color, 1, 1.0, 3.6);
            }
            if (!isLiteGameRender()) addParticles(player.x, player.y, t.color, 4, 70);
            t.tick = t.fire;
          }
        } else if (t.kind === 'sanctuary') {
          t.x = player.x; t.y = player.y;
          if (t.tick <= 0) {
            var clearLimit = isLiteGameRender() ? 3 : 7;
            var cleared = 0;
            for (var shotIndex = bossShots.length - 1; shotIndex >= 0 && cleared < clearLimit; shotIndex--) {
              var enemyShot = bossShots[shotIndex];
              if (!enemyShot || enemyShot.type === 'beam') continue;
              if (Math.hypot(enemyShot.x - player.x, enemyShot.y - player.y) < t.r) {
                bossShots.splice(shotIndex, 1);
                cleared += 1;
              }
            }
            damageHazardsInRadius(player.x, player.y, t.r, t.damage, t.damage * 0.46, t.color, '-圣域');
            if (cleared && !isLiteGameRender()) addRing(player.x, player.y, t.color, t.r * 0.45, 0.2, t.r);
            t.tick = t.fire;
          }
        }
      });
      playerTechs = playerTechs.filter(function (t) { return t.life > 0 && !t.done; });
    }

    function pickupMeta(type) {
      var map = {
        good: { color: '#00ffbf', label: '能量', mark: '+' },
        shield: { color: '#8a5cff', label: '护盾', mark: '⬡' },
        charge: { color: '#ffb14a', label: '充能', mark: '✦' },
        heal: { color: '#ffffff', label: '生命', mark: '♥' },
        speed: { color: '#27ff7a', label: '疾行', mark: '»' },
        blade: { color: '#ff3df2', label: '刀刃', mark: '刃' },
        bullet: { color: '#00eaff', label: '弹幕', mark: '•' },
        invincible: { color: '#ffe178', label: '无敌', mark: '∞' },
        magnet: { color: '#57ffda', label: '牵引', mark: '⌁' },
        freeze: { color: '#7ec8ff', label: '冻结', mark: '❄' },
        nova: { color: '#ffffff', label: '新星', mark: '✹' },
        overdrive: { color: '#ffe178', label: '超载', mark: 'Ω' },
        guardian: { color: '#8a5cff', label: '神盾', mark: '◆' },
        timewarp: { color: '#7ec8ff', label: '时停', mark: '⌬' },
        berserk: { color: '#ff4f3f', label: '狂热', mark: '狂' },
        storm: { color: '#00eaff', label: '弹幕风暴', mark: '暴' },
        laser: { color: '#9efcff', label: '光矛', mark: '矛' },
        mine: { color: '#ffb14a', label: '震爆雷', mark: '雷' },
        blackhole: { color: '#7b4dff', label: '黑洞', mark: '洞' },
        blink: { color: '#ffffff', label: '闪现', mark: '闪' },
        repair: { color: '#8a5cff', label: '修复', mark: '修' },
        cleanser: { color: '#b8f7ff', label: '净化', mark: '净' },
        phase: { color: '#ffe178', label: '相位', mark: '相' },
        drone: { color: '#57ffda', label: '无人机', mark: '机' },
        meteor: { color: '#ff7c4d', label: '陨星', mark: '陨' },
        gold: { color: '#ffd34d', label: '金币雨', mark: '金' },
        surge: { color: '#00ffbf', label: '涌能', mark: '涌' },
        thornmail: { color: '#27ff7a', label: '反伤甲', mark: '甲' },
        vampire: { color: '#ff6b9f', label: '虹吸', mark: '吸' },
        splitter: { color: '#ff8dff', label: '分裂弹', mark: '裂' },
        echo: { color: '#b56cff', label: '回声', mark: '回' },
        sanctuary: { color: '#ffffff', label: '圣域', mark: '圣' },
        jackpot: { color: '#ffe178', label: '开奖', mark: '奖' },
        miracle: { color: '#ffffff', label: '奇迹', mark: '奇' }
      };
      return map[type] || map.good;
    }

    function updateHud(state) {
      var activeRun = running && !paused;
      var pulseReady = activeRun && pulse >= 100;
      var dashReady = activeRun && dashCooldown <= 0;
      var now = performance.now();
      var interval = isLiteGameRender() ? 180 : 90;
      if (!state && running && !paused && !over && now - lastHudDomPaint < interval) return;
      lastHudDomPaint = now;
      if (scoreEl) scoreEl.textContent = score;
      if (comboEl) comboEl.textContent = 'x' + multiplier().toFixed(1);
      if (waveEl) waveEl.textContent = String(wave);
      if (lifeEl) lifeEl.textContent = lives + '/' + maxLives();
      if (pulseEl) pulseEl.textContent = Math.floor(clamp(pulse, 0, 100)) + '%';
      if (dashEl) dashEl.textContent = dashCooldown <= 0 ? '就绪' : dashCooldown.toFixed(1) + 's';
      if (bestEl) bestEl.textContent = best;
      if (stateEl) stateEl.textContent = state || (paused ? '已暂停 · ' + level().label + ' · WAVE ' + wave : running ? '运行中 · ' + level().label + ' · WAVE ' + wave : over ? '已结束 · ' + level().label + ' · WAVE ' + wave : '待机 · ' + level().label + '难度');
      startBtn.textContent = running ? '重新开始' : over ? '再玩一局' : '开始游戏';
      startBtn.disabled = false;
      if (pauseBtn) { pauseBtn.textContent = paused ? '继续' : '暂停'; pauseBtn.disabled = !(running && !over); }
      if (mobilePauseBtn) { mobilePauseBtn.textContent = paused ? '继续' : '暂停'; mobilePauseBtn.hidden = !(fullscreenElement() === gameCard && isTouchLayout() && running && !over); }
      if (mobileStartBtn) { mobileStartBtn.textContent = running ? '重开' : '开始'; mobileStartBtn.hidden = over || !(fullscreenElement() === gameCard && isTouchLayout()); }
      pulseBtn.disabled = !pulseReady;
      dashBtn.disabled = !dashReady;
      if (mobilePulseBtn) mobilePulseBtn.disabled = !pulseReady;
      if (mobileDashBtn) mobileDashBtn.disabled = !dashReady;
      setReadyClasses(pulseReady, dashReady);
    }

    function setLevel(next) {
      if (!levels[next]) return;
      currentLevel = next;
      readBest();
      lives = running ? lives : level().lives;
      levelButtons.forEach(function (btn) { btn.classList.toggle('active', btn.dataset.level === currentLevel); });
      updateHud(running ? '运行中 · ' + level().label + ' · WAVE ' + wave : over ? '已结束 · ' + level().label + ' · WAVE ' + wave : '待机 · ' + level().label + '难度');
      draw(performance.now());
    }

    function gainScore(value) {
      scoreFloat += value * multiplier();
      score = Math.floor(scoreFloat);
      if (score > best) best = score;
    }

    function itemRank(type) { return itemRanks[type] || 0; }

    function hasItem(type) { return itemRank(type) > 0; }

    function pickupTierLabel(tier) { return tier >= 3 ? '超频' : tier === 2 ? '强化' : '标准'; }

    function rollPickupTier(type, forced) {
      if (runTime < 1.2) return 1;
      var rareType = ['nova', 'overdrive', 'guardian', 'timewarp', 'blackhole', 'meteor', 'jackpot', 'miracle'].indexOf(type) >= 0;
      var tier3Chance = wave >= 7 ? Math.min(0.16, 0.035 + wave * 0.006 + rarityPity * 0.004) : 0;
      var tier2Chance = wave >= 3 ? Math.min(0.38, 0.12 + wave * 0.012 + rarityPity * 0.008) : 0.05;
      if (rareType) { tier3Chance *= 0.72; tier2Chance *= 0.84; }
      if (forced) { tier3Chance *= 0.75; tier2Chance *= 0.9; }
      var roll = Math.random();
      if (roll < tier3Chance) { rarityPity = 0; return 3; }
      if (roll < tier3Chance + tier2Chance) { rarityPity = Math.max(0, rarityPity - 2); return 2; }
      rarityPity = Math.min(12, rarityPity + 1);
      return 1;
    }

    function registerPickup(type) {
      pickupCount += 1;
      var before = itemRank(type);
      itemRanks[type] = Math.min(3, before + 1);
      return { rank: itemRanks[type], upgraded: itemRanks[type] > before, overflow: before >= 3 };
    }

    function pickupScale(p, rank, echoFactor) {
      return (1 + Math.max(0, rank - 1) * 0.16 + Math.max(0, (p.tier || 1) - 1) * 0.20) * (echoFactor == null ? 1 : echoFactor);
    }

    function pickupDuration(base, p, rank, echoFactor) {
      return base * (1 + Math.max(0, rank - 1) * 0.12 + Math.max(0, (p.tier || 1) - 1) * 0.15) * (echoFactor == null ? 1 : Math.max(0.65, echoFactor));
    }

    function extendEffect(current, amount, cap) {
      var next = current > 0 ? current + amount * 0.58 : amount;
      return Math.min(cap, Math.max(current, next));
    }

    function findSafePoint() {
      var bestPoint = { x: gameW * 0.5, y: gameH * 0.72 };
      var bestScore = -Infinity;
      for (var i = 0; i < 18; i++) {
        var x = 42 + Math.random() * Math.max(80, gameW - 84);
        var y = 42 + Math.random() * Math.max(80, gameH - 84);
        var nearest = Math.min(x, y, gameW - x, gameH - y) * 0.35;
        hazards.forEach(function (h) {
          if (!h || h.defeated) return;
          nearest += Math.min(260, Math.hypot(h.x - x, h.y - y)) * (h.boss ? 0.7 : 0.22);
        });
        bossShots.forEach(function (shot) { nearest += Math.min(120, Math.hypot(shot.x - x, shot.y - y)) * 0.08; });
        if (nearest > bestScore) { bestScore = nearest; bestPoint = { x: x, y: y }; }
      }
      return bestPoint;
    }

    function convertEnemyShots(limit, color, damage) {
      var converted = 0;
      for (var i = bossShots.length - 1; i >= 0 && converted < limit; i--) {
        var shot = bossShots[i];
        if (!shot || shot.type === 'beam') continue;
        var a = Math.atan2(shot.vy || 0, shot.vx || 1) + Math.PI;
        pushPlayerBullet(a, 590, damage, color, 1, 1.15, 4.2);
        bullets[bullets.length - 1].x = shot.x;
        bullets[bullets.length - 1].y = shot.y;
        bossShots.splice(i, 1);
        converted += 1;
      }
      return converted;
    }

    function shuffledCopy(list) {
      var copy = list.slice();
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var hold = copy[i]; copy[i] = copy[j]; copy[j] = hold;
      }
      return copy;
    }

    function announceSynergy(type, meta) {
      if (synergyCooldown > 0) return;
      var text = '';
      if ((type === 'blade' || type === 'speed') && hasItem('blade') && hasItem('speed')) text = '共鸣 · 风切推进';
      else if ((type === 'bullet' || type === 'splitter') && hasItem('bullet') && hasItem('splitter')) text = '共鸣 · 镜像弹仓';
      else if ((type === 'shield' || type === 'thornmail') && hasItem('shield') && hasItem('thornmail')) text = '共鸣 · 反应装甲';
      else if ((type === 'freeze' || type === 'laser') && hasItem('freeze') && hasItem('laser')) text = '共鸣 · 极寒光矛';
      else if ((type === 'magnet' || type === 'blackhole') && hasItem('magnet') && hasItem('blackhole')) text = '共鸣 · 奇点引擎';
      else if ((type === 'heal' || type === 'vampire') && hasItem('heal') && hasItem('vampire')) text = '共鸣 · 再生血契';
      else if ((type === 'charge' || type === 'surge') && hasItem('charge') && hasItem('surge')) text = '共鸣 · 零延迟回路';
      if (text) { addGameNotice(text, meta.color, 1.6); synergyCooldown = 2.4; }
    }

    function applyMiracleModule(name, scale, meta) {
      if (name === 'chronos') { timeStopTime = extendEffect(timeStopTime, 2.4 * scale, 6.8); pulse = clamp(pulse + 34, 0, 100); }
      else if (name === 'aegis') { shield = maxShield(); grace = Math.max(grace, 1.8); sanctuaryTime = extendEffect(sanctuaryTime, 4.0 * scale, 9); }
      else if (name === 'arsenal') { overdriveTime = extendEffect(overdriveTime, 4.2 * scale, 12); bladeTime = extendEffect(bladeTime, 3.8 * scale, 13); gunTime = extendEffect(gunTime, 4.2 * scale, 14); }
      else if (name === 'swarm') { addPlayerTech('drone', { life: 5.2 * scale, damage: 30 + wave * 2, color: meta.color, fire: 0.20 }); }
      else if (name === 'singularity') { addPlayerTech('blackhole', { x: player.x, y: player.y, life: 3.8 * scale, r: 116, damage: 48 + wave * 3, color: meta.color }); }
      else if (name === 'rebirth') { lives = Math.min(maxLives(), lives + 1); repairTime = extendEffect(repairTime, 6.0 * scale, 12); }
    }

    function applyPickupEffect(p, meta, echoFactor) {
      var record = echoFactor == null ? registerPickup(p.type) : { rank: itemRank(p.type), upgraded: false, overflow: false };
      var rank = Math.max(1, record.rank || 1);
      var scale = pickupScale(p, rank, echoFactor);
      var durationScale = pickupDuration(1, p, rank, echoFactor);
      var echoing = echoFactor != null;
      var notice = meta.label + ' R' + rank + ' · ' + pickupTierLabel(p.tier || 1);
      if (!echoing) {
        addFloatText(p.x, p.y - 10, notice, meta.color);
        if (record.upgraded && rank > 1) addGameNotice(meta.label + ' 进化至 R' + rank, meta.color, 1.25);
        else if (record.overflow) { pulse = clamp(pulse + 6, 0, 100); gainScore(12 + wave * 2); addGameNotice(meta.label + ' 满阶共振', meta.color, 1.1); }
      }

      if (p.type === 'good') {
        combo += 1 + rank; comboTimer = Math.max(comboTimer, 3.6 + rank * 0.35); pulse = clamp(pulse + 11 * scale, 0, 100);
        fireRadialBullets(5 + rank * 2, (15 + wave) * scale, meta.color, 520 + rank * 25, rank >= 3 ? 1 : 0);
        if (rank >= 3) addPlayerTech('chain', { life: 1.8 * durationScale, damage: 26 + wave * 2, color: meta.color, fire: 0.48 });
        gainScore(14 * scale); addParticles(p.x, p.y, meta.color, 16 + rank * 3, 170);
      } else if (p.type === 'shield') {
        shield = Math.min(maxShield(), shield + 62 * scale); pulse = clamp(pulse + 8 * scale, 0, 100);
        damageHazardsInRadius(player.x, player.y, 135 + rank * 18, 80 + rank * 18, (62 + wave * 4) * scale, meta.color, '-盾震');
        if (rank >= 3) thornTime = extendEffect(thornTime, 3.2 * durationScale, 11);
        gainScore(13 * scale); addParticles(p.x, p.y, meta.color, 18 + rank * 3, 185);
      } else if (p.type === 'charge') {
        var beforePulse = pulse; pulse = clamp(pulse + 36 * scale, 0, 100); comboTimer = Math.max(comboTimer, 3.0);
        fireRadialBullets(7 + rank * 2, (17 + wave) * scale, meta.color, 550, rank >= 2 ? 1 : 0);
        if (beforePulse + 36 * scale > 100 || rank >= 3) { dashCooldown = Math.max(0, dashCooldown - 1.4); addPlayerTech('chain', { life: 2.2 * durationScale, damage: 34 + wave * 2, color: meta.color, fire: 0.40 }); }
        gainScore(15 * scale); addParticles(p.x, p.y, meta.color, 20 + rank * 2, 200);
      } else if (p.type === 'heal') {
        var wasFull = lives >= maxLives(); lives = Math.min(maxLives(), lives + (p.tier >= 3 ? 2 : 1)); shield = Math.min(maxShield(), shield + 32 * scale); grace = Math.max(grace, 1.15 + rank * 0.18);
        if (wasFull) { shield = Math.min(maxShield(), shield + 48 * scale); repairTime = extendEffect(repairTime, 4.0 * durationScale, 10); }
        bossShots = bossShots.slice(-Math.max(3, 9 - rank * 2)); gainScore(19 * scale); addParticles(p.x, p.y, meta.color, 22, 180);
      } else if (p.type === 'speed') {
        speedBoostTime = extendEffect(speedBoostTime, 7.2 * durationScale, 16); dashCooldown = 0; comboTimer = Math.max(comboTimer, 3.0);
        addPlayerTech('trail', { life: 3.8 * durationScale, color: meta.color, damage: 34 + wave * 2 + rank * 8, fire: Math.max(0.20, 0.34 - rank * 0.04), r: 48 + rank * 7 });
        gainScore(13 * scale); addParticles(p.x, p.y, meta.color, 22 + rank * 2, 240);
      } else if (p.type === 'blade') {
        bladeTime = extendEffect(bladeTime, 7.4 * durationScale, 16); comboTimer = Math.max(comboTimer, 3.2);
        addPlayerTech('chain', { life: (1.8 + rank * 0.45) * durationScale, damage: 30 + wave * 2 + rank * 5, color: meta.color, fire: Math.max(0.26, 0.40 - rank * 0.04) });
        gainScore(17 * scale); addParticles(p.x, p.y, meta.color, 24 + rank * 3, 230);
      } else if (p.type === 'bullet') {
        gunTime = extendEffect(gunTime, 8.0 * durationScale, 17); fireTimer = Math.min(fireTimer, 0.02);
        fireRadialBullets(8 + rank * 3, (20 + wave) * scale, meta.color, 600, rank >= 2 ? 2 : 1);
        gainScore(17 * scale); addParticles(p.x, p.y, meta.color, 24 + rank * 3, 230);
      } else if (p.type === 'invincible') {
        invincible = extendEffect(invincible, 3.2 * durationScale, 7.2); grace = Math.max(grace, invincible);
        addPlayerTech('blackhole', { x: player.x, y: player.y, life: (1.5 + rank * 0.35) * durationScale, r: 82 + rank * 10, damage: 30 + wave * 2 + rank * 8, color: meta.color });
        gainScore(21 * scale); addParticles(p.x, p.y, meta.color, 26 + rank * 2, 240);
      } else if (p.type === 'magnet') {
        magnetTime = extendEffect(magnetTime, 8.2 * durationScale, 17);
        addPlayerTech('blackhole', { x: player.x, y: player.y, life: (2.2 + rank * 0.45) * durationScale, r: 88 + rank * 12, damage: 26 + wave * 2 + rank * 7, color: meta.color });
        gainScore(13 * scale); addParticles(p.x, p.y, meta.color, 22 + rank * 2, 200);
      } else if (p.type === 'freeze') {
        freezeTime = extendEffect(freezeTime, 4.6 * durationScale, 10.5); pulse = clamp(pulse + 10 * scale, 0, 100);
        for (var iceN = 0; iceN < 2 + rank; iceN++) addPlayerTech('mine', { x: player.x + Math.cos(iceN * Math.PI * 2 / (2 + rank)) * (66 + rank * 5), y: player.y + Math.sin(iceN * Math.PI * 2 / (2 + rank)) * (66 + rank * 5), delay: 0.42 + iceN * 0.14, life: 2.0, r: 74 + rank * 8, damage: (145 + wave * 7) * scale, color: meta.color });
        gainScore(18 * scale); addParticles(p.x, p.y, meta.color, 24 + rank * 2, 210);
      } else if (p.type === 'nova') {
        var novaDamage = (360 + wave * 26) * scale;
        damageAllHazards(999, novaDamage, meta.color, '-' + Math.round(novaDamage)); pulse = 100;
        addPlayerTech('chain', { life: (2.2 + rank * 0.45) * durationScale, damage: 58 + wave * 4 + rank * 8, color: meta.color, fire: 0.34 });
        if (rank >= 3) addPlayerTech('sanctuary', { life: 3.6, r: 104, damage: 32 + wave * 2, color: meta.color, fire: 0.46 });
        gainScore(44 * scale); addParticles(p.x, p.y, meta.color, 36 + rank * 4, 300); addRing(player.x, player.y, meta.color, 32, 0.66, 260, true);
      } else if (p.type === 'overdrive') {
        overdriveTime = extendEffect(overdriveTime, 8.4 * durationScale, 14); speedBoostTime = extendEffect(speedBoostTime, 7.8 * durationScale, 14); bladeTime = extendEffect(bladeTime, 7.2 * durationScale, 14); gunTime = extendEffect(gunTime, 7.5 * durationScale, 15); fireTimer = 0;
        addPlayerTech('drone', { life: (5.4 + rank) * durationScale, damage: 26 + wave * 2 + rank * 5, color: meta.color, fire: Math.max(0.16, 0.23 - rank * 0.02) });
        addPlayerTech('chain', { life: (3.2 + rank * 0.5) * durationScale, damage: 48 + wave * 3 + rank * 6, color: meta.color, fire: 0.34 });
        gainScore(52 * scale); addRing(player.x, player.y, meta.color, 28, 0.62, 220, true);
      } else if (p.type === 'guardian') {
        shield = maxShield(); grace = Math.max(grace, 2.0 + rank * 0.25); if (lives < maxLives() && (rank >= 2 || lives <= 2)) lives += 1;
        bossShots = []; dangerZones = []; sanctuaryTime = extendEffect(sanctuaryTime, (3.4 + rank * 0.8) * durationScale, 11);
        addPlayerTech('sanctuary', { life: (3.2 + rank * 0.6) * durationScale, r: 100 + rank * 12, damage: 28 + wave * 2 + rank * 7, color: meta.color, fire: 0.5 });
        gainScore(40 * scale); addRing(player.x, player.y, meta.color, 24, 0.6, 210, true);
      } else if (p.type === 'timewarp') {
        timeStopTime = extendEffect(timeStopTime, 4.0 * durationScale, 7.5); freezeTime = Math.max(freezeTime, 1.2 + rank * 0.25); invincible = Math.max(invincible, 1.2 + rank * 0.18); pulse = clamp(pulse + 42 * scale, 0, 100);
        for (var tw = 0; tw < Math.min(3, rank + 1); tw++) addPlayerTech('laser', { life: 0.9 + rank * 0.18, color: meta.color, damage: 60 + wave * 4 + rank * 10, angle: Math.atan2(player.faceY, player.faceX) + (tw - (rank / 2)) * 0.55 });
        gainScore(46 * scale); addRing(player.x, player.y, meta.color, 26, 0.66, 245, true);
      } else if (p.type === 'berserk') {
        overdriveTime = extendEffect(overdriveTime, 5.0 * durationScale, 11); speedBoostTime = extendEffect(speedBoostTime, 5.4 * durationScale, 11); gunTime = extendEffect(gunTime, 5.2 * durationScale, 12); bladeTime = extendEffect(bladeTime, 4.8 * durationScale, 11);
        fireRadialBullets(12 + rank * 3, (23 + wave * 1.4) * scale, meta.color, 640, rank >= 2 ? 2 : 1); gainScore(35 * scale); addGameNotice('狂热连锁 · R' + rank, meta.color, 1.3);
      } else if (p.type === 'storm') {
        addPlayerTech('storm', { life: (3.2 + rank * 0.75) * durationScale, damage: 22 + wave * 1.5 + rank * 5, color: meta.color, fire: Math.max(0.20, 0.36 - rank * 0.04), r: 8 + rank * 2 });
        fireRadialBullets(12 + rank * 4, (22 + wave * 1.2) * scale, meta.color, 640, rank >= 2 ? 2 : 1); gainScore(28 * scale); addGameNotice('旋涡弹幕持续展开', meta.color, 1.3);
      } else if (p.type === 'laser') {
        var beams = 1 + rank;
        for (var beam = 0; beam < beams; beam++) addPlayerTech('laser', { life: (0.9 + rank * 0.18) * durationScale, color: meta.color, damage: (72 + wave * 5 + rank * 10) * scale, angle: Math.atan2(player.faceY, player.faceX) + (beam - (beams - 1) / 2) * 0.58 });
        if (hasItem('freeze')) freezeTime = extendEffect(freezeTime, 1.2, 10.5);
        gainScore(28 * scale); addGameNotice(beams + ' 束光矛交叉切割', meta.color, 1.3);
      } else if (p.type === 'mine') {
        var mineCount = 3 + rank;
        for (var mineN = 0; mineN < mineCount; mineN++) addPlayerTech('mine', { x: player.x + Math.cos(mineN * Math.PI * 2 / mineCount) * (62 + rank * 7), y: player.y + Math.sin(mineN * Math.PI * 2 / mineCount) * (62 + rank * 7), delay: 0.4 + mineN * 0.13, life: 2.4, r: 82 + rank * 9, damage: (230 + wave * 13 + rank * 24) * scale, color: meta.color });
        gainScore(28 * scale); addGameNotice(mineCount + ' 枚震爆雷已布置', meta.color, 1.3);
      } else if (p.type === 'blackhole') {
        magnetTime = extendEffect(magnetTime, 5.8 * durationScale, 15); freezeTime = extendEffect(freezeTime, 1.5 + rank * 0.35, 9);
        addPlayerTech('blackhole', { x: player.x, y: player.y, life: (3.6 + rank * 0.6) * durationScale, r: 108 + rank * 16, damage: (48 + wave * 4 + rank * 9) * scale, color: meta.color });
        if (rank >= 2) addPlayerTech('chain', { life: 2.4 + rank * 0.35, damage: 40 + wave * 3, color: meta.color, fire: 0.44 });
        gainScore(44 * scale); addGameNotice('奇点等级 R' + rank, meta.color, 1.4);
      } else if (p.type === 'blink') {
        var oldBlinkX = player.x, oldBlinkY = player.y, safe = findSafePoint(); player.x = safe.x; player.y = safe.y; dashCooldown = 0; grace = Math.max(grace, 1.35 + rank * 0.25);
        addPlayerTech('mine', { x: oldBlinkX, y: oldBlinkY, delay: 0.14, life: 1.5, r: 78 + rank * 8, damage: (180 + wave * 11 + rank * 25) * scale, color: meta.color });
        if (rank >= 2) addPlayerTech('mine', { x: player.x, y: player.y, delay: 0.32, life: 1.7, r: 70 + rank * 8, damage: (150 + wave * 9) * scale, color: meta.color });
        gainScore(20 * scale); addRing(player.x, player.y, meta.color, 18, 0.4, 140, true);
      } else if (p.type === 'repair') {
        shield = Math.min(maxShield(), shield + 82 * scale); if (lives <= 2) lives = Math.min(maxLives(), lives + 1); repairTime = extendEffect(repairTime, (5.0 + rank) * durationScale, 14);
        addPlayerTech('repair', { life: (5.0 + rank) * durationScale, damage: 18 + wave + rank * 5, color: meta.color, fire: Math.max(0.42, 0.72 - rank * 0.08) });
        gainScore(22 * scale); addGameNotice('修复蜂群持续维护', meta.color, 1.2);
      } else if (p.type === 'cleanser') {
        var converted = convertEnemyShots(6 + rank * 4, meta.color, (20 + wave + rank * 5) * scale); bossShots = []; dangerZones = []; grace = Math.max(grace, 1.1 + rank * 0.2); pulse = clamp(pulse + 20 * scale, 0, 100);
        fireRadialBullets(8 + rank * 3, (20 + wave) * scale, meta.color, 600, rank >= 2 ? 2 : 1); gainScore(22 * scale); addGameNotice('净化反制 · 转化 ' + converted + ' 发', meta.color, 1.2);
      } else if (p.type === 'phase') {
        invincible = extendEffect(invincible, 2.5 * durationScale, 5.8); grace = Math.max(grace, invincible); speedBoostTime = extendEffect(speedBoostTime, 3.8 * durationScale, 10);
        for (var ph = 0; ph < rank; ph++) addPlayerTech('laser', { life: 0.65 + ph * 0.16, color: meta.color, damage: 48 + wave * 3 + rank * 7, angle: Math.atan2(player.faceY, player.faceX) + Math.PI + (ph - 1) * 0.38 });
        gainScore(24 * scale); addGameNotice('相位残像 ×' + rank, meta.color, 1.2);
      } else if (p.type === 'drone') {
        gunTime = extendEffect(gunTime, 5.5 * durationScale, 13); fireTimer = 0;
        var droneGroups = Math.min(isLiteGameRender() ? 2 : 3, rank);
        for (var dg = 0; dg < droneGroups; dg++) addPlayerTech('drone', { life: (8.5 + rank * 1.2) * durationScale, damage: (18 + wave * 1.2 + rank * 5) * scale, color: meta.color, fire: Math.max(isLiteGameRender() ? 0.30 : 0.20, 0.30 - rank * 0.035 + dg * 0.025) });
        gainScore(18 * scale); addGameNotice('无人机编队 ×' + droneGroups, meta.color, 1.3);
      } else if (p.type === 'meteor') {
        damageAllHazards(210 * scale, (390 + wave * 18) * scale, meta.color, '-陨星');
        var meteorCount = 2 + rank;
        for (var meteorN = 0; meteorN < meteorCount; meteorN++) {
          var target = hazards.length ? hazards[meteorN % hazards.length] : null;
          addPlayerTech('mine', { x: target ? target.x : 50 + Math.random() * Math.max(80, gameW - 100), y: target ? target.y : 50 + Math.random() * Math.max(80, gameH - 100), delay: 0.3 + meteorN * 0.16, life: 2.1, r: 92 + rank * 7, damage: (250 + wave * 13 + rank * 26) * scale, color: meta.color });
        }
        gainScore(48 * scale); addGameNotice('追踪陨星 ×' + meteorCount, meta.color, 1.4);
      } else if (p.type === 'gold') {
        combo += 2 + rank; comboTimer = Math.max(comboTimer, 4.4 + rank * 0.4); pulse = clamp(pulse + 16 * scale, 0, 100);
        if (!echoing && Math.random() < Math.min(0.48, 0.14 + rank * 0.08 + (p.tier || 1) * 0.04)) spawnPickup(wave >= 7 && rank >= 3 ? 'jackpot' : 'charge');
        fireRadialBullets(6 + rank * 2, (16 + wave) * scale, meta.color, 560, rank >= 3 ? 1 : 0); gainScore((62 + wave * 5) * scale); addParticles(p.x, p.y, meta.color, 26 + rank * 2, 200);
      } else if (p.type === 'surge') {
        pulse = 100; dashCooldown = 0; boostFlash = 0.55;
        addPlayerTech('chain', { life: (2.8 + rank * 0.7) * durationScale, damage: (38 + wave * 3 + rank * 7) * scale, color: meta.color, fire: Math.max(0.24, 0.46 - rank * 0.055) });
        if (hasItem('charge')) fireRadialBullets(6 + rank * 2, 22 + wave * 2, meta.color, 640, 1);
        gainScore(18 * scale); addGameNotice('链式电涌 R' + rank, meta.color, 1.3);
      } else if (p.type === 'thornmail') {
        shield = Math.min(maxShield(), shield + 58 * scale); bladeTime = extendEffect(bladeTime, 5.8 * durationScale, 13); thornTime = extendEffect(thornTime, (6.8 + rank) * durationScale, 15);
        for (var thornN = 0; thornN < 2 + rank; thornN++) addPlayerTech('mine', { x: player.x + Math.cos(thornN * Math.PI * 2 / (2 + rank)) * 70, y: player.y + Math.sin(thornN * Math.PI * 2 / (2 + rank)) * 70, delay: 0.55 + thornN * 0.12, life: 2.0, r: 66 + rank * 7, damage: (165 + wave * 9 + rank * 20) * scale, color: meta.color });
        gainScore(26 * scale); addGameNotice('反应装甲持续 ' + Math.ceil(thornTime) + 's', meta.color, 1.2);
      } else if (p.type === 'vampire') {
        damageHazardsInRadius(player.x, player.y, 230 + rank * 25, 120 * scale, (210 + wave * 11) * scale, meta.color, '-虹吸');
        if (lives < maxLives()) lives += 1; else shield = Math.min(maxShield(), shield + 55 * scale); vampireTime = extendEffect(vampireTime, (7.5 + rank * 1.4) * durationScale, 16); siphonKills = 0;
        addPlayerTech('blackhole', { x: player.x, y: player.y, life: 2.0 + rank * 0.35, r: 78 + rank * 10, damage: 28 + wave * 2 + rank * 6, color: meta.color }); gainScore(31 * scale); addGameNotice('虹吸血契已激活', meta.color, 1.2);
      } else if (p.type === 'splitter') {
        gunTime = extendEffect(gunTime, 6.4 * durationScale, 14); splitterTime = extendEffect(splitterTime, (7.0 + rank * 1.3) * durationScale, 16);
        fireRadialBullets(10 + rank * 4, (20 + wave) * scale, meta.color, 590, 2 + rank); addPlayerTech('drone', { life: 3.0 + rank * 0.6, damage: 16 + wave + rank * 4, color: meta.color, fire: 0.27 }); gainScore(26 * scale); addGameNotice('分裂弹仓 R' + rank, meta.color, 1.2);
      } else if (p.type === 'echo') {
        echoCharges = Math.min(2, echoCharges + (rank >= 3 && p.tier >= 2 ? 2 : 1));
        bladeTime = extendEffect(bladeTime, 3.2 * durationScale, 10); gunTime = extendEffect(gunTime, 3.2 * durationScale, 11); magnetTime = extendEffect(magnetTime, 3.4 * durationScale, 12);
        addPlayerTech('chain', { life: 2.6 + rank * 0.4, damage: 35 + wave * 3 + rank * 5, color: meta.color, fire: 0.38 }); gainScore(29 * scale); addGameNotice('回声缓存 ' + echoCharges + ' 次', meta.color, 1.2);
      } else if (p.type === 'sanctuary') {
        shield = maxShield(); grace = Math.max(grace, 1.5 + rank * 0.2); sanctuaryTime = extendEffect(sanctuaryTime, (5.0 + rank) * durationScale, 13); bossShots = bossShots.filter(function (shot) { return Math.hypot(shot.x - player.x, shot.y - player.y) > 230; }); dangerZones = [];
        addPlayerTech('sanctuary', { life: (4.4 + rank * 0.7) * durationScale, r: 96 + rank * 14, damage: 24 + wave * 2 + rank * 8, color: meta.color, fire: Math.max(0.34, 0.58 - rank * 0.06) }); gainScore(34 * scale); addGameNotice('移动圣域已展开', meta.color, 1.3);
      } else if (p.type === 'jackpot') {
        var prizePool = shuffledCopy(['storm', 'repair', wave >= 5 ? 'blackhole' : 'charge', wave >= 7 ? 'timewarp' : 'shield', 'drone', 'gold']);
        var prizeCount = Math.min(5, 2 + rank); for (var prize = 0; prize < prizeCount; prize++) spawnPickup(prizePool[prize]);
        pulse = clamp(pulse + 28 * scale, 0, 100); fireRadialBullets(14 + rank * 3, (25 + wave) * scale, meta.color, 650, 2); gainScore(72 * scale); addGameNotice('开奖 · ' + prizeCount + ' 连奖励', meta.color, 1.4);
      } else if (p.type === 'miracle') {
        var modules = shuffledCopy(['chronos', 'aegis', 'arsenal', 'swarm', 'singularity', 'rebirth']);
        var moduleCount = Math.min(5, 2 + rank); for (var module = 0; module < moduleCount; module++) applyMiracleModule(modules[module], scale, meta);
        fireRadialBullets(12 + rank * 4, (28 + wave) * scale, meta.color, 660, 2); gainScore(68 * scale); addGameNotice('奇迹矩阵 · ' + moduleCount + ' 模块', meta.color, 1.6);
      }

      if (!echoing) {
        announceSynergy(p.type, meta);
        if (echoCharges > 0 && p.type !== 'echo') {
          echoCharges -= 1;
          addGameNotice('回声复制 · ' + meta.label + ' 55%', '#b56cff', 1.2);
          applyPickupEffect(p, meta, 0.55);
        }
      }
    }

    function spawnPickup(forceType) {
      if (isLiteGameRender() && pickups.length >= 7 && !forceType) return;
      var types = ['good', 'good', 'good', 'speed', 'shield', 'charge', 'blade', 'bullet', 'magnet', 'repair', 'gold'];
      if (lives < maxLives()) types.push('heal', 'heal', 'vampire');
      if (shield < maxShield() * 0.45) types.push('shield', 'repair', 'sanctuary');
      if (wave >= 2) types.push('speed', 'invincible', 'freeze', 'blink', 'cleanser', 'surge');
      if (wave >= 3) types.push('blade', 'bullet', 'freeze', 'storm', 'mine', 'drone', 'thornmail');
      if (wave >= 4) types.push('laser', 'phase', 'splitter', 'echo');
      if (wave >= 5) types.push('nova', 'blackhole', 'meteor', 'berserk');
      if (wave >= 7) types.push('guardian', 'timewarp', 'jackpot');
      if (wave >= 9) types.push('overdrive', 'miracle');
      var godChance = clamp((wave - 5) * 0.016 + runTime * 0.0007, 0, 0.26);
      var gods = ['nova', 'overdrive', 'guardian', 'timewarp', 'blackhole', 'meteor', 'jackpot', 'miracle'];
      var type = forceType || (Math.random() < godChance ? gods[Math.floor(Math.random() * gods.length)] : types[Math.floor(Math.random() * types.length)]);
      var tier = rollPickupTier(type, !!forceType);
      pickups.push({
        x: 50 + Math.random() * Math.max(80, gameW - 100),
        y: 50 + Math.random() * Math.max(80, gameH - 100),
        r: pickupMeta(type).label.length >= 2 || type === 'heal' || type === 'nova' || type === 'overdrive' || type === 'guardian' || type === 'timewarp' ? 12.5 : type === 'blade' || type === 'bullet' || type === 'invincible' || type === 'magnet' || type === 'freeze' || type === 'speed' ? 11 : type === 'shield' ? 10.5 : 9,
        type: type, tier: tier,
        rot: Math.random() * Math.PI * 2,
        ttl: (['nova', 'overdrive', 'guardian', 'timewarp', 'blackhole', 'meteor', 'jackpot', 'miracle'].indexOf(type) >= 0 ? 11.5 : 9.0) + tier * 0.8 + Math.random() * 2.8
      });
    }

    function spawnHazard(kind) {
      if (hazards.length >= maxHazardCount()) return;
      var cfg = level();
      var edge = Math.floor(Math.random() * 4);
      var x = edge === 0 ? -28 : edge === 1 ? gameW + 28 : Math.random() * gameW;
      var y = edge === 2 ? -28 : edge === 3 ? gameH + 28 : Math.random() * gameH;
      var angle = Math.atan2(player.y - y, player.x - x);
      var waveBoost = 1 + (wave - 1) * 0.08 + Math.min(0.65, runTime / 190);
      var hazard = { x: x, y: y, vx: 0, vy: 0, rot: Math.random() * Math.PI * 2, near: false, kind: kind || 'seeker', elite: false, hit: 0 };
      if (hazard.kind === 'runner') { hazard.r = 8 + Math.random() * 3; hazard.speed = (162 + Math.random() * 34) * cfg.speed * waveBoost; }
      else if (hazard.kind === 'brute') { hazard.r = 18 + Math.random() * 7; hazard.speed = (88 + Math.random() * 20) * cfg.speed * waveBoost; hazard.elite = true; }
      else if (hazard.kind === 'orbit') { hazard.r = 11 + Math.random() * 4; hazard.speed = (126 + Math.random() * 28) * cfg.speed * waveBoost; }
      else if (hazard.kind === 'sniper') { hazard.r = 12 + Math.random() * 4; hazard.speed = (82 + Math.random() * 18) * cfg.speed * waveBoost; hazard.elite = true; hazard.shotTimer = 1.25 + Math.random(); }
      else { hazard.kind = 'seeker'; hazard.r = 11 + Math.random() * 5; hazard.speed = (108 + Math.random() * 32) * cfg.speed * waveBoost; }
      var stats = enemyStats(hazard.kind);
      var pressure = arsenalPressure();
      var difficultyHp = currentLevel === 'easy' ? 0.88 : currentLevel === 'hard' ? 1.12 : currentLevel === 'insane' ? 1.26 : 1;
      var championChance = wave >= 3 ? clamp(0.06 + (wave - 3) * 0.018 + (pressure - 1) * 0.05, 0, 0.28) : 0;
      hazard.champion = Math.random() < championChance;
      if (hazard.champion) {
        hazard.elite = true;
        hazard.r *= 1.12;
      }
      var eliteHp = hazard.champion ? 1.72 : hazard.elite ? 1.30 : 1;
      hazard.maxHp = Math.round(stats.hp * enemyHpScale() * pressure * difficultyHp * eliteHp);
      hazard.hp = hazard.maxHp;
      hazard.armorScale = hazard.champion ? 0.72 : hazard.elite ? 0.86 : 1;
      hazard.damage = Math.max(1, Math.round(stats.damage * enemyAtkScale() * (hazard.champion ? 1.18 : 1)));
      hazard.scoreValue = Math.round((stats.score + wave * 1.6) * (hazard.champion ? 1.85 : hazard.elite ? 1.20 : 1));
      hazard.color = stats.color;
      hazard.vx = Math.cos(angle) * hazard.speed;
      hazard.vy = Math.sin(angle) * hazard.speed;
      hazards.push(hazard);
    }

    function spawnBoss() {
      if (hasBoss()) return;
      var cfg = level();
      var profile = bossProfile(wave - 1);
      var side = wave % 4;
      var x = side === 0 ? gameW * 0.5 : side === 1 ? gameW + 64 : side === 2 ? gameW * 0.5 : -64;
      var y = side === 0 ? -64 : side === 1 ? gameH * 0.35 : side === 2 ? gameH + 64 : gameH * 0.62;
      var earlyBossEase = wave === 1 ? 1.08 : wave === 2 ? 1.14 : wave === 3 ? 1.20 : 1.08;
      var bossPressure = 1 + (arsenalPressure() - 1) * 0.72;
      var hp = Math.round(profile.hp * earlyBossEase * bossPressure * (1 + (wave - 1) * 0.24 + Math.min(2.05, runTime / 115)) * (currentLevel === 'easy' ? 0.76 : currentLevel === 'hard' ? 1.12 : currentLevel === 'insane' ? 1.36 : 0.96));
      var bossDamage = Math.max(1, Math.round(profile.damage * enemyAtkScale() * (wave <= 2 ? 0.78 : 1)));
      var boss = { boss: true, kind: 'boss', bossType: profile.type, name: profile.name, color: profile.color, glyph: profile.glyph || '', motif: (profile.type.length + wave) % 7, x: x, y: y, vx: 0, vy: 0, rot: 0, phase: Math.random() * 10, near: true, elite: true, r: clamp(34 + wave * 1.6, 36, 58), speed: (54 + wave * 2.8) * cfg.speed, maxHp: hp, hp: hp, damage: bossDamage, scoreValue: 150 + wave * 22, skillGap: Math.max(1.55, profile.skillGap - Math.min(0.55, wave * 0.035)), skillTimer: 1.45, hit: 0, dashTime: 0, spawnGuard: 2.15, spawnGuardMax: 2.15, damageCapacity: hp * 0.14, damageCapacityStamp: runTime };
      hazards.push(boss); bossSpawned = true;
      addRing(gameW * 0.5, gameH * 0.5, profile.color, 42, 0.5, 220, true);
      addFloatText(gameW * 0.5, 64, profile.name, profile.color);
      addGameNotice('BOSS ' + profile.name + ' 入侵', profile.color, 2.2);
    }

    function queueBossDefeat(boss) {
      if (!boss || pendingBossDefeat || waveBreakTimer > 0) return;
      boss.defeated = true;
      boss.hp = 0;
      pendingBossDefeat = {
        name: boss.name || 'BOSS',
        color: boss.color || '#ffffff',
        x: boss.x,
        y: boss.y,
        r: boss.r || 42,
        scoreValue: boss.scoreValue || (150 + wave * 22)
      };
    }

    function resolvePendingBossDefeat() {
      if (!pendingBossDefeat) return;
      var boss = pendingBossDefeat;
      pendingBossDefeat = null;
      hazards = hazards.filter(function (h) { return h && !h.boss; });
      bossShots = [];
      bullets = [];
      addParticles(boss.x, boss.y, boss.color, isLiteGameRender() ? 18 : 42, isLiteGameRender() ? 180 : 270);
      addRing(boss.x, boss.y, boss.color, boss.r + 8, 0.55, boss.r + 118, true);
      gainScore(boss.scoreValue);
      startWaveBreak(boss);
    }

    function startWaveBreak(boss) {
      if (waveBreakTimer > 0) return;
      boss = boss || { color: '#ffffff', name: 'BOSS' };
      waveBreakTimer = 3.9; bossDelay = 1.35; bossSpawned = false; bossShots = []; bullets = []; dangerZones = [];
      hazards = [];
      pulse = clamp(pulse + 30, 0, 100); comboTimer = Math.max(comboTimer, 3.5);
      grace = Math.max(grace, 1.1);
      spawnPickup(wave >= 7 ? 'guardian' : wave >= 5 ? 'nova' : 'charge');
      if (wave >= 4) spawnPickup();
      addGameNotice('击破 ' + (boss.name || 'BOSS') + ' · 休整中', boss.color || '#ffffff', 2.4);
    }

    function resolveThornRetaliation() {
      if (!thornBurstPending) return;
      var burst = thornBurstPending;
      thornBurstPending = null;
      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        if (!h || h.defeated) continue;
        if (Math.hypot(h.x - player.x, h.y - player.y) < burst.radius + h.r) {
          damageHazardByIndex(i, h.boss ? burst.bossDamage : burst.normalDamage, burst.color, h.boss ? '-反伤' : null);
          if (pendingBossDefeat) break;
        }
      }
      resolvePendingBossDefeat();
    }

    function destroyHazard(index, bonus) {
      var h = hazards[index];
      if (!h) return;
      var color = h.color || (h.elite ? '#ffb14a' : '#ff3f68');
      addParticles(h.x, h.y, color, h.boss ? 42 : h.elite ? 18 : 12, h.boss ? 270 : h.elite ? 190 : 150);
      addRing(h.x, h.y, color, h.r + 8, h.boss ? 0.55 : 0.24, h.boss ? h.r + 118 : h.r + 42, h.boss);
      if (h.boss) {
        queueBossDefeat(h);
        return;
      }
      if (vampireTime > 0) {
        var vampireRank = Math.max(1, itemRank('vampire'));
        var threshold = Math.max(3, 6 - vampireRank);
        siphonKills += 1;
        if (siphonKills >= threshold) {
          siphonKills -= threshold;
          siphonCycles += 1;
          var siphonShield = 18 + vampireRank * 6;
          shield = Math.min(maxShield(), shield + siphonShield);
          if (siphonCycles % 3 === 0 && lives < maxLives()) lives += 1;
          addRing(player.x, player.y, '#ff5fd2', 14, 0.26, 74, true);
          addFloatText(player.x, player.y - 34, siphonCycles % 3 === 0 ? '血契 +1♥' : '虹吸 +' + siphonShield, '#ff5fd2');
        }
      }
      gainScore(bonus || (h.scoreValue || (h.elite ? 12 : 7)));
      hazards.splice(index, 1);
    }

    function usePulse() {
      if (!running || paused || pulse < 100) return;
      pulse = 0;
      pulseFlash = 0.52;
      pulseBurst = 0.55;
      boostFlash = 0.52;
      addRing(player.x, player.y, '#00eaff', 20, 0.58, 232, true);
      addRing(player.x, player.y, '#ffffff', 8, 0.28, 120);
      addParticles(player.x, player.y, '#00eaff', 34, 250);
      var destroyed = 0;
      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        if (!h || h.defeated) continue;
        var dist = Math.hypot(h.x - player.x, h.y - player.y);
        if (dist < 220 + h.r) {
          var dmg = h.boss ? 190 + wave * 18 : 120;
          if (damageHazardByIndex(i, dmg, '#00eaff', h.boss ? '-' + dmg : null)) destroyed += 1;
          else destroyed += h.boss ? 0 : 1;
        }
      }
      resolvePendingBossDefeat();
      if (hasItem('charge') && hasItem('surge')) {
        var circuitRefund = 12 + Math.min(6, itemRank('charge') + itemRank('surge'));
        pulse = clamp(pulse + circuitRefund, 0, 100);
        dashCooldown = Math.max(0, dashCooldown - 0.8);
        if (synergyCooldown <= 0) {
          addGameNotice('零延迟回路 · 脉冲返还 ' + circuitRefund + '%', '#63f5ff', 1.35);
          synergyCooldown = 1.8;
        }
      }
      if (destroyed > 0) {
        combo += destroyed;
        comboTimer = Math.max(comboTimer, 3.6);
        addGameNotice('脉冲清场 +' + destroyed, '#00eaff', 1.8);
      } else {
        gainScore(6);
        addGameNotice('脉冲已释放', '#00eaff', 1.6);
      }
      updateHud();
    }

    function useDash() {
      if (!running || paused || dashCooldown > 0) return;
      var dx = 0;
      var dy = 0;
      if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
      if (keys.ArrowRight || keys.d || keys.D) dx += 1;
      if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
      if (keys.ArrowDown || keys.s || keys.S) dy += 1;
      if (!dx && !dy && isMobileFullscreen() && joystick.mag > 0.08) {
        dx = joystick.dx;
        dy = joystick.dy;
      }
      if (!dx && !dy) {
        dx = pointer.active ? pointer.x - player.x : player.faceX;
        dy = pointer.active ? pointer.y - player.y : player.faceY;
      }
      var len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      player.faceX = dx;
      player.faceY = dy;
      var dashStartX = player.x;
      var dashStartY = player.y;
      addParticles(player.x, player.y, '#8a5cff', 18, 190);
      player.x = clamp(player.x + dx * 110, player.r, gameW - player.r);
      player.y = clamp(player.y + dy * 110, player.r, gameH - player.r);
      dashCooldown = 2.6;
      boostFlash = 0.36;
      grace = Math.max(grace, 0.34);
      gainScore(4);
      addRing(player.x, player.y, '#8a5cff', 26, 0.28);
      if (hasItem('blade') && hasItem('speed') && dashSynergyCooldown <= 0) {
        var dashLength = Math.hypot(player.x - dashStartX, player.y - dashStartY);
        var dashAngle = Math.atan2(player.y - dashStartY, player.x - dashStartX);
        var synergyRank = Math.min(itemRank('blade'), itemRank('speed'));
        damageHazardsAlongLine(dashStartX, dashStartY, dashAngle, 22 + synergyRank * 4, dashLength + 24, 72 + synergyRank * 22, 38 + synergyRank * 14, '#57ffda', '-风切');
        addPlayerTech('dashslash', { x: dashStartX, y: dashStartY, angle: dashAngle, life: 0.42, r: dashLength + 32, color: '#57ffda' });
        dashSynergyCooldown = 0.75;
      }
      for (var i = hazards.length - 1; i >= 0; i--) {
        var dashTarget = hazards[i];
        if (!dashTarget || dashTarget.defeated) continue;
        if (Math.hypot(dashTarget.x - player.x, dashTarget.y - player.y) < 38 + dashTarget.r) damageHazardByIndex(i, dashTarget.boss ? 42 : 70, '#8a5cff', dashTarget.boss ? '-42' : null);
      }
      resolvePendingBossDefeat();
      updateHud();
    }

    function reset() {
      if (isGuardLocked()) {
        syncGuardUi();
        startQuizChallenge('time');
        return;
      }
      if (quizState && quizState.mode === 'revive') {
        quizState.active = false;
        saveQuizState();
        quizState = null;
        closeQuizModal();
      }
      clearRunSnapshot();
      running = true;
      paused = false;
      over = false;
      runId += 1;
      last = performance.now();
      spawnTimer = 1.55;
      scoreFloat = 0;
      score = 0;
      lives = level().lives;
      shield = 0;
      grace = 2.8;
      wave = 1;
      waveClock = 0;
      runTime = 0;
      waveBreakTimer = 0;
      bossDelay = 3.2;
      bossSpawned = false;
      shuffleBossDeck();
      combo = 0;
      comboTimer = 0;
      pulse = 34;
      pulseFlash = 0;
      pulseBurst = 0;
      dashCooldown = 0;
      damageFlash = 0;
      boostFlash = 0;
      hitFlashTimer = 0;
      bladeTime = 0;
      gunTime = 0;
      invincible = 0;
      magnetTime = 0;
      freezeTime = 0;
      timeStopTime = 0;
      speedBoostTime = 0;
      overdriveTime = 0;
      splitterTime = 0;
      vampireTime = 0;
      thornTime = 0;
      repairTime = 0;
      sanctuaryTime = 0;
      echoCharges = 0;
      itemRanks = Object.create(null);
      pickupCount = 0;
      rarityPity = 0;
      siphonKills = 0;
      siphonCycles = 0;
      synergyCooldown = 0;
      thornRetaliateCooldown = 0;
      dashSynergyCooldown = 0;
      thornBurstPending = null;
      fireTimer = 0;
      powerFlash = 0;
      lastPowerName = '';
      hazards = [];
      pickups = [];
      particles = [];
      rings = [];
      bullets = [];
      bossShots = [];
      dangerZones = [];
      playerTechs = [];
      floatTexts = [];
      gameNotices = [];
      pendingBossDefeat = null;
      lastMobileFramePaint = 0;
      gameHudCache.key = '';
      player.x = gameW / 2;
      player.y = gameH / 2;
      player.faceX = 1;
      player.faceY = 0;
      spawnPickup('good');
      spawnPickup('speed');
      spawnPickup('shield');
      spawnPickup('bullet');
      updateHud('运行中 · ' + level().label + ' · WAVE 1');
      saveRunSnapshot(false);
      updateReviveUi();
      requestAnimationFrame(function (now) { loop(now, runId); });
    }

    function endGame() {
      running = false;
      paused = false;
      over = true;
      runId += 1;
      if (score > best) {
        best = score;
        safeStorageSet(bestKey(), String(best));
      }
      setReadyClasses(false, false);
      addGameNotice(level().label + ' · ' + score + ' 分', '#ffe178', 2.4);
      updateHud('已结束 · ' + level().label + ' · WAVE ' + wave);
      saveRunSnapshot(true);
      updateReviveUi();
      draw(performance.now());
    }

    function togglePause() {
      if (!running || over) return;
      paused = !paused;
      if (!paused) last = performance.now();
      updateHud(paused ? '已暂停 · ' + level().label + ' · WAVE ' + wave : '运行中 · ' + level().label + ' · WAVE ' + wave);
      saveRunSnapshot(false);
      draw(performance.now());
    }

    function loop(now, id) {
      if (!running || id !== runId) return;
      if (isLiteGameRender()) {
        var targetGap = isMobileFullscreen() ? 28 : 24;
        if (lastMobileFramePaint && now - lastMobileFramePaint < targetGap) {
          requestAnimationFrame(function (next) { loop(next, id); });
          return;
        }
        lastMobileFramePaint = now;
      }
      if (paused) {
        last = now;
        draw(now);
        requestAnimationFrame(function (next) { loop(next, id); });
        return;
      }
      var dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      update(dt);
      draw(now);
      requestAnimationFrame(function (next) { loop(next, id); });
    }

    function update(dt) {
      var cfg = level();
      var dx = 0;
      var dy = 0;
      if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
      if (keys.ArrowRight || keys.d || keys.D) dx += 1;
      if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
      if (keys.ArrowDown || keys.s || keys.S) dy += 1;
      if (!dx && !dy && isMobileFullscreen() && joystick.active && joystick.mag > 0.08) {
        dx = joystick.dx;
        dy = joystick.dy;
      }
      if (dx || dy) {
        var len = Math.hypot(dx, dy) || 1;
        var mobileBoost = isMobileFullscreen() && joystick.active ? Math.max(0.46, joystick.mag) : 1;
        var moveSpeed = player.speed * (speedBoostTime > 0 ? 1.38 : 1) * (overdriveTime > 0 ? 1.22 : 1);
        player.x += dx / len * moveSpeed * mobileBoost * dt;
        player.y += dy / len * moveSpeed * mobileBoost * dt;
        player.faceX = dx / len;
        player.faceY = dy / len;
      } else if (pointer.active && !isMobileFullscreen()) {
        var mx = pointer.x - player.x;
        var my = pointer.y - player.y;
        var dist = Math.hypot(mx, my);
        if (dist > 1) {
          var moveSpeedPointer = player.speed * (speedBoostTime > 0 ? 1.38 : 1) * (overdriveTime > 0 ? 1.22 : 1);
          var step = Math.min(dist, moveSpeedPointer * 1.06 * dt);
          player.x += mx / dist * step;
          player.y += my / dist * step;
          player.faceX = mx / dist;
          player.faceY = my / dist;
        }
      }

      player.x = clamp(player.x, player.r, gameW - player.r);
      player.y = clamp(player.y, player.r, gameH - player.r);
      shield = clamp(shield, 0, maxShield());
      grace = Math.max(0, grace - dt);
      bladeTime = Math.max(0, bladeTime - dt);
      gunTime = Math.max(0, gunTime - dt);
      invincible = Math.max(0, invincible - dt);
      magnetTime = Math.max(0, magnetTime - dt);
      freezeTime = Math.max(0, freezeTime - dt);
      timeStopTime = Math.max(0, timeStopTime - dt);
      speedBoostTime = Math.max(0, speedBoostTime - dt);
      overdriveTime = Math.max(0, overdriveTime - dt);
      splitterTime = Math.max(0, splitterTime - dt);
      vampireTime = Math.max(0, vampireTime - dt);
      thornTime = Math.max(0, thornTime - dt);
      repairTime = Math.max(0, repairTime - dt);
      sanctuaryTime = Math.max(0, sanctuaryTime - dt);
      synergyCooldown = Math.max(0, synergyCooldown - dt);
      thornRetaliateCooldown = Math.max(0, thornRetaliateCooldown - dt);
      dashSynergyCooldown = Math.max(0, dashSynergyCooldown - dt);
      powerFlash = Math.max(0, powerFlash - dt);
      comboTimer = Math.max(0, comboTimer - dt);
      if (comboTimer <= 0 && combo > 0) combo = 0;
      dashCooldown = Math.max(0, dashCooldown - dt);
      pulseFlash = Math.max(0, pulseFlash - dt);
      pulseBurst = Math.max(0, pulseBurst - dt);
      damageFlash = Math.max(0, damageFlash - dt * 1.8);
      boostFlash = Math.max(0, boostFlash - dt * 1.7);
      hitFlashTimer = Math.max(0, hitFlashTimer - dt);
      if (hitFlashTimer <= 0) gameCard.classList.remove('is-hit');
      gameNotices.forEach(function (n) { n.life -= dt; });
      gameNotices = gameNotices.filter(function (n) { return n.life > 0; });
      pulse = clamp(pulse + dt * cfg.pulseGain * (overdriveTime > 0 ? 1.35 : 1), 0, 100);
      runTime += dt;
      if (hazards.length > 0 && waveBreakTimer <= 0) {
        fireTimer -= dt;
        var enhancedFire = gunTime > 0 || overdriveTime > 0;
        var fireGap = enhancedFire ? (overdriveTime > 0 ? (isLiteGameRender() ? 0.18 : 0.11) : (isLiteGameRender() ? 0.22 : 0.15)) : (isLiteGameRender() ? 0.46 : 0.34);
        while (fireTimer <= 0) {
          fireBullet(enhancedFire ? 'enhanced' : 'core');
          fireTimer += fireGap;
          if (isLiteGameRender() || !enhancedFire) break;
        }
      } else {
        fireTimer = Math.min(fireTimer, 0.12);
      }

      waveClock += dt;
      if (waveBreakTimer > 0) {
        waveBreakTimer = Math.max(0, waveBreakTimer - dt);
        if (waveBreakTimer <= 0) {
          wave += 1;
          waveClock = 0;
          bossDelay = 1.85;
          bossSpawned = false;
          pulse = clamp(pulse + 16, 0, 100);
          boostFlash = 0.36;
          addGameNotice('WAVE ' + wave + ' 来袭', cfg.color, 1.9);
          spawnPickup(wave >= 9 ? 'overdrive' : wave >= 7 ? 'timewarp' : wave >= 5 ? 'nova' : wave % 2 === 0 ? 'shield' : 'good');
        }
      } else if (!bossSpawned) {
        bossDelay -= dt;
        if (bossDelay <= 0) spawnBoss();
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0 && waveBreakTimer <= 0) {
        var bossActive = hasBoss();
        var pack = bossActive ? (wave >= 7 && Math.random() < 0.32 ? 2 : 1) : 1;
        if (!bossActive && (currentLevel === 'hard' || currentLevel === 'insane' || wave >= 4)) pack += 1;
        if (!bossActive && wave >= 6 && Math.random() < 0.3) pack += 1;
        for (var s = 0; s < pack; s++) {
          var roll = Math.random();
          var kind = bossActive
            ? (wave < 4 ? (roll < 0.62 ? 'runner' : 'seeker') : roll < 0.46 ? 'runner' : roll < 0.76 ? 'seeker' : roll < 0.94 ? 'orbit' : 'brute')
            : (roll < 0.42 ? 'seeker' : roll < 0.64 ? 'runner' : roll < 0.82 ? 'orbit' : roll < 0.94 ? 'brute' : 'sniper');
          spawnHazard(kind);
        }
        var pickupChance = Math.max(bossActive ? 0.18 : 0.13, (bossActive ? 0.42 : 0.36) - Math.min(0.20, wave * 0.014 + runTime * 0.0011));
        if (Math.random() < pickupChance) spawnPickup();
        var spawnBase = cfg.spawn / (1 + (wave - 1) * 0.10 + Math.min(0.55, runTime / 210)) - score * 0.00032;
        if (bossActive) spawnBase *= wave <= 3 ? 1.75 : 1.38;
        spawnTimer = Math.max(currentLevel === 'insane' ? 0.26 : currentLevel === 'hard' ? 0.32 : 0.42, spawnBase);
      }

      function spawnBossShot(x, y, angle, speed, color, damage, type) {
        var maxShots = isLiteGameRender() ? 28 : 86;
        if (bossShots.length >= maxShots) bossShots.splice(0, bossShots.length - maxShots + 1);
        bossShots.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: type === 'orb' ? 8 : 5.5, life: type === 'beam' ? 0.52 : 3.2, maxLife: type === 'beam' ? 0.52 : 3.2, color: color, damage: damage || 1, type: type || 'bolt', angle: angle, width: type === 'beam' ? 18 : 0, charge: type === 'beam' ? 0.18 : 0 });
      }

      function bossUseSkill(h) {
        var angle = Math.atan2(player.y - h.y, player.x - h.x);
        var color = h.color || '#ff3f68';
        function fan(count, spread, speed, type, dmg, offset) {
          var n = isLiteGameRender() ? Math.min(count, 9) : count;
          for (var i = 0; i < n; i++) {
            var t = n <= 1 ? 0 : i / (n - 1) - 0.5;
            spawnBossShot(h.x, h.y, angle + (offset || 0) + t * spread, speed, color, dmg || h.damage, type || 'bolt');
          }
        }
        function radial(count, speed, type, dmg, offset) {
          var n = isLiteGameRender() ? Math.min(count, 14) : count;
          for (var i = 0; i < n; i++) spawnBossShot(h.x, h.y, Math.PI * 2 * i / n + (offset || h.phase), speed + (i % 3) * 5, color, dmg || h.damage, type || (i % 3 === 0 ? 'orb' : 'bolt'));
        }
        if (h.bossType === 'serpent') {
          fan(5, 0.72, 185 + wave * 6, 'bolt');
        } else if (h.bossType === 'prism') {
          radial(10, 135 + wave * 4, 'orb');
          spawnBossShot(h.x, h.y, angle, 0, color, h.damage + 1, 'beam');
        } else if (h.bossType === 'hydra') {
          for (var m = 0; m < 3 + Math.min(3, Math.floor(wave / 4)); m++) spawnHazard(Math.random() < 0.5 ? 'runner' : 'orbit');
          fan(3, 0.68, 165, 'orb');
        } else if (h.bossType === 'phantom') {
          h.dashTime = 0.45; h.dashAngle = angle; fan(7, 1.38, 210, 'bolt');
        } else if (h.bossType === 'mantis') {
          h.dashTime = 0.32; h.dashAngle = angle + (Math.random() < 0.5 ? 0.36 : -0.36); fan(3, 0.24, 245, 'bolt', h.damage + 1, -0.72); fan(3, 0.24, 245, 'bolt', h.damage + 1, 0.72);
        } else if (h.bossType === 'crown') {
          radial(18, 96, 'bolt'); spawnPickup(Math.random() < 0.45 && wave >= 8 ? 'overdrive' : 'charge');
        } else if (h.bossType === 'nebula') {
          if (timeStopTime <= 0) freezeTime = Math.max(0, freezeTime - 0.2);
          addRing(h.x, h.y, color, 22, 0.54, 210, true); radial(12, 118 + wave * 3, 'orb', h.damage, angle + Math.sin(h.phase) * 1.7);
        } else if (h.bossType === 'eclipse') {
          addRing(h.x, h.y, color, 28, 0.42, 230, true); spawnBossShot(h.x, h.y, angle, 0, color, h.damage + 1, 'beam'); spawnBossShot(h.x, h.y, angle + Math.PI, 0, color, h.damage, 'beam'); fan(6, 1.1, 165, 'orb');
        } else if (h.bossType === 'lotus') {
          radial(16, 126 + wave * 3, 'orb', h.damage, h.phase * 0.8); radial(8, 178, 'bolt', h.damage, h.phase * -0.6);
        } else if (h.bossType === 'railgun') {
          fan(3, 0.42, 0, 'beam', h.damage + 2); addDangerZone('lane', h.x, h.y, { angle: angle, width: 24, length: Math.max(gameW, gameH) * 1.5, delay: 0.38, life: 0.95, color: color, damage: h.damage + 1 });
        } else if (h.bossType === 'swarm') {
          for (var sw = 0; sw < (isLiteGameRender() ? 2 : 5); sw++) spawnHazard(Math.random() < 0.65 ? 'runner' : 'seeker'); fan(7, 1.6, 190, 'bolt');
        } else if (h.bossType === 'mirror') {
          h.x = clamp(gameW - h.x + (Math.random() - 0.5) * 70, h.r + 12, gameW - h.r - 12); fan(5, 0.8, 210, 'bolt'); radial(8, 120, 'orb', h.damage, h.phase);
        } else if (h.bossType === 'void') {
          addDangerZone('rift', player.x, player.y, { r: 72, delay: 0.42, life: 2.4, color: color, damage: h.damage, pull: 150 }); fan(9, Math.PI * 1.2, 118, 'orb', h.damage + 1);
        } else if (h.bossType === 'comet') {
          h.dashTime = 0.58; h.dashAngle = angle; addDangerZone('slash', h.x, h.y, { angle: angle, width: 32, length: Math.max(gameW, gameH) * 1.15, delay: 0.32, life: 0.8, color: color, damage: h.damage + 1 }); for (var cm = -2; cm <= 2; cm++) spawnBossShot(h.x - Math.cos(angle) * cm * 18, h.y - Math.sin(angle) * cm * 18, angle + cm * 0.12, 245, color, h.damage, 'bolt');
        } else if (h.bossType === 'clock') {
          dashCooldown = Math.max(dashCooldown, 0.7); radial(12, 150, 'bolt', h.damage, Math.PI / 12); addRing(h.x, h.y, color, 34, 0.42, 190, false);
        } else if (h.bossType === 'phoenix') {
          if (h.hp < h.maxHp * 0.45 && Math.random() < 0.55) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.07); fan(9, 1.75, 220, 'bolt', h.damage + 1);
        } else if (h.bossType === 'cube') {
          for (var cb = 0; cb < 4; cb++) { spawnBossShot(h.x, h.y, cb * Math.PI / 2 + h.phase * 0.08, 0, color, h.damage + 1, 'beam'); addDangerZone('lane', h.x, h.y, { angle: cb * Math.PI / 2 + h.phase * 0.08, width: 18, delay: 0.28, life: 0.7, color: color, damage: h.damage }); } radial(8, 128, 'orb');
        } else if (h.bossType === 'leviathan') {
          for (var lv = 0; lv < 11; lv++) spawnBossShot(h.x, h.y, angle + Math.sin(h.phase + lv * 0.7) * 0.95, 130 + lv * 9, color, h.damage, lv % 2 ? 'bolt' : 'orb');
        } else if (h.bossType === 'siren') {
          pulse = Math.max(0, pulse - 8); radial(14, 116, 'orb', h.damage, h.phase * 0.4); addGameNotice('赛壬干扰 · 脉冲下降', color, 1.2);
        } else if (h.bossType === 'samurai') {
          h.dashTime = 0.36; h.dashAngle = angle; addDangerZone('slash', h.x, h.y, { angle: angle - 0.55, width: 18, length: Math.max(gameW, gameH), delay: 0.18, life: 0.62, color: color, damage: h.damage + 1 }); addDangerZone('slash', h.x, h.y, { angle: angle + 0.55, width: 18, length: Math.max(gameW, gameH), delay: 0.3, life: 0.7, color: color, damage: h.damage + 1 }); fan(2, 0.16, 285, 'bolt', h.damage + 2, -0.28); fan(2, 0.16, 285, 'bolt', h.damage + 2, 0.28);
        } else if (h.bossType === 'satellite') {
          for (var st = 0; st < (isLiteGameRender() ? 2 : 4); st++) spawnHazard('orbit'); radial(12, 132, 'bolt', h.damage, h.phase);
        } else if (h.bossType === 'glitch') {
          h.x = clamp(60 + Math.random() * (gameW - 120), h.r + 12, gameW - h.r - 12); h.y = clamp(60 + Math.random() * (gameH - 120), h.r + 12, gameH - h.r - 12); radial(11, 205, 'bolt', h.damage, Math.random() * Math.PI * 2);
        } else if (h.bossType === 'aurora') {
          for (var ar = 0; ar < 12; ar++) spawnBossShot(h.x, h.y, angle + Math.sin(ar * 0.8 + h.phase) * 1.1, 145 + ar * 3, ar % 2 ? '#57ffda' : '#ff8dff', h.damage, 'orb');
        } else if (h.bossType === 'titan') {
          addDangerZone('quake', h.x, h.y, { r: 150, delay: 0.48, life: 1.15, color: color, damage: h.damage }); radial(10, 175, 'bolt', h.damage + 1);
        } else if (h.bossType === 'thorn') {
          radial(20, 185, 'bolt', h.damage, h.phase * 0.5); if (Math.random() < 0.45) spawnHazard('brute');
        } else if (h.bossType === 'monolith') {
          spawnBossShot(h.x, h.y, 0, 0, color, h.damage + 1, 'beam'); spawnBossShot(h.x, h.y, Math.PI / 2, 0, color, h.damage + 1, 'beam'); addDangerZone('lane', h.x, h.y, { angle: 0, width: 22, delay: 0.42, life: 0.9, color: color, damage: h.damage + 1 }); addDangerZone('lane', h.x, h.y, { angle: Math.PI / 2, width: 22, delay: 0.42, life: 0.9, color: color, damage: h.damage + 1 }); fan(5, 0.55, 150, 'orb');
        } else if (h.bossType === 'dragon') {
          fan(11, 1.9, 215, 'bolt', h.damage + 1); fan(5, 0.65, 165, 'orb', h.damage, Math.sin(h.phase) * 0.4);
        } else {
          addRing(h.x, h.y, color, 28, 0.48, 190, true); radial(14, 125 + wave * 4, 'bolt');
        }
        var bossHpRatio = clamp(h.hp / Math.max(1, h.maxHp), 0, 1);
        var rageScale = bossHpRatio <= 0.30 ? 0.70 : bossHpRatio <= 0.60 ? 0.84 : 1;
        h.skillTimer = h.skillGap * rageScale * (0.84 + Math.random() * 0.28);
      }

      function updateBossMotion(h, dt, targetAngle) {
        h.phase += dt;
        h.skillTimer -= dt;
        h.hit = Math.max(0, h.hit - dt);
        if (h.dashTime > 0) {
          h.dashTime -= dt;
          h.x += Math.cos(h.dashAngle || targetAngle) * (h.speed * 3.2) * dt;
          h.y += Math.sin(h.dashAngle || targetAngle) * (h.speed * 3.2) * dt;
        } else {
          var homeX = gameW * 0.5 + Math.cos(h.phase * 0.75) * gameW * 0.22;
          var homeY = gameH * 0.32 + Math.sin(h.phase * 0.9) * gameH * 0.16;
          h.vx += (homeX - h.x) * 0.85 * dt + Math.cos(targetAngle) * h.speed * 0.018;
          h.vy += (homeY - h.y) * 0.85 * dt + Math.sin(targetAngle) * h.speed * 0.018;
          h.vx *= 0.94;
          h.vy *= 0.94;
          h.x += h.vx * dt;
          h.y += h.vy * dt;
        }
        h.x = clamp(h.x, h.r + 12, gameW - h.r - 12);
        h.y = clamp(h.y, h.r + 12, gameH - h.r - 12);
        h.rot += dt * (h.bossType === 'phantom' ? 3.2 : 1.6);
        if (h.skillTimer <= 0) bossUseSkill(h);
      }

      var freezeRank = Math.max(1, itemRank('freeze'));
      var freezeHazardScale = freezeRank >= 3 ? 0.31 : freezeRank === 2 ? 0.39 : 0.48;
      var hazardSlow = timeStopTime > 0 ? 0 : (freezeTime > 0 ? freezeHazardScale : 1);
      hazards.forEach(function (h, idx) {
        if (!h || h.defeated) return;
        h.bladeTick = Math.max(0, (h.bladeTick || 0) - dt);
        var tx = player.x - h.x;
        var ty = player.y - h.y;
        var targetAngle = Math.atan2(ty, tx);
        h.touchTick = Math.max(0, (h.touchTick || 0) - dt);
        if (h.boss) {
          h.spawnGuard = Math.max(0, (h.spawnGuard || 0) - dt);
          updateBossMotion(h, dt * hazardSlow, targetAngle);
          return;
        }
        h.hit = Math.max(0, (h.hit || 0) - dt);
        if (h.kind === 'seeker' || h.kind === 'brute' || h.kind === 'sniper') {
          var steer = h.kind === 'brute' ? 0.018 : 0.03;
          h.vx += Math.cos(targetAngle) * h.speed * steer;
          h.vy += Math.sin(targetAngle) * h.speed * steer;
        } else if (h.kind === 'orbit') {
          h.vx += Math.cos(targetAngle + Math.sin((last + idx * 30) * 0.003) * 0.8) * h.speed * 0.024;
          h.vy += Math.sin(targetAngle + Math.sin((last + idx * 30) * 0.003) * 0.8) * h.speed * 0.024;
        }
        var vlen = Math.hypot(h.vx, h.vy) || 1;
        var maxSpeed = h.speed * (h.kind === 'runner' ? 1.05 : 1);
        h.vx = h.vx / vlen * maxSpeed;
        h.vy = h.vy / vlen * maxSpeed;
        h.x += h.vx * dt * hazardSlow;
        h.y += h.vy * dt * hazardSlow;
        h.rot += dt * (h.kind === 'runner' ? 7.5 : h.kind === 'brute' ? 1.6 : h.kind === 'sniper' ? 2.2 : 4.2) * hazardSlow;
        if (h.kind === 'sniper') {
          h.shotTimer = (h.shotTimer || 1.4) - dt * hazardSlow;
          if (h.shotTimer <= 0) {
            spawnBossShot(h.x, h.y, targetAngle, 220 + wave * 5, '#7ec8ff', h.damage, 'bolt');
            h.shotTimer = 1.65 + Math.random() * 0.55;
          }
        }
      });
      hazards = hazards.filter(function (h) { return h && !h.defeated && (h.boss || (h.x > -120 && h.x < gameW + 120 && h.y > -120 && h.y < gameH + 120)); });
      var maxHazards = maxHazardCount();
      if (hazards.length > maxHazards) {
        var removeNeed = hazards.length - maxHazards;
        for (var rm = 0; rm < hazards.length && removeNeed > 0; rm++) {
          if (!hazards[rm].boss) { hazards.splice(rm, 1); rm -= 1; removeNeed -= 1; }
        }
      }

      pickups.forEach(function (p, idx) {
        p.rot += dt * (p.type === 'blade' || p.type === 'bullet' ? 3.2 : 2.2);
        p.ttl -= dt;
        p.y += Math.sin((last + idx * 90) * 0.0024) * 0.15;
        if (magnetTime > 0) {
          var mxp = player.x - p.x;
          var myp = player.y - p.y;
          var md = Math.hypot(mxp, myp) || 1;
          var magnetRadius = 260 + itemRank('magnet') * 35;
          if (md < magnetRadius) {
            var pull = (1 - md / magnetRadius) * 520;
            p.x += mxp / md * pull * dt;
            p.y += myp / md * pull * dt;
          }
        }
      });
      pickups = pickups.filter(function (p) { return p.ttl > 0; });
      if (magnetTime > 0 && itemRank('magnet') >= 3) {
        hazards.forEach(function (h) {
          if (!h || h.boss || h.defeated) return;
          var pullX = player.x - h.x;
          var pullY = player.y - h.y;
          var pullDistance = Math.hypot(pullX, pullY) || 1;
          if (pullDistance > 150 && pullDistance < 330) {
            var softPull = (1 - pullDistance / 330) * 22;
            h.x += pullX / pullDistance * softPull * dt;
            h.y += pullY / pullDistance * softPull * dt;
          }
        });
      }

      bullets.forEach(function (b) {
        b.life -= dt;
        if (b.curve) {
          var turn = b.curve * dt;
          var c = Math.cos(turn);
          var si = Math.sin(turn);
          var oldVx = b.vx;
          b.vx = oldVx * c - b.vy * si;
          b.vy = oldVx * si + b.vy * c;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      });
      for (var bi = bullets.length - 1; bi >= 0; bi--) {
        var b = bullets[bi];
        var removedBullet = false;
        for (var hi = hazards.length - 1; hi >= 0; hi--) {
          var hh = hazards[hi];
          if (!hh || hh.defeated) continue;
          if (Math.hypot(hh.x - b.x, hh.y - b.y) < hh.r + b.r + 3) {
            if (splitterTime > 0 && !b.split) {
              spawnSplitBullets(b);
              b.split = true;
            }
            damageHazardByIndex(hi, b.damage || 24, b.color, hh.boss ? '-' + (b.damage || 24) : null);
            combo += 1;
            comboTimer = Math.max(comboTimer, 2.4);
            pulse = clamp(pulse + (hh.boss ? 1.3 : 3), 0, 100);
            b.pierce -= 1;
            if (b.pierce < 0) { bullets.splice(bi, 1); removedBullet = true; }
            break;
          }
        }
        if (!removedBullet && (b.life <= 0 || b.x < -40 || b.x > gameW + 40 || b.y < -40 || b.y > gameH + 40)) bullets.splice(bi, 1);
      }
      resolvePendingBossDefeat();

      if (bladeTime > 0) {
        var bladeRank = Math.max(1, itemRank('blade'));
        var bladeRadius = player.r + 43 + bladeRank * 5;
        var bladeDamage = 23 + bladeRank * 7;
        if (overdriveTime > 0) bladeDamage = Math.round(bladeDamage * 1.25);
        for (var bh = hazards.length - 1; bh >= 0; bh--) {
          var bladeTarget = hazards[bh];
          if (!bladeTarget || bladeTarget.defeated) continue;
          if (Math.hypot(bladeTarget.x - player.x, bladeTarget.y - player.y) < bladeRadius + bladeTarget.r && (bladeTarget.bladeTick || 0) <= 0) {
            damageHazardByIndex(bh, bladeDamage, '#ff3df2', bladeTarget.boss && !isLiteGameRender() ? '-刃' + bladeDamage : null);
            bladeTarget.bladeTick = bladeTarget.boss ? 0.12 : 0.08;
            combo += 1;
            comboTimer = Math.max(comboTimer, 2.8);
            pulse = clamp(pulse + (bladeTarget.boss ? 1 : 3.6), 0, 100);
          }
        }
      }
      resolvePendingBossDefeat();

      var freezeShotScale = freezeRank >= 3 ? 0.46 : freezeRank === 2 ? 0.54 : 0.62;
      var shotSlow = timeStopTime > 0 ? 0 : (freezeTime > 0 ? freezeShotScale : 1);
      bossShots.forEach(function (shot) {
        shot.life -= dt * (timeStopTime > 0 ? 0 : 1);
        if (shot.type !== 'beam') {
          shot.x += shot.vx * dt * shotSlow;
          shot.y += shot.vy * dt * shotSlow;
          if (timeStopTime <= 0 && Math.hypot(shot.x - player.x, shot.y - player.y) < shot.r + player.r) {
            takePlayerDamage(shot.damage, shot.color);
            shot.life = 0;
          }
        } else if (timeStopTime <= 0 && shot.life < shot.maxLife - shot.charge) {
          var px = player.x - shot.x;
          var py = player.y - shot.y;
          var along = px * Math.cos(shot.angle) + py * Math.sin(shot.angle);
          var side = Math.abs(px * Math.sin(shot.angle) - py * Math.cos(shot.angle));
          if (along > 0 && along < gameW * 1.4 && side < shot.width + player.r) {
            takePlayerDamage(shot.damage, shot.color);
            shot.life = 0;
          }
        }
      });
      bossShots = bossShots.filter(function (shot) { return shot.life > 0 && shot.x > -90 && shot.x < gameW + 90 && shot.y > -90 && shot.y < gameH + 90; });
      if (!running) return;
      updateDangerZones(dt);
      if (!running) return;
      updatePlayerTechs(dt);

      particles.forEach(function (p) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
      });
      particles = particles.filter(function (p) { return p.life > 0; });

      floatTexts.forEach(function (t) {
        t.life -= dt;
        t.y += t.vy * dt;
        t.vy *= 0.98;
      });
      floatTexts = floatTexts.filter(function (t) { return t.life > 0; });

      rings.forEach(function (r) {
        r.life -= dt;
        r.radius += (r.max - r.radius) * 0.16;
      });
      rings = rings.filter(function (r) { return r.life > 0; });

      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        if (!h || h.defeated) continue;
        var dist = Math.hypot(h.x - player.x, h.y - player.y);
        if (!h.near && dist < h.r + player.r + 24 && dist > h.r + player.r + 6) {
          h.near = true;
          pulse = clamp(pulse + 2.4, 0, 100);
          comboTimer = Math.max(comboTimer, 1.2);
          gainScore(2);
        }
        if (dist < h.r + player.r) {
          if (invincible > 0 || grace > 0) {
            if (invincible > 0) {
              if (!h.boss || (h.touchTick || 0) <= 0) {
                var invRank = Math.max(1, itemRank('invincible'));
                var touchDamage = h.boss ? 28 + invRank * 10 : 999;
                damageHazardByIndex(i, touchDamage, '#ffe178', h.boss ? '-' + touchDamage : null);
                h.touchTick = h.boss ? 0.18 : 0;
              }
            } else if (!h.boss) {
              damageHazardByIndex(i, 999, '#ffffff', null);
            }
            comboTimer = Math.max(comboTimer, 2.2);
            pulse = clamp(pulse + (h.boss ? 1.5 : 4), 0, 100);
          } else if (h.boss) {
            if ((h.touchTick || 0) <= 0) {
              takePlayerDamage(h.damage, h.color);
              h.touchTick = 0.28;
            }
            h.vx -= (player.x - h.x) * 0.7;
            h.vy -= (player.y - h.y) * 0.7;
          } else {
            takePlayerDamage(h.damage, h.color);
            hazards.splice(i, 1);
          }
          updateHud();
          if (!running) break;
        }
      }
      if (!running) return;

      resolveThornRetaliation();

      for (var j = pickups.length - 1; j >= 0; j--) {
        var p = pickups[j];
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.r + player.r + 3) {
          var meta = pickupMeta(p.type);
          boostFlash = 0.28;
          powerFlash = 0.42;
          lastPowerName = meta.label;
          addRing(p.x, p.y, meta.color, 12, 0.34, 64, true);
          applyPickupEffect(p, meta);
          pickups.splice(j, 1);
          updateHud();
        }
      }

      resolvePendingBossDefeat();

      scoreFloat += dt * cfg.scoreRate * multiplier();
      score = Math.floor(scoreFloat);
      if (score > best) best = score;
      updateHud();
    }

    function drawDangerZone(z) {
      var armed = z.delay <= 0;
      var alpha = armed ? Math.max(0.16, z.life / z.maxLife * 0.62) : 0.24 + Math.sin(performance.now() * 0.018) * 0.08;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = z.color;
      ctx.fillStyle = colorAlpha(z.color, armed ? 0.18 : 0.08);
      ctx.shadowColor = z.color;
      ctx.shadowBlur = isLiteGameRender() ? 4 : 20;
      ctx.lineWidth = armed ? 4 : 2;
      ctx.setLineDash(armed ? [] : [8, 9]);
      if (z.kind === 'rift') {
        ctx.translate(z.x, z.y);
        ctx.rotate((z.phase || 0) + z.life * 2.2);
        for (var i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, z.r * (0.7 + i * 0.26), z.r * (0.32 + i * 0.14), i * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (z.kind === 'quake') {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.globalAlpha *= 0.45;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r * 0.58, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.translate(z.x, z.y);
        ctx.rotate(z.angle);
        ctx.beginPath();
        ctx.rect(0, -z.width, z.length, z.width * 2);
        ctx.fill(); ctx.stroke();
        if (z.kind === 'slash') {
          ctx.globalAlpha *= 0.7;
          ctx.beginPath();
          ctx.moveTo(0, -z.width * 1.45);
          ctx.lineTo(z.length, 0);
          ctx.lineTo(0, z.width * 1.45);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawPlayerTech(t) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t.life / t.maxLife));
      ctx.strokeStyle = t.color;
      ctx.fillStyle = colorAlpha(t.color, 0.16);
      ctx.shadowColor = t.color;
      ctx.shadowBlur = isLiteGameRender() ? 5 : 22;
      if (t.kind === 'drone') {
        var count = isLiteGameRender() ? 2 : 3;
        for (var d = 0; d < count; d++) {
          var a = t.phase * 3 + Math.PI * 2 * d / count;
          var x = player.x + Math.cos(a) * 46;
          var y = player.y + Math.sin(a) * 32;
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      } else if (t.kind === 'blackhole') {
        ctx.translate(t.x, t.y);
        ctx.rotate(t.phase * 1.8);
        for (var i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, t.r * (0.25 + i * 0.18), t.r * (0.12 + i * 0.07), i * 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (t.kind === 'laser') {
        ctx.translate(t.x, t.y); ctx.rotate(t.angle);
        ctx.lineWidth = isLiteGameRender() ? 5 : 8;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.max(gameW, gameH) * 1.35, 0); ctx.stroke();
      } else if (t.kind === 'mine') {
        ctx.translate(t.x, t.y);
        ctx.lineWidth = 2;
        ctx.setLineDash(t.delay > 0 ? [5, 7] : []);
        ctx.beginPath(); ctx.arc(0, 0, t.delay > 0 ? 18 : t.r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
      } else if (t.kind === 'chain') {
        ctx.globalAlpha *= 0.45;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 70 + Math.sin(t.phase * 9) * 6, 0, Math.PI * 2);
        ctx.stroke();
      } else if (t.kind === 'trail') {
        ctx.translate(t.x, t.y); ctx.rotate(t.angle || 0);
        ctx.globalCompositeOperation = 'lighter';
        var trailLite = isLiteGameRender();
        var trailLength = t.r * (trailLite ? 1.28 : 1.62);
        var trailWave = Math.sin(t.phase * 11) * t.r * 0.08;
        var trailGradient = ctx.createLinearGradient(-t.r * 0.22, 0, trailLength, 0);
        trailGradient.addColorStop(0, colorAlpha(t.color, 0.92));
        trailGradient.addColorStop(0.34, colorAlpha(t.color, 0.62));
        trailGradient.addColorStop(1, colorAlpha(t.color, 0));
        ctx.strokeStyle = trailGradient;
        ctx.lineCap = 'round';
        ctx.lineWidth = trailLite ? 3.4 : 5.5;
        ctx.beginPath();
        ctx.moveTo(-t.r * 0.18, 0);
        ctx.bezierCurveTo(t.r * 0.28, trailWave, trailLength * 0.64, -trailWave * 1.3, trailLength, 0);
        ctx.stroke();
        ctx.globalAlpha *= 0.68;
        ctx.lineWidth = trailLite ? 1.1 : 1.8;
        var filamentCount = trailLite ? 1 : 2;
        for (var filament = 0; filament < filamentCount; filament++) {
          var side = filament === 0 ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(-t.r * 0.08, side * t.r * 0.14);
          ctx.bezierCurveTo(t.r * 0.34, side * t.r * 0.48 + trailWave, trailLength * 0.72, side * t.r * 0.24 - trailWave, trailLength * 0.94, side * t.r * 0.06);
          ctx.stroke();
        }
        ctx.fillStyle = colorAlpha('#ffffff', trailLite ? 0.58 : 0.78);
        var nodeCount = trailLite ? 2 : 4;
        for (var trailNode = 0; trailNode < nodeCount; trailNode++) {
          var nodePhase = (trailNode + 1) / (nodeCount + 1);
          var nodeX = trailLength * nodePhase;
          var nodeY = Math.sin(t.phase * 8 + trailNode * 1.9) * t.r * (0.08 + nodePhase * 0.12);
          var nodeSize = (trailLite ? 1.4 : 2.1) * (1 - nodePhase * 0.38);
          ctx.save();
          ctx.translate(nodeX, nodeY);
          ctx.rotate(Math.PI * 0.25 + t.phase * 0.7);
          ctx.fillRect(-nodeSize, -nodeSize, nodeSize * 2, nodeSize * 2);
          ctx.restore();
        }
      } else if (t.kind === 'storm') {
        ctx.translate(player.x, player.y); ctx.rotate(t.phase * 1.8);
        var stormArms = isLiteGameRender() ? 3 : 5;
        ctx.lineWidth = 2;
        for (var stormArm = 0; stormArm < stormArms; stormArm++) {
          ctx.rotate(Math.PI * 2 / stormArms);
          ctx.beginPath(); ctx.arc(0, 0, 28 + stormArm * 5, 0.15, 1.15); ctx.stroke();
        }
      } else if (t.kind === 'repair') {
        ctx.translate(player.x, player.y); ctx.rotate(t.phase * 2.4);
        var repairNodes = isLiteGameRender() ? 3 : 6;
        for (var repairNode = 0; repairNode < repairNodes; repairNode++) {
          var repairAngle = Math.PI * 2 * repairNode / repairNodes;
          var repairX = Math.cos(repairAngle) * 34;
          var repairY = Math.sin(repairAngle) * 34;
          ctx.strokeRect(repairX - 4, repairY - 4, 8, 8);
        }
      } else if (t.kind === 'sanctuary') {
        ctx.translate(player.x, player.y);
        ctx.globalAlpha *= 0.38;
        ctx.lineWidth = isLiteGameRender() ? 2 : 3;
        ctx.setLineDash([8, 10]);
        ctx.beginPath(); ctx.arc(0, 0, t.r + Math.sin(t.phase * 5) * 4, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(0, 0, t.r * 0.62, 0, Math.PI * 2); ctx.stroke();
      } else if (t.kind === 'dashslash') {
        ctx.translate(t.x, t.y); ctx.rotate(t.angle || 0);
        ctx.globalAlpha *= 0.86;
        ctx.lineWidth = isLiteGameRender() ? 7 : 11;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(t.r, 0); ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(t.r * 0.78, 12); ctx.stroke();
      }
      ctx.restore();
    }

    function drawPickup(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      var meta = pickupMeta(p.type);
      var color = meta.color;
      var tier = p.tier || 1;
      if (tier >= 2) {
        ctx.save();
        ctx.rotate(-p.rot * 0.65);
        ctx.strokeStyle = tier >= 3 ? '#ffe178' : 'rgba(255,255,255,.92)';
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = isLiteGameRender() ? 3 : tier >= 3 ? 18 : 10;
        ctx.lineWidth = tier >= 3 ? 2.2 : 1.4;
        ctx.setLineDash(tier >= 3 ? [4, 5] : [3, 7]);
        ctx.beginPath(); ctx.arc(0, 0, p.r + 7, 0, Math.PI * 2); ctx.stroke();
        if (tier >= 3 && !isLiteGameRender()) {
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(0, 0, p.r + 12, 0.2, 2.35); ctx.arc(0, 0, p.r + 12, 3.34, 5.52); ctx.stroke();
          for (var star = 0; star < 3; star++) {
            var starAngle = p.rot * 1.8 + Math.PI * 2 * star / 3;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(Math.cos(starAngle) * (p.r + 12), Math.sin(starAngle) * (p.r + 12), 1.8, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.restore();
      }
      ctx.rotate(p.rot);
      ctx.shadowColor = color;
      ctx.shadowBlur = isLiteGameRender() ? 4 : 18;
      ctx.strokeStyle = 'rgba(255,255,255,.82)';
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;
      if (p.type === 'good') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shield') {
        ctx.beginPath();
        for (var i = 0; i < 6; i++) {
          var a = Math.PI / 3 * i;
          var px = Math.cos(a) * p.r;
          var py = Math.sin(a) * p.r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'charge') {
        ctx.beginPath();
        for (var j = 0; j < 8; j++) {
          var angle = Math.PI / 4 * j;
          var rr = j % 2 === 0 ? p.r : p.r * 0.42;
          var sx = Math.cos(angle) * rr;
          var sy = Math.sin(angle) * rr;
          if (j === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'blade') {
        ctx.beginPath();
        ctx.moveTo(-p.r * 1.1, p.r * 0.2);
        ctx.quadraticCurveTo(0, -p.r * 1.55, p.r * 1.15, -p.r * 0.1);
        ctx.quadraticCurveTo(0, -p.r * 0.25, -p.r * 1.1, p.r * 0.2);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'bullet') {
        ctx.beginPath();
        ctx.moveTo(p.r * 1.25, 0);
        ctx.lineTo(-p.r * 0.72, -p.r * 0.72);
        ctx.lineTo(-p.r * 0.35, 0);
        ctx.lineTo(-p.r * 0.72, p.r * 0.72);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'invincible') {
        ctx.beginPath();
        ctx.arc(-p.r * 0.42, 0, p.r * 0.55, 0, Math.PI * 2);
        ctx.arc(p.r * 0.42, 0, p.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'magnet') {
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 0.9, Math.PI * 0.18, Math.PI * 1.82);
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (p.type === 'freeze') {
        ctx.beginPath();
        for (var fi = 0; fi < 6; fi++) {
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(fi * Math.PI / 3) * p.r, Math.sin(fi * Math.PI / 3) * p.r);
        }
        ctx.stroke();
      } else if (p.type === 'speed') {
        ctx.beginPath();
        ctx.moveTo(-p.r * 0.9, -p.r * 0.72);
        ctx.lineTo(p.r * 0.75, 0);
        ctx.lineTo(-p.r * 0.9, p.r * 0.72);
        ctx.lineTo(-p.r * 0.32, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'nova' || p.type === 'overdrive' || p.type === 'guardian' || p.type === 'timewarp') {
        ctx.beginPath();
        for (var gi = 0; gi < 10; gi++) {
          var ga = Math.PI * 2 * gi / 10;
          var gr = gi % 2 ? p.r * 0.46 : p.r * 1.25;
          var gx = Math.cos(ga) * gr;
          var gy = Math.sin(ga) * gr;
          if (gi === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -p.r);
        ctx.lineTo(p.r * 0.9, 0);
        ctx.lineTo(0, p.r);
        ctx.lineTo(-p.r * 0.9, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();
      ctx.rotate(-p.rot);
      ctx.fillStyle = 'rgba(3,8,20,.86)';
      ctx.font = '900 ' + Math.max(9, p.r * 0.88) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!isLiteGameRender() || p.r >= 12 || p.type === 'blade' || p.type === 'bullet' || p.type === 'invincible') ctx.fillText(meta.mark, 0, 0.5);
      ctx.restore();
    }

    function drawHazard(h) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      var color = freezeTime > 0 ? '#7ec8ff' : h.color || (h.elite ? '#ffb14a' : h.kind === 'runner' ? '#ff7c4d' : '#ff3f68');
      ctx.shadowColor = h.hit > 0 ? '#ffffff' : color;
      ctx.shadowBlur = isLiteGameRender() ? (h.elite ? 8 : 4) : (h.boss ? 42 : h.elite ? 28 : 18);
      ctx.fillStyle = h.hit > 0 ? '#ffffff' : color;
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = h.boss ? 2 : 1.1;
      if (h.champion) {
        ctx.save();
        ctx.rotate(-(h.rot || 0) + (h.phase || 0) * 0.8);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = isLiteGameRender() ? 0.42 : 0.68;
        ctx.strokeStyle = colorAlpha(color, 0.92);
        ctx.lineWidth = isLiteGameRender() ? 1.4 : 2.2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, h.r * 1.42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      if (h.boss) {
        var bossPulse = 1 + Math.sin((h.phase || 0) * 4) * 0.04;
        var haloCount = isLiteGameRender() ? 2 : 4;
        ctx.save();
        ctx.rotate(-(h.rot || 0));
        ctx.globalAlpha = 0.42;
        ctx.strokeStyle = colorAlpha(color, 0.72);
        ctx.lineWidth = 1.3;
        ctx.setLineDash([3, 8]);
        for (var halo = 0; halo < haloCount; halo++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, h.r * (1.28 + halo * 0.18) * bossPulse, h.r * (0.92 + halo * 0.13), (h.phase || 0) * 0.35 + halo * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        for (var node = 0; node < haloCount + 1; node++) {
          var na2 = (h.phase || 0) * (0.9 + node * 0.12) + node * Math.PI * 2 / (haloCount + 1);
          ctx.fillStyle = node % 2 ? '#ffffff' : color;
          ctx.beginPath();
          ctx.arc(Math.cos(na2) * h.r * 1.45, Math.sin(na2) * h.r * 1.05, Math.max(2.4, h.r * 0.075), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        if ((h.spawnGuard || 0) > 0) {
          var guardRatio = clamp(h.spawnGuard / Math.max(0.01, h.spawnGuardMax || 2.15), 0, 1);
          var guardSides = isLiteGameRender() ? 6 : 8;
          ctx.save();
          ctx.rotate(-(h.rot || 0) + (h.phase || 0) * 0.62);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.24 + guardRatio * 0.58;
          ctx.strokeStyle = colorAlpha(color, 0.92);
          ctx.fillStyle = colorAlpha(color, 0.055 + guardRatio * 0.09);
          ctx.lineWidth = isLiteGameRender() ? 1.8 : 2.6;
          ctx.beginPath();
          for (var guardSide = 0; guardSide < guardSides; guardSide++) {
            var guardAngle = Math.PI * 2 * guardSide / guardSides;
            var guardRadius = h.r * (1.36 + Math.sin((h.phase || 0) * 5 + guardSide) * 0.035);
            var guardX = Math.cos(guardAngle) * guardRadius;
            var guardY = Math.sin(guardAngle) * guardRadius;
            if (guardSide === 0) ctx.moveTo(guardX, guardY); else ctx.lineTo(guardX, guardY);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (!isLiteGameRender()) {
            ctx.globalAlpha *= 0.72;
            ctx.setLineDash([8, 10]);
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, h.r * 1.56, -(Math.PI * 0.5), Math.PI * (1.5 - guardRatio * 0.35));
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();
        }
        if (h.bossType === 'serpent') {
          ctx.beginPath();
          for (var seg = 0; seg < 5; seg++) ctx.ellipse(-h.r * 0.72 + seg * h.r * 0.36, Math.sin(h.phase * 5 + seg) * h.r * 0.16, h.r * 0.34, h.r * 0.55, seg * 0.32, 0, Math.PI * 2);
        } else if (h.bossType === 'prism') {
          ctx.beginPath();
          for (var pr = 0; pr < 6; pr++) {
            var pa = Math.PI * 2 * pr / 6;
            var px = Math.cos(pa) * h.r;
            var py = Math.sin(pa) * h.r;
            if (pr === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
        } else if (h.bossType === 'hydra') {
          ctx.beginPath();
          ctx.arc(0, 0, h.r * 0.82, 0, Math.PI * 2);
          for (var hd = 0; hd < 5; hd++) {
            ctx.moveTo(Math.cos(hd * 1.26) * h.r * 0.78 + h.r * 0.24, Math.sin(hd * 1.26) * h.r * 0.78);
            ctx.arc(Math.cos(hd * 1.26) * h.r * 0.78, Math.sin(hd * 1.26) * h.r * 0.78, h.r * 0.24, 0, Math.PI * 2);
          }
        } else if (h.bossType === 'phantom') {
          ctx.beginPath();
          ctx.arc(0, 0, h.r, 0, Math.PI * 2);
          ctx.moveTo(-h.r, 0);
          ctx.bezierCurveTo(-h.r * 0.4, -h.r * 1.2, h.r * 0.5, h.r * 1.2, h.r, 0);
        } else if (h.bossType === 'mantis') {
          ctx.beginPath();
          ctx.ellipse(0, 0, h.r * 0.62, h.r * 1.02, 0, 0, Math.PI * 2);
          ctx.moveTo(-h.r * 0.25, -h.r * 0.2);
          ctx.quadraticCurveTo(-h.r * 1.75, -h.r * 0.85, -h.r * 1.22, h.r * 0.52);
          ctx.moveTo(h.r * 0.25, -h.r * 0.2);
          ctx.quadraticCurveTo(h.r * 1.75, -h.r * 0.85, h.r * 1.22, h.r * 0.52);
        } else if (h.bossType === 'crown') {
          ctx.beginPath();
          for (var cr = 0; cr < 12; cr++) {
            var ca = Math.PI * 2 * cr / 12;
            var rr = cr % 2 ? h.r * 0.58 : h.r * 1.16;
            var cx = Math.cos(ca) * rr;
            var cy = Math.sin(ca) * rr;
            if (cr === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
          }
          ctx.closePath();
        } else if (h.bossType === 'nebula') {
          ctx.beginPath();
          for (var nb = 0; nb < 9; nb++) {
            var na = Math.PI * 2 * nb / 9 + Math.sin(h.phase + nb) * 0.2;
            var nr = h.r * (0.78 + (nb % 3) * 0.15);
            var nx = Math.cos(na) * nr;
            var ny = Math.sin(na) * nr;
            if (nb === 0) ctx.moveTo(nx, ny); else ctx.quadraticCurveTo(Math.cos(na - 0.18) * h.r * 1.2, Math.sin(na - 0.18) * h.r * 1.2, nx, ny);
          }
          ctx.closePath();
        } else {
          ctx.beginPath();
          var points = 8 + ((h.motif || 0) % 5) * 2;
          for (var bp = 0; bp < points; bp++) {
            var ba = Math.PI * 2 * bp / points;
            var br = h.r * (bp % 2 ? 0.58 + ((h.motif || 0) % 3) * 0.08 : 1.08 + Math.sin((h.phase || 0) * 2 + bp) * 0.08);
            var bx2 = Math.cos(ba) * br;
            var by2 = Math.sin(ba) * br;
            if (bp === 0) ctx.moveTo(bx2, by2); else ctx.lineTo(bx2, by2);
          }
          ctx.closePath();
        }
      } else if (h.kind === 'runner') {
        ctx.beginPath();
        ctx.moveTo(0, -h.r * 1.2);
        ctx.lineTo(h.r, h.r);
        ctx.lineTo(-h.r, h.r);
        ctx.closePath();
      } else if (h.kind === 'brute') {
        ctx.beginPath();
        ctx.rect(-h.r, -h.r, h.r * 2, h.r * 2);
      } else if (h.kind === 'orbit') {
        ctx.beginPath();
        ctx.ellipse(0, 0, h.r * 1.18, h.r * 0.8, Math.PI / 4, 0, Math.PI * 2);
      } else if (h.kind === 'sniper') {
        ctx.beginPath();
        ctx.moveTo(h.r * 1.22, 0);
        ctx.lineTo(-h.r * 0.75, -h.r * 0.82);
        ctx.lineTo(-h.r * 0.35, 0);
        ctx.lineTo(-h.r * 0.75, h.r * 0.82);
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -h.r);
        ctx.lineTo(h.r, 0);
        ctx.lineTo(0, h.r);
        ctx.lineTo(-h.r, 0);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      if (h.boss) {
        ctx.save();
        ctx.rotate(-(h.rot || 0));
        ctx.globalAlpha = h.hit > 0 ? 0.95 : 0.78;
        ctx.fillStyle = 'rgba(3,8,20,.72)';
        ctx.strokeStyle = colorAlpha(color, 0.86);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, h.r * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        if (h.glyph && !isLiteGameRender()) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 ' + Math.max(13, h.r * 0.38) + 'px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(h.glyph, 0, 1);
        }
        ctx.restore();
      }
      ctx.restore();
      if (h.maxHp && (h.boss || h.hp < h.maxHp)) {
        ctx.save();
        var w = h.boss ? Math.min(180, gameW * 0.34) : h.r * 2.4;
        var barH = h.boss ? 7 : 3;
        var bx = h.x - w / 2;
        var by = h.y - h.r - (h.boss ? 24 : 10);
        ctx.fillStyle = 'rgba(2,6,18,.72)';
        ctx.fillRect(bx, by, w, barH);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = h.boss && !isLiteGameRender() ? 14 : 0;
        ctx.fillRect(bx, by, w * clamp(h.hp / h.maxHp, 0, 1), barH);
        if (h.boss && !isLiteGameRender()) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '800 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(h.name || 'BOSS', h.x, by - 5);
        }
        ctx.restore();
      }
    }

    function drawGameNotices() {
      if (!gameNotices.length) return;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 ' + (isMobileGameInput() ? 13 : 15) + 'px system-ui, sans-serif';
      var baseY = isMobileFullscreen() ? 36 : 54;
      gameNotices.forEach(function (n, i) {
        var alpha = clamp(n.life / n.max, 0, 1);
        var y = baseY + i * (isMobileGameInput() ? 23 : 26);
        var padX = isMobileGameInput() ? 18 : 22;
        var w = Math.min(gameW - 28, Math.max(138, ctx.measureText(n.text).width + padX * 2));
        var h = isMobileGameInput() ? 22 : 25;
        ctx.globalAlpha = alpha * 0.94;
        ctx.fillStyle = 'rgba(4,8,20,.58)';
        ctx.strokeStyle = colorAlpha(n.color, 0.38);
        ctx.shadowColor = n.color;
        ctx.shadowBlur = isLiteGameRender() ? 0 : 16;
        var x = gameW / 2 - w / 2;
        var r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y - h / 2);
        ctx.lineTo(x + w - r, y - h / 2);
        ctx.quadraticCurveTo(x + w, y - h / 2, x + w, y);
        ctx.lineTo(x + w, y + h / 2 - r);
        ctx.quadraticCurveTo(x + w, y + h / 2, x + w - r, y + h / 2);
        ctx.lineTo(x + r, y + h / 2);
        ctx.quadraticCurveTo(x, y + h / 2, x, y);
        ctx.lineTo(x, y - h / 2 + r);
        ctx.quadraticCurveTo(x, y - h / 2, x + r, y - h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = n.color;
        ctx.fillText(n.text, gameW / 2, y + 0.5);
      });
      ctx.restore();
    }

    function drawGameHud(now) {
      var mobile = isMobileGameInput();
      var top = isMobileFullscreen() ? 3 : 12;
      var gap = mobile ? 6 : 8;
      var chipH = mobile ? 25 : 28;
      var hudRightLimit = isMobileFullscreen() ? Math.max(210, gameW - 88) : gameW;
      var items = [
        ['◆', String(score), '#00eaff'],
        ['×', multiplier().toFixed(1), '#8a5cff'],
        ['≋', String(wave), '#ffb14a'],
        ['♥', lives + '/' + maxLives(), lives <= 1 ? '#ff3f68' : '#ffffff'],
        ['⬡', String(Math.ceil(shield)), shield > 0 ? '#8a5cff' : '#59627d'],
        ['◎', Math.floor(clamp(pulse, 0, 100)) + '%', pulse >= 100 ? '#00ffbf' : '#00eaff'],
        ['↯', dashCooldown <= 0 ? 'OK' : dashCooldown.toFixed(1), dashCooldown <= 0 ? '#8a5cff' : '#b8c5df'],
        ['⚔', activePowerText(), overdriveTime > 0 ? '#ffe178' : speedBoostTime > 0 ? '#27ff7a' : bladeTime > 0 ? '#ff3df2' : gunTime > 0 ? '#00eaff' : timeStopTime > 0 ? '#ffffff' : invincible > 0 ? '#ffe178' : freezeTime > 0 ? '#7ec8ff' : magnetTime > 0 ? '#57ffda' : '#b8c5df'],
        ['★', String(best), '#ffe178']
      ];
      var key = Math.round(gameW) + '|' + top + '|' + (mobile ? 1 : 0) + '|' + items.map(function (item) { return item.join(':'); }).join('|');
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 1;
      ctx.font = '800 ' + (mobile ? 12 : 13) + 'px system-ui, sans-serif';
      if (gameHudCache.key !== key) {
        var x = 12;
        var y = top;
        var chips = [];
        items.forEach(function (item) {
          var label = item[0] + ' ' + item[1];
          var chipW = Math.max(mobile ? 44 : 54, ctx.measureText(label).width + 17);
          if (x + chipW > hudRightLimit - 12) {
            x = 12;
            y += chipH + gap;
          }
          chips.push({ icon: item[0], value: item[1], color: item[2], x: x, y: y, w: chipW });
          x += chipW + gap;
        });
        gameHudCache = { key: key, chips: chips, width: gameW, top: top, gap: gap, chipH: chipH, mobile: mobile };
      }
      gameHudCache.chips.forEach(function (chip) {
        ctx.fillStyle = 'rgba(4,8,20,.54)';
        ctx.strokeStyle = 'rgba(255,255,255,.12)';
        ctx.shadowColor = chip.color;
        ctx.shadowBlur = isLiteGameRender() ? 0 : 12;
        var r = chipH / 2;
        var x = chip.x;
        var y = chip.y;
        var chipW = chip.w;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + chipW - r, y);
        ctx.quadraticCurveTo(x + chipW, y, x + chipW, y + r);
        ctx.lineTo(x + chipW, y + chipH - r);
        ctx.quadraticCurveTo(x + chipW, y + chipH, x + chipW - r, y + chipH);
        ctx.lineTo(x + r, y + chipH);
        ctx.quadraticCurveTo(x, y + chipH, x, y + chipH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = chip.color;
        ctx.fillText(chip.icon, x + 10, y + chipH / 2);
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.fillText(chip.value, x + 27, y + chipH / 2);
      });
      ctx.restore();
    }

    function draw(now) {
      resizeGameCanvas(false);
      prepareCanvasDraw();
      var cfg = level();
      var lite = isLiteGameRender();
      ctx.clearRect(0, 0, gameW, gameH);
      var g = ctx.createRadialGradient(gameW * 0.5, gameH * 0.48, 0, gameW * 0.5, gameH * 0.48, gameW * 0.78);
      g.addColorStop(0, pulseFlash > 0 ? 'rgba(0,234,255,.2)' : 'rgba(0,234,255,.12)');
      g.addColorStop(0.46, 'rgba(102,80,255,.08)');
      g.addColorStop(1, 'rgba(2,4,14,.98)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, gameW, gameH);
      ctx.strokeStyle = lite ? 'rgba(0,234,255,.045)' : 'rgba(0,234,255,.08)';
      ctx.lineWidth = 1;
      var gridStep = lite ? 58 : 38;
      var offset = (now || 0) * 0.018 % gridStep;
      for (var x = -gridStep + offset; x < gameW; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 32, gameH);
        ctx.stroke();
      }
      for (var y = -gridStep + offset; y < gameH; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(gameW, y);
        ctx.stroke();
      }

      if (timeStopTime > 0) {
        ctx.save();
        ctx.globalAlpha = lite ? 0.16 : 0.28;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#7ec8ff';
        ctx.shadowBlur = lite ? 8 : 28;
        ctx.setLineDash([4, 10]);
        var tSpin = (now || 0) * 0.0008;
        for (var ts = 0; ts < (lite ? 3 : 5); ts++) {
          ctx.beginPath();
          ctx.ellipse(gameW * 0.5, gameH * 0.5, gameW * (0.22 + ts * 0.055), gameH * (0.18 + ts * 0.045), tSpin + ts * 0.35, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      rings.forEach(function (r) {
        ctx.save();
        var ringAlpha = Math.max(0, r.life / r.maxLife);
        ctx.globalAlpha = ringAlpha * 0.72;
        ctx.strokeStyle = r.color;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = lite ? 5 : 22;
        ctx.lineWidth = r.fill ? 3 : 4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        if (r.fill) {
          var rg = ctx.createRadialGradient(r.x, r.y, Math.max(1, r.radius * 0.12), r.x, r.y, r.radius);
          rg.addColorStop(0, 'rgba(255,255,255,0)');
          rg.addColorStop(0.62, colorAlpha(r.color, .08));
          rg.addColorStop(1, colorAlpha(r.color, .18));
          ctx.fillStyle = rg;
          ctx.fill();
        }
        ctx.stroke();
        ctx.restore();
      });

      pickups.forEach(drawPickup);

      bullets.forEach(function (b) {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.globalAlpha = Math.max(0, Math.min(1, b.life));
        ctx.shadowColor = b.color;
        ctx.shadowBlur = b.core ? (lite ? 4 : 12) : (lite ? 5 : 18);
        ctx.fillStyle = b.color;
        if (b.core) {
          ctx.beginPath();
          ctx.arc(0, 0, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha *= 0.42;
          ctx.beginPath();
          ctx.moveTo(-b.r * 1.2, 0);
          ctx.lineTo(-b.r * 4.4, 0);
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(9, 0);
          ctx.lineTo(-6, -3.5);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 3.5);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      dangerZones.forEach(drawDangerZone);

      bossShots.forEach(function (shot) {
        ctx.save();
        var shotAlpha = shot.type === 'beam' ? Math.max(0.16, shot.life / shot.maxLife) : Math.max(0, Math.min(1, shot.life));
        ctx.globalAlpha = shotAlpha;
        ctx.strokeStyle = shot.color;
        ctx.fillStyle = shot.color;
        ctx.shadowColor = shot.color;
        ctx.shadowBlur = lite ? 6 : 24;
        if (shot.type === 'beam') {
          ctx.translate(shot.x, shot.y);
          ctx.rotate(shot.angle);
          var charging = shot.life > shot.maxLife - shot.charge;
          ctx.lineWidth = charging ? 2 : shot.width;
          ctx.globalAlpha = charging ? 0.45 : shotAlpha * 0.82;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(gameW * 1.45, 0);
          ctx.stroke();
          if (!lite && !charging) {
            ctx.globalAlpha = Math.min(0.22, shotAlpha * 0.32);
            ctx.lineWidth = shot.width * 2.2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(gameW * 1.45, 0);
            ctx.stroke();
          }
        } else {
          ctx.translate(shot.x, shot.y);
          ctx.rotate(Math.atan2(shot.vy, shot.vx));
          if (shot.type === 'orb') {
            ctx.beginPath();
            ctx.arc(0, 0, shot.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha *= 0.42;
            ctx.beginPath();
            ctx.arc(0, 0, shot.r * 1.85, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(shot.r * 1.7, 0);
            ctx.lineTo(-shot.r, -shot.r * 0.72);
            ctx.lineTo(-shot.r * 0.45, 0);
            ctx.lineTo(-shot.r, shot.r * 0.72);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      });

      hazards.forEach(function (h) { if (h && !h.defeated) drawHazard(h); });
      playerTechs.forEach(drawPlayerTech);

      particles.forEach(function (p) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      floatTexts.forEach(function (t) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life / t.max);
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = lite ? 4 : 14;
        ctx.font = '900 ' + (lite ? 13 : 16) + 'px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });

      ctx.save();
      ctx.translate(player.x, player.y);
      var pulseScale = 1 + Math.sin((now || 0) * 0.012) * 0.08 + boostFlash * 0.1 + powerFlash * 0.12;
      var pulseReady = running && pulse >= 100;
      var dashReady = running && dashCooldown <= 0;
      if (pulseReady || dashReady) {
        ctx.save();
        ctx.globalAlpha = pulseReady ? 0.72 : 0.5;
        ctx.strokeStyle = pulseReady ? '#00eaff' : '#8a5cff';
        ctx.shadowColor = pulseReady ? '#00eaff' : '#8a5cff';
        ctx.shadowBlur = lite ? 10 : 28 + Math.sin((now || 0) * 0.01) * 8;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.r + 17 + Math.sin((now || 0) * 0.007) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (dashReady) {
        ctx.save();
        ctx.globalAlpha = 0.58;
        ctx.strokeStyle = '#8a5cff';
        ctx.shadowColor = '#8a5cff';
        ctx.shadowBlur = lite ? 8 : 22;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.r + 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      if (bladeTime > 0) {
        ctx.save();
        var spin = (now || 0) * 0.018;
        var bladeVisualRank = Math.max(1, itemRank('blade'));
        var blades = lite ? Math.min(3, 1 + bladeVisualRank) : 2 + bladeVisualRank;
        ctx.globalAlpha = 0.78;
        ctx.shadowColor = '#ff3df2';
        ctx.shadowBlur = lite ? 10 : 30;
        for (var blade = 0; blade < blades; blade++) {
          ctx.save();
          ctx.rotate(spin + blade * Math.PI * 2 / blades);
          ctx.strokeStyle = blade % 2 ? '#00eaff' : '#ff3df2';
          ctx.lineWidth = lite ? 4 : 5;
          ctx.beginPath();
          ctx.arc(0, 0, player.r + 43 + bladeVisualRank * 5, -0.34, 0.48);
          ctx.stroke();
          ctx.fillStyle = blade % 2 ? '#00eaff' : '#ff3df2';
          ctx.beginPath();
          ctx.moveTo(player.r + 49 + bladeVisualRank * 5, -3);
          ctx.lineTo(player.r + 64 + bladeVisualRank * 5, 0);
          ctx.lineTo(player.r + 49 + bladeVisualRank * 5, 6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
      if (thornTime > 0 || vampireTime > 0 || splitterTime > 0 || sanctuaryTime > 0 || repairTime > 0) {
        ctx.save();
        var stateSpin = (now || 0) * 0.004;
        if (sanctuaryTime > 0) {
          ctx.globalAlpha = lite ? 0.16 : 0.25;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]);
          ctx.beginPath(); ctx.arc(0, 0, player.r + 58, stateSpin, Math.PI * 2 + stateSpin); ctx.stroke();
          ctx.setLineDash([]);
        }
        if (thornTime > 0) {
          ctx.strokeStyle = '#27ff7a'; ctx.fillStyle = '#27ff7a'; ctx.globalAlpha = 0.56;
          var thornNodes = lite ? 5 : 8;
          for (var thorn = 0; thorn < thornNodes; thorn++) {
            var thornAngle = stateSpin * 1.4 + Math.PI * 2 * thorn / thornNodes;
            ctx.save(); ctx.rotate(thornAngle); ctx.beginPath(); ctx.moveTo(player.r + 27, -3); ctx.lineTo(player.r + 39, 0); ctx.lineTo(player.r + 27, 3); ctx.closePath(); ctx.fill(); ctx.restore();
          }
        }
        if (vampireTime > 0) {
          ctx.strokeStyle = '#ff5fd2'; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, player.r + 34 + Math.sin(stateSpin * 7) * 4, 0, Math.PI * 2); ctx.stroke();
        }
        if (splitterTime > 0) {
          ctx.strokeStyle = '#b56cff'; ctx.globalAlpha = 0.62; ctx.lineWidth = 2;
          for (var splitMark = -1; splitMark <= 1; splitMark += 2) {
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(stateSpin + splitMark * 0.55) * (player.r + 42), Math.sin(stateSpin + splitMark * 0.55) * (player.r + 42)); ctx.stroke();
          }
        }
        if (repairTime > 0) {
          ctx.strokeStyle = '#57ffda'; ctx.globalAlpha = 0.58;
          var repairVisualNodes = lite ? 3 : 6;
          for (var repairVisual = 0; repairVisual < repairVisualNodes; repairVisual++) {
            var nodeAngle = -stateSpin * 1.2 + Math.PI * 2 * repairVisual / repairVisualNodes;
            var nodeX = Math.cos(nodeAngle) * (player.r + 48);
            var nodeY = Math.sin(nodeAngle) * (player.r + 48);
            ctx.strokeRect(nodeX - 3, nodeY - 3, 6, 6);
          }
        }
        ctx.restore();
      }
      if (gunTime > 0 || invincible > 0 || magnetTime > 0 || freezeTime > 0 || timeStopTime > 0 || speedBoostTime > 0 || overdriveTime > 0) {
        ctx.save();
        ctx.globalAlpha = overdriveTime > 0 ? 0.72 : timeStopTime > 0 ? 0.68 : invincible > 0 ? 0.62 : 0.46;
        var auraColor = overdriveTime > 0 ? '#ffe178' : speedBoostTime > 0 ? '#27ff7a' : timeStopTime > 0 ? '#ffffff' : invincible > 0 ? '#ffe178' : freezeTime > 0 ? '#7ec8ff' : magnetTime > 0 ? '#57ffda' : '#00eaff';
        ctx.strokeStyle = auraColor;
        ctx.shadowColor = auraColor;
        ctx.shadowBlur = lite ? 8 : 26;
        ctx.setLineDash(overdriveTime > 0 ? [3, 7] : [6, 8]);
        ctx.lineWidth = overdriveTime > 0 ? 3 : 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.r + (overdriveTime > 0 ? 45 : speedBoostTime > 0 ? 40 : invincible > 0 ? 36 : magnetTime > 0 ? 42 : 32), (now || 0) * 0.004, Math.PI * 2 + (now || 0) * 0.004);
        ctx.stroke();
        if (speedBoostTime > 0 || overdriveTime > 0) {
          ctx.setLineDash([]);
          ctx.globalAlpha *= 0.54;
          ctx.beginPath();
          ctx.arc(0, 0, player.r + (overdriveTime > 0 ? 57 : 49), Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.shadowColor = overdriveTime > 0 ? '#ffe178' : speedBoostTime > 0 ? '#27ff7a' : timeStopTime > 0 ? '#ffffff' : invincible > 0 ? '#ffe178' : freezeTime > 0 ? '#7ec8ff' : magnetTime > 0 ? '#57ffda' : shield > 0 ? '#8a5cff' : pulseReady ? '#00eaff' : cfg.color;
      ctx.shadowBlur = lite ? (shield > 0 || pulseReady || speedBoostTime > 0 || overdriveTime > 0 ? 14 : 8) : (overdriveTime > 0 ? 52 : speedBoostTime > 0 ? 36 : shield > 0 ? 42 : pulseReady ? 40 : 24);
      var grad = ctx.createRadialGradient(-6, -6, 2, 0, 0, player.r * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, cfg.color);
      grad.addColorStop(1, 'rgba(3,8,20,.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, player.r * pulseScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = invincible > 0 ? 'rgba(255,225,120,.98)' : shield > 0 ? 'rgba(138,92,255,.98)' : grace > 0 ? 'rgba(255,255,255,.98)' : 'rgba(255,255,255,.74)';
      ctx.lineWidth = shield > 0 || grace > 0 ? 4 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.r + (shield > 0 ? 12 : 7), 0, Math.PI * 2);
      ctx.stroke();
      if (shield > 0) {
        ctx.save();
        ctx.strokeStyle = '#8a5cff';
        ctx.shadowColor = '#8a5cff';
        ctx.shadowBlur = lite ? 7 : 20;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, player.r + 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(shield / maxShield(), 0, 1));
        ctx.stroke();
        ctx.restore();
      }
      ctx.rotate(Math.atan2(player.faceY, player.faceX));
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.beginPath();
      ctx.moveTo(player.r + 5, 0);
      ctx.lineTo(player.r - 8, -6);
      ctx.lineTo(player.r - 8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      if (damageFlash > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.42, damageFlash * 0.42);
        var red = ctx.createRadialGradient(gameW * 0.5, gameH * 0.5, gameW * 0.08, gameW * 0.5, gameH * 0.5, gameW * 0.68);
        red.addColorStop(0, 'rgba(255,63,104,0)');
        red.addColorStop(0.62, 'rgba(255,63,104,.24)');
        red.addColorStop(1, 'rgba(255,25,70,.88)');
        ctx.fillStyle = red;
        ctx.fillRect(0, 0, gameW, gameH);
        ctx.restore();
      }

      if (paused) {
        ctx.fillStyle = 'rgba(0,0,0,.46)';
        ctx.fillRect(0, 0, gameW, gameH);
        ctx.fillStyle = '#fff';
        ctx.font = '900 34px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('已暂停', gameW / 2, gameH / 2 - 8);
        ctx.fillStyle = '#b7f7ff';
        ctx.font = '700 17px system-ui';
        ctx.fillText(isMobileGameInput() ? '点暂停按钮继续' : '点击继续', gameW / 2, gameH / 2 + 28);
      }

      if (!running && !over) {
        ctx.fillStyle = 'rgba(0,0,0,.42)';
        ctx.fillRect(0, 0, gameW, gameH);
        ctx.fillStyle = '#fff';
        ctx.font = '900 30px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('光核闪避', gameW / 2, gameH / 2 - 18);
        ctx.fillStyle = '#b7f7ff';
        ctx.font = '600 16px system-ui';
        ctx.font = '700 17px system-ui';
        ctx.fillText(isMobileGameInput() ? '点击开始按钮' : '点击开始', gameW / 2, gameH / 2 + 17);
      }

      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,.52)';
        ctx.fillRect(0, 0, gameW, gameH);
        ctx.fillStyle = '#fff';
        ctx.font = '900 34px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('本局结束', gameW / 2, gameH / 2 - 6);
        ctx.fillStyle = '#a9f8ff';
        ctx.font = '600 16px system-ui';
        ctx.fillText(level().label + ' · WAVE ' + wave + ' · ' + score + ' 分', gameW / 2, gameH / 2 + 28);
      }

      drawGameNotices();
      drawGameHud(now);
    }

    levelButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLevel(btn.dataset.level);
        if (running) reset();
      });
    });
    startBtn.addEventListener('click', reset);
    if (reviveBtn) reviveBtn.addEventListener('click', function () { startQuizChallenge('revive'); });
    if (quizNextBtn) quizNextBtn.addEventListener('click', advanceQuizQuestion);
    if (studyTimeBtn) studyTimeBtn.addEventListener('click', function () { startQuizChallenge('time'); });
    if (gameNextRoundBtn) gameNextRoundBtn.addEventListener('click', reset);
    if (quizClose) quizClose.addEventListener('click', suspendQuizChallenge);
    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    pulseBtn.addEventListener('click', usePulse);
    dashBtn.addEventListener('click', useDash);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (mobilePulseBtn) mobilePulseBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); usePulse(); });
    if (mobileDashBtn) mobileDashBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); useDash(); });
    if (mobilePauseBtn) mobilePauseBtn.addEventListener('click', togglePause);
    if (mobileStartBtn) mobileStartBtn.addEventListener('click', reset);
    if (mobileExitBtn) mobileExitBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', function () { syncFullscreenButton(); if (quizModal && quizModal.classList.contains('open')) mountQuizModal(); });
    document.addEventListener('webkitfullscreenchange', function () { syncFullscreenButton(); if (quizModal && quizModal.classList.contains('open')) mountQuizModal(); });
    window.addEventListener('resize', syncFullscreenButton);

    if (joystickZone) {
      joystickZone.addEventListener('pointerdown', function (e) {
        if (!isMobileFullscreen()) return;
        e.preventDefault();
        if (!running || paused || over) return;
        joystick.active = true;
        joystick.pointerId = e.pointerId;
        safeSetPointerCapture(joystickZone, e.pointerId);
        updateJoystickFromClient(e.clientX, e.clientY);
      }, { passive: false });
      joystickZone.addEventListener('pointermove', function (e) {
        if (!joystick.active || joystick.pointerId !== e.pointerId) return;
        e.preventDefault();
        updateJoystickFromClient(e.clientX, e.clientY);
      }, { passive: false });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) {
        joystickZone.addEventListener(name, function (e) {
          if (joystick.pointerId === null || e.pointerId === joystick.pointerId || name === 'lostpointercapture') resetJoystick();
        });
      });
    }

    window.addEventListener('keydown', function (e) {
      if (document.body.classList.contains('game-help-open') || document.body.classList.contains('quiz-open')) return;
      keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'q', 'Q', 'p', 'P', 'Escape'].indexOf(e.key) >= 0) e.preventDefault();
      if (e.key === ' ' || e.code === 'Space') useDash();
      if (e.key === 'q' || e.key === 'Q') usePulse();
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
    }, { passive: false });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });

    function pointerMove(e) {
      var p = e.touches ? e.touches[0] : e;
      movePointerToClient(p.clientX, p.clientY);
    }

    canvas.addEventListener('pointerenter', function (e) { pointerMove(e); });
    canvas.addEventListener('pointermove', function (e) { if (running) pointerMove(e); });
    canvas.addEventListener('pointerdown', function (e) {
      if (over || (isMobileGameInput() && (!running || paused))) return;
      if (!isMobileFullscreen()) safeSetPointerCapture(canvas, e.pointerId);
      if (paused) { togglePause(); return; }
      if (!running) reset();
      pointerMove(e);
    });
    document.addEventListener('pointermove', function (e) {
      if (running && pointer.active) movePointerToClient(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', function (e) {
      if (running && pointer.active) movePointerToClient(e.clientX, e.clientY);
    });
    window.addEventListener('blur', function () { if (!running) pointer.active = false; resetJoystick(); });
    canvas.addEventListener('touchstart', function (e) {
      if (over || (isMobileGameInput() && (!running || paused))) return;
      if (paused) { togglePause(); return; }
      if (!running) reset();
      pointerMove(e);
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (running) {
        e.preventDefault();
        pointerMove(e);
      }
    }, { passive: false });

    window.setInterval(guardHeartbeat, 5000);
    window.addEventListener('pagehide', function () {
      guardHeartbeat();
      if (running || over) saveRunSnapshot(over);
    });
    window.addEventListener('pageshow', function (event) {
      if (!event.persisted || !running || over) return;
      paused = true;
      last = performance.now();
      updateHud('已暂停 · ' + level().label + ' · WAVE ' + wave);
      saveRunSnapshot(false);
      draw(performance.now());
    });
    window.addEventListener('storage', function (e) {
      if (e.key === GUARD_KEY) syncGuardUi();
      if (e.key === QUIZ_KEY && !document.body.classList.contains('quiz-open')) {
        var storedQuiz = parseStored(QUIZ_KEY, null);
        if (storedQuiz && storedQuiz.active && !storedQuiz.suspended) { quizState = storedQuiz; openQuizModal(); }
      }
    });

    readBest();
    setLevel('normal');
    syncFullscreenButton();
    var restored = restoreRunSnapshot();
    var storedQuiz = parseStored(QUIZ_KEY, null);
    if (storedQuiz && storedQuiz.active) quizState = storedQuiz;
    syncGuardUi();
    if (quizState && quizState.active && !quizState.suspended && !document.body.classList.contains('quiz-open')) {
      ensureQuizQuestion();
      openQuizModal();
    }
    if (!restored) { updateReviveUi(); draw(performance.now()); }
  }

  function boot() {
    initNav();
    initReveal();
    initCounters();
    initPointerEffects();
    initNeuralBackground();
    initGallery();
    initMemoryOrbit();
    initShowcase();
    initMembers();
    initJoinActions();
    initGameHelp();
    initGame();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
