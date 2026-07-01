/**
 * gallery.js — Masonry + Lightbox + Blur-Up Progressive Loading
 * Features: WebP with fallback, blur-placeholder → sharp transition,
 *           filter tabs, fullscreen lightbox, keyboard nav, image stack fan.
 */
const Gallery = (function() {
  'use strict';

  // Detect WebP support
  let supportsWebP = false;
  (function checkWebP() {
    var img = new Image();
    img.onload = function() { supportsWebP = (img.width > 0 && img.height > 0); };
    img.onerror = function() { supportsWebP = false; };
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=';
  })();

  function imgUrl(base, useWebP) {
    return useWebP ? base.replace('.jpg', '.webp') : base;
  }
  function placeholderUrl(base) {
    return base.replace('.jpg', '-placeholder.webp');
  }

  // Gallery data
  var galleryData = [
    { src:'assets/images/gallery/gallery-01.jpg', title:'AI 神经网络可视化', cat:'ai', desc:'深度神经网络的拓扑结构可视化' },
    { src:'assets/images/gallery/gallery-02.jpg', title:'机器学习工作坊', cat:'event', desc:'手把手教你训练第一个模型' },
    { src:'assets/images/gallery/gallery-03.jpg', title:'智能机器人实验', cat:'project', desc:'基于强化学习的机器人控制' },
    { src:'assets/images/gallery/gallery-04.jpg', title:'数据科学竞赛', cat:'event', desc:'Kaggle 竞赛团队协作现场' },
    { src:'assets/images/gallery/gallery-05.jpg', title:'计算机视觉应用', cat:'project', desc:'实时目标检测与语义分割' },
    { src:'assets/images/gallery/gallery-06.jpg', title:'NLP 技术研讨', cat:'ai', desc:'大语言模型原理深入探讨' },
    { src:'assets/images/gallery/gallery-07.jpg', title:'AI 创客马拉松', cat:'event', desc:'48小时极限编程挑战' },
    { src:'assets/images/gallery/gallery-08.jpg', title:'生成式 AI 艺术', cat:'project', desc:'Stable Diffusion 创意作品' },
    { src:'assets/images/gallery/gallery-09.jpg', title:'社团技术分享会', cat:'event', desc:'每周五的技术交流之夜' },
    { src:'assets/images/gallery/gallery-10.jpg', title:'知识图谱构建', cat:'ai', desc:'从非结构化数据到知识网络' },
    { src:'assets/images/gallery/gallery-11.jpg', title:'强化学习实战', cat:'project', desc:'从游戏AI到工业控制' },
    { src:'assets/images/gallery/gallery-12.jpg', title:'年度成果展览', cat:'event', desc:'展示一年来的AI研究成果' },
  ];

  var cats = [
    { key:'all', label:'全部' },
    { key:'ai', label:'AI 探索' },
    { key:'project', label:'项目实战' },
    { key:'event', label:'活动记录' },
  ];

  var currentFilter = 'all';
  var lightboxIndex = -1;
  var filteredData = galleryData.slice();
  var useWebP = true; // Will be set after detection

  // ---- Build Filters ----
  function buildFilters(container) {
    var wrap = container.querySelector('.gallery-filters');
    if (!wrap) return;
    cats.forEach(function(cat) {
      var btn = document.createElement('button');
      btn.textContent = cat.label;
      btn.dataset.cat = cat.key;
      if (cat.key === 'all') btn.classList.add('active');
      btn.addEventListener('click', function() { filterItems(cat.key, container); });
      wrap.appendChild(btn);
    });
  }

  function filterItems(cat, container) {
    currentFilter = cat;
    container.querySelectorAll('.gallery-filters button').forEach(function(b) {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
    filteredData = cat === 'all' ? galleryData.slice() : galleryData.filter(function(item) { return item.cat === cat; });
    renderMasonry(container);
  }

  // ---- Render Masonry with Blur-Up Loading ----
  function renderMasonry(container) {
    var grid = container.querySelector('.masonry-grid');
    if (!grid) return;
    grid.innerHTML = '';

    filteredData.forEach(function(item, idx) {
      var origIdx = galleryData.indexOf(item);
      var div = document.createElement('div');
      div.className = 'masonry-item';
      div.dataset.index = origIdx;

      var srcFull = imgUrl(item.src, useWebP);
      var srcPlaceholder = placeholderUrl(item.src);

      div.innerHTML =
        '<div class="img-wrap blur-loading" style="background-image:url(' + srcPlaceholder + ');background-size:cover;background-position:center">' +
          '<img src="' + srcFull + '" alt="' + item.title + '" loading="lazy" decoding="async">' +
          '<div class="img-overlay"></div>' +
          '<div class="glow-border"></div>' +
          '<div class="zoom-icon">🔍</div>' +
          '<div class="caption"><h4>' + item.title + '</h4><span>' + item.desc + '</span></div>' +
        '</div>';

      var img = div.querySelector('img');
      var wrap = div.querySelector('.img-wrap');

      // Blur-up: when full image loads, remove blur class
      function onLoad() {
        wrap.classList.add('loaded');
        div.classList.add('loaded');
        setTimeout(function() { div.classList.add('visible'); }, idx * 60);
      }
      img.onload = onLoad;
      if (img.complete) onLoad();
      // Fallback: if WebP fails, try JPG
      img.onerror = function() {
        if (useWebP) {
          useWebP = false;
          img.src = item.src;
        } else {
          onLoad(); // Just show whatever we have
        }
      };

      div.addEventListener('click', function() { openLightbox(origIdx); });
      grid.appendChild(div);
    });
  }

  // ---- Lightbox ----
  function buildLightbox() {
    if (document.getElementById('lightbox')) return document.getElementById('lightbox');
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-arrow prev" aria-label="Previous">◀</button>' +
      '<button class="lb-arrow next" aria-label="Next">▶</button>' +
      '<div class="lb-content"><img src="" alt=""></div>' +
      '<div class="lb-caption"><h4></h4><span></span></div>' +
      '<div class="lb-counter"></div>';
    document.body.appendChild(lb);

    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-arrow.prev').addEventListener('click', function() { navigateLightbox(-1); });
    lb.querySelector('.lb-arrow.next').addEventListener('click', function() { navigateLightbox(1); });
    lb.addEventListener('click', function(e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', handleLightboxKeys);
    return lb;
  }

  function openLightbox(index) {
    lightboxIndex = index;
    var item = galleryData[index];
    var lb = document.getElementById('lightbox') || buildLightbox();
    lb.querySelector('.lb-content img').src = imgUrl(item.src, useWebP);
    lb.querySelector('.lb-content img').alt = item.title;
    lb.querySelector('.lb-caption h4').textContent = item.title;
    lb.querySelector('.lb-caption span').textContent = item.desc;
    lb.querySelector('.lb-counter').textContent = (index + 1) + ' / ' + galleryData.length;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    lightboxIndex = -1;
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + galleryData.length) % galleryData.length;
    var item = galleryData[lightboxIndex];
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var img = lb.querySelector('.lb-content img');
    img.style.transform = 'scale(0.9)';
    img.style.transition = 'none';
    img.offsetHeight;
    img.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
    img.style.transform = 'scale(1)';
    img.src = imgUrl(item.src, useWebP);
    img.alt = item.title;
    lb.querySelector('.lb-caption h4').textContent = item.title;
    lb.querySelector('.lb-caption span').textContent = item.desc;
    lb.querySelector('.lb-counter').textContent = (lightboxIndex + 1) + ' / ' + galleryData.length;
  }

  function handleLightboxKeys(e) {
    if (lightboxIndex < 0) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  }

  // ---- Image Stack Fan ----
  function buildImageStack(container) {
    var stack = container.querySelector('.image-stack');
    if (!stack) return;
    var stackImages = galleryData.slice(0, 5);
    stack.innerHTML = '';
    stackImages.forEach(function(item) {
      var card = document.createElement('div');
      card.className = 'stack-card blur-loading';
      card.style.backgroundImage = 'url(' + placeholderUrl(item.src) + ')';
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
      var img = document.createElement('img');
      img.src = imgUrl(item.src, useWebP);
      img.alt = item.title;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onload = function() { card.classList.add('loaded'); };
      img.onerror = function() {
        if (useWebP) { useWebP = false; img.src = item.src; }
        else { card.classList.add('loaded'); }
      };
      if (img.complete) card.classList.add('loaded');
      card.appendChild(img);
      card.addEventListener('click', function() { openLightbox(galleryData.indexOf(item)); });
      stack.appendChild(card);
    });
  }

  // ---- Members rendering (also with WebP + blur-up) ----
  function buildMembers() {
    var grid = document.getElementById('membersGrid');
    if (!grid) return;

    var members = [
      { img:'assets/images/team/member-01.jpg', name:'张同学', role:'社长 / ML Lead', bio:'计算机科学大三，专注NLP方向，在ACL发表论文一篇。热爱开源，坚信AI应该服务于每一个人。' },
      { img:'assets/images/team/member-02.jpg', name:'李同学', role:'副社长 / CV Lead', bio:'人工智能方向研究生，研究方向为多模态大模型与视觉理解，曾获CVPR最佳论文提名。' },
      { img:'assets/images/team/member-03.jpg', name:'王同学', role:'创意总监 / AIGC Lead', bio:'数字媒体艺术专业，擅长AI绘画与视频生成。将技术与艺术完美融合，作品多次入选AI艺术展。' },
      { img:'assets/images/team/member-04.jpg', name:'陈同学', role:'教学负责人', bio:'软件工程大二，从零自学AI两年，深知初学者的痛点。负责社团入门课程体系设计，耐心细致。' },
    ];

    grid.innerHTML = '';
    members.forEach(function(m, i) {
      var card = document.createElement('div');
      card.className = 'member-card reveal reveal-d' + (i+1);
      card.setAttribute('data-tilt', '');
      card.innerHTML =
        '<div class="member-avatar blur-loading" style="background-image:url(' + placeholderUrl(m.img) + ');background-size:cover;background-position:center">' +
          '<img src="' + imgUrl(m.img, useWebP) + '" alt="' + m.name + '" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;border-radius:50%">' +
        '</div>' +
        '<h3>' + m.name + '</h3>' +
        '<div class="member-role">' + m.role + '</div>' +
        '<p class="member-bio">' + m.bio + '</p>';
      var avatar = card.querySelector('img');
      function onMemberLoad() { card.querySelector('.member-avatar').classList.add('loaded'); }
      avatar.onload = onMemberLoad;
      avatar.onerror = function() {
        if (useWebP) { useWebP = false; avatar.src = m.img; }
        else onMemberLoad();
      };
      if (avatar.complete) onMemberLoad();
      grid.appendChild(card);
    });
  }

  // ---- Init ----
  function init(containerSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) return;

    // Use WebP based on browser support
    useWebP = supportsWebP;

    buildFilters(container);
    renderMasonry(container);
    buildLightbox();
    buildImageStack(container);
    buildMembers();
  }

  return { init: init, openLightbox: openLightbox, closeLightbox: closeLightbox, galleryData: galleryData };
})();
