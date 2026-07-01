/**
 * background.js — Canvas Morphing Blob Background
 * Renders animated radial gradient blobs that drift across the screen.
 */
const Background = (function() {
  'use strict';

  let canvas, ctx, W, H, rafId;
  const blobs = [
    { x: 0.25, y: 0.30, r: 0.35, color: [0, 198, 255], speed: 0.0003, phase: 0 },
    { x: 0.70, y: 0.60, r: 0.40, color: [139, 92, 246], speed: 0.0004, phase: 2 },
    { x: 0.50, y: 0.80, r: 0.30, color: [0, 255, 200], speed: 0.00035, phase: 4 },
    { x: 0.15, y: 0.75, r: 0.28, color: [255, 60, 120], speed: 0.00025, phase: 1 },
    { x: 0.85, y: 0.20, r: 0.33, color: [0, 180, 255], speed: 0.00045, phase: 3 },
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  let t = 0;
  function draw() {
    t++;
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      const cx = b.x * W + Math.sin(t * b.speed + b.phase) * W * 0.08;
      const cy = b.y * H + Math.cos(t * b.speed * 1.3 + b.phase) * H * 0.08;
      const r = b.r * Math.min(W, H);

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const [rr, gg, bb] = b.color;
      grad.addColorStop(0, `rgba(${rr},${gg},${bb},0.14)`);
      grad.addColorStop(0.4, `rgba(${rr},${gg},${bb},0.06)`);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(draw);
  }

  function init() {
    canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    draw();
  }

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
  }

  return { init, destroy };
})();
