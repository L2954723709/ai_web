(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };

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
    var w = 0, h = 0, dpr = 1, tick = 0, particles = [];
    var count = prefersReducedMotion ? 36 : 86;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
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

    function draw() {
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
        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var max = 135 * dpr;
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
      if (!prefersReducedMotion) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    draw();
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
    setImage(0, true);
    if (!prefersReducedMotion) {
      timer = window.setInterval(function () { setImage(active + 1, false); }, 4200);
      stage.addEventListener('mouseenter', function () { clearInterval(timer); });
      stage.addEventListener('mouseleave', function () {
        clearInterval(timer);
        timer = window.setInterval(function () { setImage(active + 1, false); }, 4200);
      });
    }
  }

  function initVideoWall() {
    var videos = $$('.video-frame video[data-src]');
    if (!videos.length) return;
    function load(video) {
      if (video.dataset.loaded) return;
      var source = document.createElement('source');
      source.src = video.dataset.src;
      source.type = video.dataset.src.indexOf('.webm') > -1 ? 'video/webm' : 'video/mp4';
      video.appendChild(source);
      video.dataset.loaded = '1';
      video.addEventListener('error', function () {
        if (video.dataset.fallback && video.currentSrc.indexOf(video.dataset.fallback) === -1) {
          video.innerHTML = '';
          var fb = document.createElement('source');
          fb.src = video.dataset.fallback;
          fb.type = 'video/mp4';
          video.appendChild(fb);
          video.load();
          var fp = video.play();
          if (fp && fp.catch) fp.catch(function () {});
        }
      }, { once: true });
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
    if (!('IntersectionObserver' in window)) { videos.forEach(load); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { load(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '320px 0px', threshold: 0.04 });
    videos.forEach(function (v) { io.observe(v); });
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
        document.documentElement.animate([
          { filter: 'saturate(1)' },
          { filter: 'saturate(1.8) hue-rotate(24deg)' },
          { filter: 'saturate(1)' }
        ], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)' });
        showToast('信号已点亮，欢迎接入实验舱');
      });
    }
  }

  function initGame() {
    var canvas = $('#gameCanvas');
    var startBtn = $('#gameStart');
    var pulseBtn = $('#gamePulse');
    var dashBtn = $('#gameDash');
    var fullscreenBtn = $('#gameFullscreen');
    var mobilePulseBtn = $('#mobilePulseBtn');
    var mobileDashBtn = $('#mobileDashBtn');
    var mobileExitBtn = $('#mobileExitBtn');
    var joystickZone = $('#joystickZone');
    var joystickStick = $('#joystickStick');
    var gameCard = canvas ? canvas.closest('.game-card') : null;
    var gameSection = canvas ? canvas.closest('.game-section') : null;
    if (!canvas || !startBtn || !pulseBtn || !dashBtn || !fullscreenBtn || !gameCard) return;
    var ctx = canvas.getContext('2d');
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
      easy: { label: '简单', speed: 0.88, spawn: 0.98, lives: 5, scoreRate: 2.4, pulseGain: 9, waveTime: 14, color: '#00ffbf' },
      normal: { label: '普通', speed: 1.0, spawn: 0.76, lives: 3, scoreRate: 3.3, pulseGain: 10.5, waveTime: 12.5, color: '#00eaff' },
      hard: { label: '困难', speed: 1.26, spawn: 0.58, lives: 3, scoreRate: 4.5, pulseGain: 11.5, waveTime: 11.6, color: '#ffb14a' },
      insane: { label: '地狱', speed: 1.54, spawn: 0.42, lives: 2, scoreRate: 6.2, pulseGain: 13, waveTime: 10.5, color: '#ff3f68' }
    };
    var currentLevel = 'normal';
    var best = 0;
    var running = false;
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
    var pointer = { x: canvas.width / 2, y: canvas.height / 2, active: false };
    var joystick = { active: false, pointerId: null, dx: 0, dy: 0, mag: 0 };
    var player = { x: canvas.width / 2, y: canvas.height / 2, r: 16, speed: 312, faceX: 1, faceY: 0 };
    var hazards = [];
    var pickups = [];
    var particles = [];
    var rings = [];

    function bestKey() { return 'lightCoreDodgeBest_' + currentLevel; }
    function readBest() { best = Number(localStorage.getItem(bestKey()) || 0); }
    function level() { return levels[currentLevel] || levels.normal; }
    function multiplier() { return 1 + Math.min(3, combo * 0.14); }
    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }


    function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
    function isTouchLayout() { return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900; }
    function isMobileFullscreen() { return fullscreenElement() === gameCard && isTouchLayout(); }

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
      if (!mobileActive) resetJoystick();
      draw(performance.now());
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
      pointer.x = clamp((clientX - r.left) / r.width * canvas.width, player.r, canvas.width - player.r);
      pointer.y = clamp((clientY - r.top) / r.height * canvas.height, player.r, canvas.height - player.r);
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
      for (var i = 0; i < count; i++) {
        var a = Math.random() * Math.PI * 2;
        var s = speed * (0.35 + Math.random() * 0.85);
        particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.26 + Math.random() * 0.38, max: 0.56, color: color, size: 1.5 + Math.random() * 3.5 });
      }
    }

    function addRing(x, y, color, radius, life) {
      rings.push({ x: x, y: y, color: color, radius: radius || 30, max: radius || 220, life: life || 0.5, maxLife: life || 0.5 });
    }

    function updateHud(state) {
      var pulseReady = running && pulse >= 100;
      var dashReady = running && dashCooldown <= 0;
      if (scoreEl) scoreEl.textContent = score;
      if (comboEl) comboEl.textContent = 'x' + multiplier().toFixed(1);
      if (waveEl) waveEl.textContent = String(wave);
      if (lifeEl) lifeEl.textContent = lives;
      if (pulseEl) pulseEl.textContent = Math.floor(clamp(pulse, 0, 100)) + '%';
      if (dashEl) dashEl.textContent = dashCooldown <= 0 ? '就绪' : dashCooldown.toFixed(1) + 's';
      if (bestEl) bestEl.textContent = best;
      if (stateEl) stateEl.textContent = state || (running ? '运行中 · ' + level().label + ' · WAVE ' + wave : '待机 · ' + level().label + '难度');
      startBtn.textContent = running ? '重新开始' : over ? '再玩一局' : '开始游戏';
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
      updateHud(running ? '运行中 · ' + level().label + ' · WAVE ' + wave : '待机 · ' + level().label + '难度');
      draw(performance.now());
    }

    function gainScore(value) {
      scoreFloat += value * multiplier();
      score = Math.floor(scoreFloat);
      if (score > best) best = score;
    }

    function spawnPickup(forceType) {
      var types = ['good', 'good', 'good', 'shield', 'charge'];
      if (lives < level().lives && Math.random() < 0.16) types.push('heal');
      var type = forceType || types[Math.floor(Math.random() * types.length)];
      pickups.push({
        x: 50 + Math.random() * (canvas.width - 100),
        y: 50 + Math.random() * (canvas.height - 100),
        r: type === 'heal' ? 11 : type === 'shield' ? 10 : 9,
        type: type,
        rot: Math.random() * Math.PI * 2,
        ttl: 7.5 + Math.random() * 2.5
      });
    }

    function spawnHazard(kind) {
      var cfg = level();
      var edge = Math.floor(Math.random() * 4);
      var x = edge === 0 ? -28 : edge === 1 ? canvas.width + 28 : Math.random() * canvas.width;
      var y = edge === 2 ? -28 : edge === 3 ? canvas.height + 28 : Math.random() * canvas.height;
      var angle = Math.atan2(player.y - y, player.x - x);
      var waveBoost = 1 + (wave - 1) * 0.08;
      var hazard = { x: x, y: y, vx: 0, vy: 0, rot: Math.random() * Math.PI * 2, near: false, kind: kind || 'seeker', elite: false };
      if (hazard.kind === 'runner') {
        hazard.r = 8 + Math.random() * 3;
        hazard.speed = (162 + Math.random() * 34) * cfg.speed * waveBoost;
      } else if (hazard.kind === 'brute') {
        hazard.r = 18 + Math.random() * 7;
        hazard.speed = (88 + Math.random() * 20) * cfg.speed * waveBoost;
        hazard.elite = true;
      } else if (hazard.kind === 'orbit') {
        hazard.r = 11 + Math.random() * 4;
        hazard.speed = (126 + Math.random() * 28) * cfg.speed * waveBoost;
      } else {
        hazard.kind = 'seeker';
        hazard.r = 11 + Math.random() * 5;
        hazard.speed = (108 + Math.random() * 32) * cfg.speed * waveBoost;
      }
      hazard.vx = Math.cos(angle) * hazard.speed;
      hazard.vy = Math.sin(angle) * hazard.speed;
      hazards.push(hazard);
    }

    function destroyHazard(index, bonus) {
      var h = hazards[index];
      if (!h) return;
      addParticles(h.x, h.y, h.elite ? '#ffb14a' : '#ff3f68', h.elite ? 16 : 10, h.elite ? 170 : 130);
      gainScore(bonus || (h.elite ? 12 : 7));
      hazards.splice(index, 1);
    }

    function usePulse() {
      if (!running || pulse < 100) return;
      pulse = 0;
      pulseFlash = 0.34;
      pulseBurst = 0.42;
      boostFlash = 0.42;
      addRing(player.x, player.y, '#00eaff', 34, 0.42);
      addParticles(player.x, player.y, '#00eaff', 24, 210);
      var destroyed = 0;
      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        var dist = Math.hypot(h.x - player.x, h.y - player.y);
        if (dist < 220 + h.r) {
          destroyHazard(i, h.elite ? 18 : 12);
          destroyed += 1;
        }
      }
      if (destroyed > 0) {
        combo += destroyed;
        comboTimer = Math.max(comboTimer, 3.6);
        showToast('脉冲清场 +' + destroyed);
      } else {
        gainScore(6);
        showToast('脉冲已释放');
      }
      updateHud();
    }

    function useDash() {
      if (!running || dashCooldown > 0) return;
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
      addParticles(player.x, player.y, '#8a5cff', 18, 190);
      player.x = clamp(player.x + dx * 110, player.r, canvas.width - player.r);
      player.y = clamp(player.y + dy * 110, player.r, canvas.height - player.r);
      dashCooldown = 2.6;
      boostFlash = 0.36;
      grace = Math.max(grace, 0.34);
      shield = Math.max(shield, 0.18);
      gainScore(4);
      addRing(player.x, player.y, '#8a5cff', 26, 0.28);
      for (var i = hazards.length - 1; i >= 0; i--) {
        if (Math.hypot(hazards[i].x - player.x, hazards[i].y - player.y) < 38 + hazards[i].r) destroyHazard(i, 9);
      }
      updateHud();
    }

    function reset() {
      running = true;
      over = false;
      runId += 1;
      last = performance.now();
      spawnTimer = 0.52;
      scoreFloat = 0;
      score = 0;
      lives = level().lives;
      shield = 0;
      grace = 1.3;
      wave = 1;
      waveClock = 0;
      combo = 0;
      comboTimer = 0;
      pulse = 34;
      pulseFlash = 0;
      pulseBurst = 0;
      dashCooldown = 0;
      damageFlash = 0;
      boostFlash = 0;
      hitFlashTimer = 0;
      hazards = [];
      pickups = [];
      particles = [];
      rings = [];
      player.x = canvas.width / 2;
      player.y = canvas.height / 2;
      player.faceX = 1;
      player.faceY = 0;
      spawnPickup('good');
      updateHud('运行中 · ' + level().label + ' · WAVE 1');
      requestAnimationFrame(function (now) { loop(now, runId); });
    }

    function endGame() {
      running = false;
      over = true;
      runId += 1;
      if (score > best) {
        best = score;
        localStorage.setItem(bestKey(), String(best));
      }
      setReadyClasses(false, false);
      updateHud('已结束 · ' + level().label + ' · WAVE ' + wave);
      showToast(level().label + '难度，本局 ' + score + ' 分');
      draw(performance.now());
    }

    function loop(now, id) {
      if (!running || id !== runId) return;
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
        player.x += dx / len * player.speed * mobileBoost * dt;
        player.y += dy / len * player.speed * mobileBoost * dt;
        player.faceX = dx / len;
        player.faceY = dy / len;
      } else if (pointer.active && !isMobileFullscreen()) {
        var mx = pointer.x - player.x;
        var my = pointer.y - player.y;
        var dist = Math.hypot(mx, my);
        if (dist > 1) {
          var step = Math.min(dist, player.speed * 1.06 * dt);
          player.x += mx / dist * step;
          player.y += my / dist * step;
          player.faceX = mx / dist;
          player.faceY = my / dist;
        }
      }

      player.x = clamp(player.x, player.r, canvas.width - player.r);
      player.y = clamp(player.y, player.r, canvas.height - player.r);
      shield = Math.max(0, shield - dt);
      grace = Math.max(0, grace - dt);
      comboTimer = Math.max(0, comboTimer - dt);
      if (comboTimer <= 0 && combo > 0) combo = 0;
      dashCooldown = Math.max(0, dashCooldown - dt);
      pulseFlash = Math.max(0, pulseFlash - dt);
      pulseBurst = Math.max(0, pulseBurst - dt);
      damageFlash = Math.max(0, damageFlash - dt * 1.8);
      boostFlash = Math.max(0, boostFlash - dt * 1.7);
      hitFlashTimer = Math.max(0, hitFlashTimer - dt);
      if (hitFlashTimer <= 0) gameCard.classList.remove('is-hit');
      pulse = clamp(pulse + dt * cfg.pulseGain, 0, 100);

      waveClock += dt;
      if (waveClock >= cfg.waveTime) {
        wave += 1;
        waveClock = 0;
        pulse = clamp(pulse + 14, 0, 100);
        boostFlash = 0.32;
        addRing(canvas.width * 0.5, canvas.height * 0.5, cfg.color, 60, 0.55);
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        var pack = 1;
        if (currentLevel === 'hard' || currentLevel === 'insane' || wave >= 4) pack += 1;
        if (wave >= 6 && Math.random() < 0.3) pack += 1;
        for (var s = 0; s < pack; s++) {
          var roll = Math.random();
          var kind = roll < 0.54 ? 'seeker' : roll < 0.76 ? 'runner' : roll < 0.92 ? 'orbit' : 'brute';
          spawnHazard(kind);
        }
        if (Math.random() < 0.28) spawnPickup();
        spawnTimer = Math.max(currentLevel === 'insane' ? 0.16 : 0.22, cfg.spawn / (1 + (wave - 1) * 0.12) - score * 0.00065);
      }

      hazards.forEach(function (h, idx) {
        var tx = player.x - h.x;
        var ty = player.y - h.y;
        var targetAngle = Math.atan2(ty, tx);
        if (h.kind === 'seeker' || h.kind === 'brute') {
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
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.rot += dt * (h.kind === 'runner' ? 7.5 : h.kind === 'brute' ? 1.6 : 4.2);
      });
      hazards = hazards.filter(function (h) { return h.x > -120 && h.x < canvas.width + 120 && h.y > -120 && h.y < canvas.height + 120; });

      pickups.forEach(function (p, idx) {
        p.rot += dt * 2.2;
        p.ttl -= dt;
        p.y += Math.sin((last + idx * 90) * 0.0024) * 0.15;
      });
      pickups = pickups.filter(function (p) { return p.ttl > 0; });

      particles.forEach(function (p) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
      });
      particles = particles.filter(function (p) { return p.life > 0; });

      rings.forEach(function (r) {
        r.life -= dt;
        r.radius += (r.max - r.radius) * 0.16;
      });
      rings = rings.filter(function (r) { return r.life > 0; });

      for (var i = hazards.length - 1; i >= 0; i--) {
        var h = hazards[i];
        var dist = Math.hypot(h.x - player.x, h.y - player.y);
        if (!h.near && dist < h.r + player.r + 24 && dist > h.r + player.r + 6) {
          h.near = true;
          pulse = clamp(pulse + 2.4, 0, 100);
          comboTimer = Math.max(comboTimer, 1.2);
          gainScore(2);
        }
        if (dist < h.r + player.r) {
          if (shield > 0 || grace > 0) {
            destroyHazard(i, h.elite ? 16 : 10);
            comboTimer = Math.max(comboTimer, 2.2);
            pulse = clamp(pulse + 4, 0, 100);
          } else {
            lives -= h.elite ? 2 : 1;
            combo = 0;
            comboTimer = 0;
            grace = 1.1;
            damageFlash = 1;
            triggerHitFlash(h.elite ? 1 : 0.72);
            pulse = Math.max(0, pulse - 18);
            addRing(player.x, player.y, '#ff3f68', 28, 0.34);
            addParticles(player.x, player.y, '#ffffff', 18, 160);
            hazards.splice(i, 1);
            if (lives <= 0) return endGame();
          }
          updateHud();
        }
      }

      for (var j = pickups.length - 1; j >= 0; j--) {
        var p = pickups[j];
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.r + player.r + 3) {
          boostFlash = 0.22;
          if (p.type === 'good') {
            combo += 1;
            comboTimer = 3.4;
            pulse = clamp(pulse + 9, 0, 100);
            gainScore(12);
            addParticles(p.x, p.y, '#00ffbf', 12, 140);
          } else if (p.type === 'shield') {
            shield = 5;
            pulse = clamp(pulse + 6, 0, 100);
            gainScore(9);
            addParticles(p.x, p.y, '#8a5cff', 14, 150);
          } else if (p.type === 'charge') {
            pulse = clamp(pulse + 30, 0, 100);
            comboTimer = Math.max(comboTimer, 2.2);
            gainScore(10);
            addParticles(p.x, p.y, '#ffb14a', 14, 160);
          } else if (p.type === 'heal') {
            lives = Math.min(level().lives, lives + 1);
            gainScore(14);
            addParticles(p.x, p.y, '#ffffff', 14, 150);
          }
          pickups.splice(j, 1);
          updateHud();
        }
      }

      scoreFloat += dt * cfg.scoreRate * multiplier();
      score = Math.floor(scoreFloat);
      if (score > best) best = score;
      updateHud();
    }

    function drawPickup(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      var color = p.type === 'good' ? '#00ffbf' : p.type === 'shield' ? '#8a5cff' : p.type === 'charge' ? '#ffb14a' : '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
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
      ctx.restore();
    }

    function drawHazard(h) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      var color = h.elite ? '#ffb14a' : h.kind === 'runner' ? '#ff7c4d' : '#ff3f68';
      ctx.shadowColor = color;
      ctx.shadowBlur = h.elite ? 28 : 18;
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 1.1;
      if (h.kind === 'runner') {
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
      ctx.restore();
    }

    function draw(now) {
      var cfg = level();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var g = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.48, 0, canvas.width * 0.5, canvas.height * 0.48, canvas.width * 0.78);
      g.addColorStop(0, pulseFlash > 0 ? 'rgba(0,234,255,.2)' : 'rgba(0,234,255,.12)');
      g.addColorStop(0.46, 'rgba(102,80,255,.08)');
      g.addColorStop(1, 'rgba(2,4,14,.98)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,234,255,.08)';
      ctx.lineWidth = 1;
      var offset = (now || 0) * 0.018 % 38;
      for (var x = -38 + offset; x < canvas.width; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 32, canvas.height);
        ctx.stroke();
      }
      for (var y = -38 + offset; y < canvas.height; y += 38) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      rings.forEach(function (r) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.65;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      pickups.forEach(drawPickup);
      hazards.forEach(drawHazard);

      particles.forEach(function (p) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      ctx.translate(player.x, player.y);
      var pulseScale = 1 + Math.sin((now || 0) * 0.012) * 0.08 + boostFlash * 0.1;
      var pulseReady = running && pulse >= 100;
      var dashReady = running && dashCooldown <= 0;
      if (pulseReady || dashReady) {
        ctx.save();
        ctx.globalAlpha = pulseReady ? 0.72 : 0.5;
        ctx.strokeStyle = pulseReady ? '#00eaff' : '#8a5cff';
        ctx.shadowColor = pulseReady ? '#00eaff' : '#8a5cff';
        ctx.shadowBlur = 28 + Math.sin((now || 0) * 0.01) * 8;
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
        ctx.shadowBlur = 22;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, player.r + 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.shadowColor = shield > 0 ? '#8a5cff' : pulseReady ? '#00eaff' : cfg.color;
      ctx.shadowBlur = shield > 0 ? 42 : pulseReady ? 40 : 24;
      var grad = ctx.createRadialGradient(-6, -6, 2, 0, 0, player.r * 1.5);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, cfg.color);
      grad.addColorStop(1, 'rgba(3,8,20,.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, player.r * pulseScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = shield > 0 ? 'rgba(138,92,255,.98)' : grace > 0 ? 'rgba(255,255,255,.98)' : 'rgba(255,255,255,.74)';
      ctx.lineWidth = shield > 0 || grace > 0 ? 4 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, player.r + (shield > 0 ? 12 : 7), 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(Math.atan2(player.faceY, player.faceX));
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.beginPath();
      ctx.moveTo(player.r + 5, 0);
      ctx.lineTo(player.r - 8, -6);
      ctx.lineTo(player.r - 8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = cfg.color;
      ctx.font = '800 13px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('LEVEL / ' + cfg.label, 18, 30);
      ctx.fillText('WAVE / ' + wave, 18, 50);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillText('MULTI ' + multiplier().toFixed(1) + 'x', canvas.width - 18, 30);
      ctx.fillText('PULSE ' + Math.floor(pulse) + '%', canvas.width - 18, 50);

      if (damageFlash > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.42, damageFlash * 0.42);
        var red = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.08, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.68);
        red.addColorStop(0, 'rgba(255,63,104,0)');
        red.addColorStop(0.62, 'rgba(255,63,104,.24)');
        red.addColorStop(1, 'rgba(255,25,70,.88)');
        ctx.fillStyle = red;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (!running && !over) {
        ctx.fillStyle = 'rgba(0,0,0,.42)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '900 30px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('光核闪避', canvas.width / 2, canvas.height / 2 - 18);
        ctx.fillStyle = '#b7f7ff';
        ctx.font = '600 16px system-ui';
        ctx.font = '700 17px system-ui';
        ctx.fillText('点击开始', canvas.width / 2, canvas.height / 2 + 17);
      }

      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,.52)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '900 34px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('再来一局', canvas.width / 2, canvas.height / 2 - 6);
        ctx.fillStyle = '#a9f8ff';
        ctx.font = '600 16px system-ui';
        ctx.fillText(level().label + ' · WAVE ' + wave + ' · ' + score + ' 分', canvas.width / 2, canvas.height / 2 + 28);
      }
    }

    levelButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLevel(btn.dataset.level);
        if (running) reset();
      });
    });
    startBtn.addEventListener('click', reset);
    pulseBtn.addEventListener('click', usePulse);
    dashBtn.addEventListener('click', useDash);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (mobilePulseBtn) mobilePulseBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); usePulse(); });
    if (mobileDashBtn) mobileDashBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); useDash(); });
    if (mobileExitBtn) mobileExitBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', syncFullscreenButton);
    document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
    window.addEventListener('resize', syncFullscreenButton);

    if (joystickZone) {
      joystickZone.addEventListener('pointerdown', function (e) {
        if (!isMobileFullscreen()) return;
        e.preventDefault();
        if (!running) reset();
        joystick.active = true;
        joystick.pointerId = e.pointerId;
        joystickZone.setPointerCapture && joystickZone.setPointerCapture(e.pointerId);
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
      keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'q', 'Q'].indexOf(e.key) >= 0) e.preventDefault();
      if (e.key === ' ' || e.code === 'Space') useDash();
      if (e.key === 'q' || e.key === 'Q') usePulse();
    }, { passive: false });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });

    function pointerMove(e) {
      var p = e.touches ? e.touches[0] : e;
      movePointerToClient(p.clientX, p.clientY);
    }

    canvas.addEventListener('pointerenter', function (e) { pointerMove(e); });
    canvas.addEventListener('pointermove', function (e) { if (running) pointerMove(e); });
    canvas.addEventListener('pointerdown', function (e) {
      if (!isMobileFullscreen() && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
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
    canvas.addEventListener('touchstart', function (e) { if (!running) reset(); pointerMove(e); }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (running) {
        e.preventDefault();
        pointerMove(e);
      }
    }, { passive: false });

    readBest();
    setLevel('normal');
    syncFullscreenButton();
    draw(performance.now());
  }

  function boot() {
    initNav();
    initReveal();
    initCounters();
    initPointerEffects();
    initNeuralBackground();
    initGallery();
    initShowcase();
    initVideoWall();
    initMembers();
    initJoinActions();
    initGame();
    initReveal();
    console.log('%cAI Club / Pure Frontend / Ready', 'color:#00f5ff;font-size:16px;font-weight:900');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();




