(function () {
    function debounce(fn, delay) {
        var t = null;
        return function () {
            var args = arguments;
            if (t) clearTimeout(t);
            t = setTimeout(function () {
                if (typeof fn === "function") {
                    fn.apply(null, args); // Appel direct de la fonction au lieu de `fn.render`
                }
            }, delay);
        };
    }

    function OverlayManager() {
        this.dom = null;
        this.pageLockState = null;
        this.unsubscribe = null;
        this._persistDebounced = debounce(this._persistNow.bind(this), 200);
        this._storageListenerAttached = false;
    }

    OverlayManager.prototype._persistNow = function (fullState) {
        try {
            window.OverlayImage.Storage.saveForCurrentContext(fullState, function () {
            });
        } catch (e) {
        }
    };

    OverlayManager.prototype._applyToDom = function () {
        if (!this.dom) return;

        const state = window.OverlayImage.State.get();

        if(!state.enabled && this.pageLockState) {
            window.OverlayImage.Interactions.PageLock.detachListeners(this.pageLockState);
            return;
        }

        const { render } = window.OverlayImage.View;
        render(this.dom);

        if(state.forceRefresh) {
            window.OverlayImage.State.set({forceRefresh: false});
        }

            console.log('pageLockState', this.pageLockState);
        if(this.pageLockState) {
            window.OverlayImage.Interactions.PageLock.updatePageLock(state.lockPage, this.pageLockState);
        }
    };

    OverlayManager.prototype._attachStorageSync = function () {
        if (this._storageListenerAttached) return;
        this._storageListenerAttached = true;

        const self = this;

        window.OverlayImage.Storage.attachStorageListener(function (nextState) {
            // Met à jour l'état local sans boucle excessive
            window.OverlayImage.State.set(nextState);
            // Mise à jour visuelle immédiate
            self._applyToDom();
        });
    };

    OverlayManager.prototype.init = function () {
        const self = this;

        window.OverlayImage.Storage.loadForCurrentContext(function (config) {
            const initConfig = (config || window.OverlayImage.Constants.DEFAULTS);
            window.OverlayImage.State.set(initConfig);

            if (!document.getElementById('overlay-image-root')) {
                self.dom = window.OverlayImage.View.createOverlayDom();
            } else {
                const root = document.getElementById('overlay-image-root');
                self.dom = {
                    root: root,
                    wrapper: document.getElementById('overlay-image-wrapper'),
                    img: document.getElementById('overlay-image-img'),
                    canvas: document.getElementById('overlay-image-canvas'),
                    badge: document.getElementById('overlay-image-badge')
                };
            }

            if (self.dom && self.dom.wrapper) {
                window.OverlayImage.Interactions.DragZoom.installDragAndZoom({wrapper: self.dom.wrapper});
            }

            setTimeout(() => {
                if(self.dom && !self.pageLockState) {
                    console.log('create pageLockState');
                    self.pageLockState = window.OverlayImage.Interactions.PageLock.create(self.dom);
                    window.OverlayImage.Interactions.PageLock.updatePageLock(initConfig.lockPage, self.pageLockState);
                }
            }, 10)

            self._applyToDom();

            if (self.unsubscribe) {
                try {
                    self.unsubscribe();
                } catch (e) {
                }
            }
            self.unsubscribe = window.OverlayImage.State.subscribe(function (newState, _patch) {
                self._applyToDom();
                self._persistDebounced(newState);
            });

            self._attachStorageSync();

            window.OverlayImage.Storage.cleanup();
        });
    };

    window.OverlayImage.Manager = new OverlayManager();
})();