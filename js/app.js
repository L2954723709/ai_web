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
    if (!canvas || !startBtn) return;
    var ctx = canvas.getContext('2d');
    var scoreEl = $('#scoreValue');
    var lifeEl = $('#lifeValue');
    var bestEl = $('#bestValue');
    var levelEl = $('#levelValue');
    var stateEl = $('#gameState');
    var levelButtons = $$('#difficultyPanel button');
    var levels = {
      easy: { label: '简单', speed: 0.76, spawn: 1.02, lives: 5, scoreRate: 2, color: '#00ffbf' },
      normal: { label: '普通', speed: 1.0, spawn: 0.76, lives: 3, scoreRate: 3, color: '#00eaff' },
      hard: { label: '困难', speed: 1.36, spawn: 0.54, lives: 3, scoreRate: 4, color: '#ffb14a' },
      insane: { label: '地狱', speed: 1.76, spawn: 0.36, lives: 2, scoreRate: 6, color: '#ff3f68' }
    };
    var currentLevel = 'normal';
    var best = 0;
    var running = false, over = false, last = 0, spawn = 0, scoreFloat = 0, score = 0, lives = levels.normal.lives, shield = 0, grace = 0, runId = 0;
    var keys = {};
    var player = { x: canvas.width / 2, y: canvas.height / 2, r: 15, speed: 292 };
    var nodes = [];
    function bestKey() { return 'neuralDodgeBest_' + currentLevel; }
    function readBest() { best = Number(localStorage.getItem(bestKey()) || 0); }
    function level() { return levels[currentLevel] || levels.normal; }
    function setLevel(next) {
      if (!levels[next]) return;
      currentLevel = next;
      readBest();
      lives = running ? lives : level().lives;
      levelButtons.forEach(function (btn) { btn.classList.toggle('active', btn.dataset.level === currentLevel); });
      updateHud(running ? '运行中 · ' + level().label + '难度' : '待机 · ' + level().label + '难度');
      draw(performance.now());
    }
    function reset() {
      running = true; over = false; runId += 1; last = performance.now(); spawn = 0.55; scoreFloat = 0; score = 0; lives = level().lives; shield = 0; grace = 1.4;
      player.x = canvas.width / 2; player.y = canvas.height / 2; nodes = [];
      updateHud('运行中 · ' + level().label + '难度');
      requestAnimationFrame(function (now) { loop(now, runId); });
    }
    function updateHud(state) {
      if (scoreEl) scoreEl.textContent = score;
      if (lifeEl) lifeEl.textContent = lives;
      if (bestEl) bestEl.textContent = best;
      if (levelEl) levelEl.textContent = level().label;
      if (stateEl) stateEl.textContent = state || (running ? '运行中 · ' + level().label + '难度' : '待机 · ' + level().label + '难度');
      startBtn.textContent = running ? '重新开始' : over ? '再玩一局' : '开始游戏';
    }
    function endGame() {
      running = false; over = true; runId += 1;
      if (score > best) { best = score; localStorage.setItem(bestKey(), String(best)); }
      updateHud('已结束 · ' + level().label + '难度');
      showToast(level().label + '难度，本局分数：' + score);
      draw(performance.now());
    }
    function addNode() {
      var cfg = level();
      var edge = Math.floor(Math.random() * 4);
      var roll = Math.random();
      var n = {
        x: edge === 0 ? -24 : edge === 1 ? canvas.width + 24 : Math.random() * canvas.width,
        y: edge === 2 ? -24 : edge === 3 ? canvas.height + 24 : Math.random() * canvas.height,
        r: 9 + Math.random() * 12,
        type: roll < (currentLevel === 'insane' ? 0.78 : 0.68) ? 'bad' : roll < 0.86 ? 'shield' : 'good',
        vx: 0, vy: 0, rot: Math.random() * Math.PI
      };
      var angle = Math.atan2(player.y - n.y, player.x - n.x) + (Math.random() - 0.5) * (currentLevel === 'insane' ? 0.54 : 0.85);
      var speed = ((n.type === 'bad' ? 92 : 70) + Math.min(130, score * 0.2) + Math.random() * 42) * cfg.speed;
      n.vx = Math.cos(angle) * speed; n.vy = Math.sin(angle) * speed; nodes.push(n);
    }
    function loop(now, id) {
      if (!running || id !== runId) return;
      var dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now; update(dt); draw(now);
      requestAnimationFrame(function (next) { loop(next, id); });
    }
    function update(dt) {
      var cfg = level();
      var dx = 0, dy = 0;
      if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
      if (keys.ArrowRight || keys.d || keys.D) dx += 1;
      if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
      if (keys.ArrowDown || keys.s || keys.S) dy += 1;
      if (dx || dy) { var len = Math.hypot(dx, dy) || 1; player.x += dx / len * player.speed * dt; player.y += dy / len * player.speed * dt; }
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
      shield = Math.max(0, shield - dt);
      grace = Math.max(0, grace - dt);
      spawn -= dt;
      if (spawn <= 0) { addNode(); if (currentLevel === 'hard' || currentLevel === 'insane') addNode(); spawn = Math.max(currentLevel === 'insane' ? 0.13 : 0.18, cfg.spawn - score * 0.0024); }
      nodes.forEach(function (n) { n.x += n.vx * dt; n.y += n.vy * dt; n.rot += dt * (n.type === 'bad' ? 3.2 : 2); });
      nodes = nodes.filter(function (n) { return n.x > -80 && n.x < canvas.width + 80 && n.y > -80 && n.y < canvas.height + 80; });
      for (var i = nodes.length - 1; i >= 0; i--) {
        var n = nodes[i];
        if (Math.hypot(n.x - player.x, n.y - player.y) < n.r + player.r) {
          if (n.type === 'good') scoreFloat += 10;
          else if (n.type === 'shield') { shield = 4.8; scoreFloat += 4; }
          else { if (shield > 0 || grace > 0) scoreFloat += 5; else lives -= 1; }
          nodes.splice(i, 1); score = Math.floor(scoreFloat);
          if (lives <= 0) return endGame();
          updateHud();
        }
      }
      scoreFloat += dt * cfg.scoreRate; score = Math.floor(scoreFloat); if (score > best) best = score; updateHud();
    }
    function draw(t) {
      var cfg = level();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var g = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.48, 0, canvas.width * 0.5, canvas.height * 0.48, canvas.width * 0.74);
      g.addColorStop(0, 'rgba(0,234,255,.12)'); g.addColorStop(0.46, 'rgba(102,80,255,.06)'); g.addColorStop(1, 'rgba(2,4,14,.98)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(0,234,255,.08)'; ctx.lineWidth = 1;
      var offset = (t || 0) * 0.018 % 38;
      for (var x = -38 + offset; x < canvas.width; x += 38) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, canvas.height); ctx.stroke(); }
      for (var y = -38 + offset; y < canvas.height; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      ctx.fillStyle = cfg.color; ctx.font = '800 13px system-ui'; ctx.textAlign = 'left'; ctx.fillText('LEVEL / ' + cfg.label, 18, 30);
      nodes.forEach(function (n) {
        ctx.save(); ctx.translate(n.x, n.y); ctx.rotate(n.rot);
        var color = n.type === 'bad' ? '#ff3f68' : n.type === 'shield' ? '#8a5cff' : '#00ffbf';
        ctx.shadowColor = color; ctx.shadowBlur = 22; ctx.fillStyle = color; ctx.beginPath();
        if (n.type === 'bad') ctx.rect(-n.r, -n.r, n.r * 2, n.r * 2); else ctx.arc(0, 0, n.r, 0, Math.PI * 2);
        ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      });
      ctx.save(); ctx.translate(player.x, player.y);
      var pulse = 1 + Math.sin((t || 0) * 0.012) * 0.08;
      ctx.shadowColor = shield > 0 ? '#8a5cff' : cfg.color; ctx.shadowBlur = shield > 0 ? 36 : 26;
      ctx.fillStyle = cfg.color; ctx.beginPath(); ctx.arc(0, 0, player.r * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = shield > 0 ? 'rgba(138,92,255,.95)' : grace > 0 ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.72)'; ctx.lineWidth = shield > 0 || grace > 0 ? 4 : 2;
      ctx.beginPath(); ctx.arc(0, 0, player.r + (shield > 0 ? 11 : 6), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      if (over) { ctx.fillStyle = 'rgba(0,0,0,.48)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.font = '900 34px system-ui'; ctx.textAlign = 'center'; ctx.fillText('再来一局？', canvas.width / 2, canvas.height / 2 - 6); ctx.fillStyle = '#a9f8ff'; ctx.font = '600 16px system-ui'; ctx.fillText(level().label + '难度 · ' + score + ' 分', canvas.width / 2, canvas.height / 2 + 28); }
    }
    levelButtons.forEach(function (btn) { btn.addEventListener('click', function () { setLevel(btn.dataset.level); if (running) reset(); }); });
    startBtn.addEventListener('click', reset);
    window.addEventListener('keydown', function (e) { keys[e.key] = true; if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) >= 0) e.preventDefault(); }, { passive: false });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });
    function pointerMove(e) { var r = canvas.getBoundingClientRect(); var p = e.touches ? e.touches[0] : e; player.x = (p.clientX - r.left) / r.width * canvas.width; player.y = (p.clientY - r.top) / r.height * canvas.height; }
    canvas.addEventListener('pointermove', function (e) { if (running && e.buttons) pointerMove(e); });
    canvas.addEventListener('pointerdown', function (e) { canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); if (!running) reset(); pointerMove(e); });
    canvas.addEventListener('touchmove', function (e) { if (running) { e.preventDefault(); pointerMove(e); } }, { passive: false });
    readBest(); setLevel('normal');
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



