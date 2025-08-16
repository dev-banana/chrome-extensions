// javascript
window.OverlayImage.Interactions = window.OverlayImage.Interactions || {};
window.OverlayImage.Interactions.DragZoom = (function () {

    const ImageUtils = window.OverlayImage.ImageUtils;

    function installDragAndZoom(opts) {
        var wrapper = opts && opts.wrapper;
        if (!wrapper) return;

        var State = window.OverlayImage.State;

        var dragging = false;
        var dragStart = {x: 0, y: 0, left: 0, top: 0};

        function onPointerDown(e) {
            var s = State.get();
            if (!s.enabled) return;
            if (!s.unlocked) return;
            if (!wrapper.contains(e.target)) return;
            dragging = true;
            dragStart = {x: e.clientX, y: e.clientY, left: s.left, top: s.top};
            try {
                e.preventDefault();
            } catch (err) {
            }
        }

        function onPointerMove(e) {
            var s = State.get();
            if (!s.enabled) return;
            if (!dragging) return;
            var dx = e.clientX - dragStart.x;
            var dy = e.clientY - dragStart.y;
            var newLeft = Math.round(dragStart.left + dx);
            var newTop = Math.round(dragStart.top + dy);
            // Mise à jour visuelle immédiate
            wrapper.style.left = newLeft + 'px';
            wrapper.style.top = newTop + 'px';
            // Pas de persistance immédiate: on met à jour l’état pour garder la cohérence visuelle si d’autres modules le lisent
            State.set({left: newLeft, top: newTop});
        }

        function onPointerUp() {
            var s = State.get();
            if (!s.enabled) return;
            if (!dragging) return;
            dragging = false;
        }

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('pointermove', onPointerMove, true);
        document.addEventListener('pointerup', onPointerUp, true);

        document.addEventListener('wheel', function (e) {
            var s = State.get();
            if (!s.enabled) return;
            if (!s.unlocked) return;
            if (!e.ctrlKey) return;
            try {
                e.preventDefault();
            } catch (err) {
            }

            var factor = e.deltaY > 0 ? 0.95 : 1.05;

            if (s.width !== null && s.height !== null) {
                // Mode pixel-perfect : zoomer les dimensions en gardant le ratio
                var newWidth = Math.round(s.width * factor);
                var newHeight = Math.round(s.height * factor);

                // Limiter les dimensions
                if (newWidth >= 1 && newHeight >= 1 && newWidth <= 5000 && newHeight <= 5000) {
                    var newScale = s.scale;
                    newScale = ImageUtils.pixelsToScale(newWidth, newHeight, s.naturalWidth, s.naturalHeight);
                    State.set({width: newWidth, height: newHeight, scale: newScale});
                }
            } else {
                // Mode scale classique
                var newScale2 = +(s.scale * factor).toFixed(3);
                newScale2 = Math.max(0.05, Math.min(20, newScale2));
                State.set({scale: newScale2});
            }
            // Pas d’écriture storage directe: Manager persiste via debounce
        }, {passive: false});
    }

    return {
        installDragAndZoom: installDragAndZoom
    };
})();