(function init() {
  function ready() {
    return window.OverlayImage &&
      window.OverlayImage.Storage &&
      window.OverlayImage.Dom &&
      window.OverlayImage.Interactions &&
      window.OverlayImage.State &&
      window.OverlayImage.View &&
      window.OverlayImage.Manager
    ;
  }

  var attempts = 0;
  var max = 200; // 2s

  (function wait() {
    if (ready()) {
      try { window.OverlayImage.Manager.init(); } catch (e) { console.error(e); }
    } else if (attempts++ < max) {
      setTimeout(wait, 10);
    } else {
      console.error('Overlay Image: initialization timeout');
    }
  })();
})();