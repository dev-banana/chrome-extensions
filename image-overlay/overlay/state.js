// javascript
window.OverlayImage.State = (function () {
  var DEFAULTS = window.OverlayImage.Constants.DEFAULTS;

  // Etat en mémoire (source de vérité)
  var state = {};
  for (var k in DEFAULTS) { if (DEFAULTS.hasOwnProperty(k)) state[k] = DEFAULTS[k]; }

  // Bus d'écouteurs simples
  var listeners = [];

  function notify(patch) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](get(), patch); } catch (e) { /* no-op */ }
    }
  }

  function get() {
    // Retourne une copie superficielle pour éviter les mutations directes
    var copy = {};
    for (var k in state) { if (state.hasOwnProperty(k)) copy[k] = state[k]; }
    return copy;
  }

  function set(patch) {
    if (!patch) return;
    // Appliquer le patch
    for (var k in patch) { if (patch.hasOwnProperty(k)) state[k] = patch[k]; }
    notify(patch);
  }
  function subscribe(fn) {
    if (typeof fn !== 'function') return function () {};
    listeners.push(fn);
    // Retourne une fonction d’unsubscribe
    return function unsubscribe() {
      var idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }

  return {
    state: state,       // Exposé pour compat, préférer get()
    get: get,
    set: set,
    subscribe: subscribe,
    DEFAULTS: DEFAULTS
  };
})();