/**
 * main.js — Application Entry Point
 * Initializes all modules once DOM is ready.
 */
(function() {
  'use strict';

  function boot() {
    // Initialize visual effects
    if (typeof Effects !== 'undefined') {
      Effects.init();
    }

    // Initialize canvas background
    if (typeof Background !== 'undefined') {
      Background.init();
    }

    // Initialize gallery (if gallery section exists)
    if (typeof Gallery !== 'undefined') {
      Gallery.init('#gallery');
    }

    console.log(
      '%c🤖 AI研学社 %c| %cQQ-Style Edition %c| %cAll Systems Ready',
      'color:#00c6ff;font-size:1.3em;font-weight:bold;',
      'color:#8b5cf6;',
      'color:#00ffc8;font-weight:bold;',
      'color:#8b5cf6;',
      'color:#a0a0c0;'
    );
    console.log('%c✨ 欢迎有志于AI的同学加入我们！', 'color:#ff3c78;font-size:1.05em;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
