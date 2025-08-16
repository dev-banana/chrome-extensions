window.OverlayImage.View = (() => {
    const Dom = window.OverlayImage.Dom;

    function createOverlayDom() {
        const img = Dom.img({id: 'overlay-image-img'});
        const canvas = Dom.el('canvas', {id: 'overlay-image-canvas'});
        const badge = Dom.div({id: 'overlay-image-badge'});
        const wrapper = Dom.div({
            id: 'overlay-image-wrapper',
            children: [img, canvas]
        });
        const root = Dom.div({
            id: 'overlay-image-root',
            children: [wrapper, badge]
        });

        document.documentElement.appendChild(root);

        return {root, wrapper, img, canvas, badge};
    }


    function render(dom) {
        const root = dom.root, badge = dom.badge;
        const state = window.OverlayImage.State.get();

        if (!state.enabled) {
            root.style.display = 'none';
            return;
        }

        _renderBadge(badge, state);
        window.OverlayImage.DisplayMode.applyDisplayMode(dom, state);
    }

    function _renderBadge(badge, state) {
        if(!badge) return;

        badge.style.pointerEvents = 'auto';

        badge.innerHTML = '';

        badge.appendChild(Dom.badgeRow('badge-page-state', 'Page :', [
            Dom.badgeIcon(state.lockPage ? '🔒' : '🔓', {
                title: "Toggle drag page lock",
                onClick: () => {
                    window.OverlayImage.State.set({lockPage: !state.lockPage});
                },
            }),
        ]));

        badge.appendChild(Dom.badgeRow('badge-calque-state', 'Overlay :', [
            Dom.badgeValue(state.clickThrough ? 'click-through' : 'interactive', {
                onClick: () => {
                    const newState = !state.clickThrough;
                    window.OverlayImage.State.set({clickThrough: newState, ...(newState ? { unlocked: false } : {})});
                },
            }),
            Dom.badgeIcon(!state.unlocked ? '🔒' : '🔓', {
                title: "Toggle overlay lock",
                onClick: () => {
                    window.OverlayImage.State.set({unlocked: !state.unlocked});
                },
            }),
        ]));

        badge.appendChild(Dom.badgeRow('badge-display-mode', 'Mode :', [
            Dom.badgeIcon((state.displayMode === "color-diff") ? '🎨' : '🖼️', {
                title: "Switch display Mode (color-diff/image)",
                onClick: () => {
                    window.OverlayImage.State.set({displayMode: (state.displayMode === 'image') ? 'color-diff' : 'image', forceRefresh: state.displayMode === 'image'});
                },
            }),
            ...(state.displayMode === "color-diff" ? [
                Dom.badgeIcon('🔄', {
                    title: "Refresh diff",
                    onClick: () => {
                        window.OverlayImage.State.set({forceRefresh: true})
                    },
                }),
            ]:[]),
        ]));

        if(state.displayMode === "image") {
            badge.appendChild(Dom.badgeRow('badge-opacity', 'Opacity :', [
                Dom.badgeSlider(state.opacity, {
                    step: 0.01,
                    min: 0,
                    max: 1,
                    onChange: (e) => {
                        const v = parseFloat(e.target.value);
                        window.OverlayImage.State.set({opacity: v});
                    },
                }),
                Dom.badgeValue((state.opacity * 100).toFixed(0) + '%')
            ]));
        }
    }

    return {
        createOverlayDom,
        render,
    };
})();
