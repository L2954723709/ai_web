/**
 * gallery.js — Masonry Gallery + Lightbox + Image Stack Fan
 * Handles: waterfall layout, hover effects, filtering, fullscreen lightbox,
 *          keyboard navigation, image preloading, stack fan interaction.
 */
const Gallery = (function() {
  'use strict';

  // ---- Gallery Data ----
  const galleryData = [
    { src: 'assets/images/gallery/gallery-01.jpg', title: 'AI 神经网络可视化', cat: 'ai', desc: '深度神经网络的拓扑结构可视化' },
    { src: 'assets/images/gallery/gallery-02.jpg', title: '机器学习工作坊', cat: 'event', desc: '手把手教你训练第一个模型' },
    { src: 'assets/images/gallery/gallery-03.jpg', title: '智能机器人实验', cat: 'project', desc: '基于强化学习的机器人控制' },
    { src: 'assets/images/gallery/gallery-04.jpg', title: '数据科学竞赛', cat: 'event', desc: 'Kaggle 竞赛团队协作现场' },
    { src: 'assets/images/gallery/gallery-05.jpg', title: '计算机视觉应用', cat: 'project', desc: '实时目标检测与语义分割' },
    { src: 'assets/images/gallery/gallery-06.jpg', title: 'NLP 技术研讨', cat: 'ai', desc: '大语言模型原理深入探讨' },
    { src: 'assets/images/gallery/gallery-07.jpg', title: 'AI 创客马拉松', cat: 'event', desc: '48小时极限编程挑战' },
    { src: 'assets/images/gallery/gallery-08.jpg', title: '生成式 AI 艺术', cat: 'project', desc: 'Stable Diffusion 创意作品' },
    { src: 'assets/images/gallery/gallery-09.jpg', title: '社团技术分享会', cat: 'event', desc: '每周五的技术交流之夜' },
    { src: 'assets/images/gallery/gallery-10.jpg', title: '知识图谱构建', cat: 'ai', desc: '从非结构化数据到知识网络' },
    { src: 'assets/images/gallery/gallery-11.jpg', title: '强化学习实战', cat: 'project', desc: '从游戏AI到工业控制' },
    { src: 'assets/images/gallery/gallery-12.jpg', title: '年度成果展览', cat: 'event', desc: '展示一年来的AI研究成果' },
  ];

  const cats = [
    { key: 'all', label: '全部' },
    { key: 'ai', label: 'AI 探索' },
    { key: 'project', label: '项目实战' },
    { key: 'event', label: '活动记录' },
  ];

  let currentFilter = 'all';
  let lightboxIndex = -1;
  let filteredData = [...galleryData];

  // ---- Build Filter Tabs ----
  function buildFilters(container) {
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.textContent = cat.label;
      btn.dataset.cat = cat.key;
      if (cat.key === 'all') btn.classList.add('active');
      btn.addEventListener('click', () => filterItems(cat.key, container));
      container.querySelector('.gallery-filters').appendChild(btn);
    });
  }

  function filterItems(cat, container) {
    currentFilter = cat;
    container.querySelectorAll('.gallery-filters button').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });

    filteredData = cat === 'all'
      ? [...galleryData]
      : galleryData.filter(item => item.cat === cat);

    renderMasonry(container);
  }

  // ---- Render Masonry Grid ----
  function renderMasonry(container) {
    const grid = container.querySelector('.masonry-grid');
    grid.innerHTML = '';

    filteredData.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'masonry-item';
      div.dataset.index = galleryData.indexOf(item); // original index
      div.innerHTML = `
        <div class="shimmer"></div>
        <div class="img-wrap">
          <img src="${item.src}" alt="${item.title}" loading="lazy">
          <div class="img-overlay"></div>
          <div class="glow-border"></div>
          <div class="zoom-icon">🔍</div>
          <div class="caption">
            <h4>${item.title}</h4>
            <span>${item.desc}</span>
          </div>
        </div>
      `;

      // Image loaded => remove shimmer, reveal
      const img = div.querySelector('img');
      img.onload = () => {
        div.classList.add('loaded');
        // Staggered reveal
        setTimeout(() => div.classList.add('visible'), idx * 80);
      };
      if (img.complete) {
        div.classList.add('loaded');
        setTimeout(() => div.classList.add('visible'), idx * 80);
      }

      // Click => lightbox
      div.addEventListener('click', () => openLightbox(galleryData.indexOf(item)));

      grid.appendChild(div);
    });
  }

  // ---- Lightbox ----
  function buildLightbox() {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.innerHTML = `
      <button class="lb-close" aria-label="Close">&times;</button>
      <button class="lb-arrow prev" aria-label="Previous">◀</button>
      <button class="lb-arrow next" aria-label="Next">▶</button>
      <div class="lb-content"><img src="" alt=""></div>
      <div class="lb-caption"><h4></h4><span></span></div>
      <div class="lb-counter"></div>
    `;
    document.body.appendChild(lb);

    // Events
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-arrow.prev').addEventListener('click', () => navigateLightbox(-1));
    lb.querySelector('.lb-arrow.next').addEventListener('click', () => navigateLightbox(1));
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', handleLightboxKeys);

    return lb;
  }

  function openLightbox(index) {
    lightboxIndex = index;
    const item = galleryData[index];
    const lb = document.getElementById('lightbox');
    lb.querySelector('.lb-content img').src = item.src;
    lb.querySelector('.lb-content img').alt = item.title;
    lb.querySelector('.lb-caption h4').textContent = item.title;
    lb.querySelector('.lb-caption span').textContent = item.desc;
    lb.querySelector('.lb-counter').textContent = `${index + 1} / ${galleryData.length}`;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    lb.classList.remove('open');
    lightboxIndex = -1;
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    // Wrap around
    lightboxIndex = (lightboxIndex + dir + galleryData.length) % galleryData.length;
    const item = galleryData[lightboxIndex];
    const lb = document.getElementById('lightbox');
    const img = lb.querySelector('.lb-content img');
    // Quick scale-down + scale-up for transition feel
    img.style.transform = 'scale(0.9)';
    img.style.transition = 'none';
    img.offsetHeight; // force reflow
    img.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
    img.style.transform = 'scale(1)';
    img.src = item.src;
    img.alt = item.title;
    lb.querySelector('.lb-caption h4').textContent = item.title;
    lb.querySelector('.lb-caption span').textContent = item.desc;
    lb.querySelector('.lb-counter').textContent = `${lightboxIndex + 1} / ${galleryData.length}`;
  }

  function handleLightboxKeys(e) {
    if (lightboxIndex < 0) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  }

  // ---- Image Stack Fan ----
  function buildImageStack(container) {
    const stack = container.querySelector('.image-stack');
    if (!stack) return;

    const stackImages = galleryData.slice(0, 5);
    stack.innerHTML = '';
    stackImages.forEach(item => {
      const card = document.createElement('div');
      card.className = 'stack-card';
      card.innerHTML = `<img src="${item.src}" alt="${item.title}" loading="lazy">`;
      card.addEventListener('click', () => openLightbox(galleryData.indexOf(item)));
      stack.appendChild(card);
    });
  }

  // ---- Init ----
  function init(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    buildFilters(container);
    renderMasonry(container);
    buildLightbox();
    buildImageStack(container);
  }

  return { init, openLightbox, closeLightbox, galleryData };
})();
