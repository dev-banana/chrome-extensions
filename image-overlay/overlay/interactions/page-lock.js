window.OverlayImage.Interactions = window.OverlayImage.Interactions || {};
window.OverlayImage.Interactions.PageLock = (() => {

    const DRAG_THRESHOLD = 1; // pixels
    const EVENT_OPTIONS_ACTIVE = {capture: true, passive: false};
    const EVENT_OPTIONS_REMOVE = {capture: true};

    let rootRef = null;
    let isDragBlocked = false;
    let dragStartPos = null;


    const create = (dom) => {
        return {
            domRoot: dom.root,
            overriddenHandlers: null,
        };
    }

    function updatePageLock(isLockedPage, lockState) {
        console.log('updatePageLock', isLockedPage, lockState);

        rootRef = lockState.domRoot;
        if (isLockedPage) {
            console.log('Page lock: Locking page');
            attacheListenersOnce(lockState);
        } else {
            console.log('Page lock: Unlocking page');
            detachListeners(lockState);
        }
    }


    const attacheListenersOnce = (lockState) => {
        console.log("Page lock: Overriding canvas event handlers");

        const canvas = document.querySelector('.maplibregl-canvas');
        if (canvas && !lockState.overriddenHandlers) {
            canvas.addEventListener('pointerdown', blockEvent, EVENT_OPTIONS_ACTIVE);
            canvas.addEventListener('pointermove', blockEvent, EVENT_OPTIONS_ACTIVE);
            // canvas.addEventListener('pointerup', blockEvent, EVENT_OPTIONS_ACTIVE);
            canvas.addEventListener('mousedown', blockEvent, EVENT_OPTIONS_ACTIVE);
            canvas.addEventListener('mousemove', blockEvent, EVENT_OPTIONS_ACTIVE);
            // canvas.addEventListener('mouseup', blockEvent, EVENT_OPTIONS_ACTIVE);

            lockState.overriddenHandlers = {
                _attached: true,
                pointerdown: blockEvent,
                pointermove: blockEvent,
                pointerup: blockEvent,
                mousedown: blockEvent,
                mousemove: blockEvent,
                mouseup: blockEvent,
            };
        }

    }

    // Optional hard teardown (not used for simple ON/OFF)
    const detachListeners = (lockState) => {

        console.log("Page lock: Restoring canvas event handlers");

        const canvas = document.querySelector('.maplibregl-canvas');
        if (canvas && lockState.overriddenHandlers._attached) {
            canvas.removeEventListener('pointerdown', blockEvent, EVENT_OPTIONS_REMOVE);
            canvas.removeEventListener('pointermove', blockEvent, EVENT_OPTIONS_REMOVE);
            // canvas.removeEventListener('pointerup', blockEvent, EVENT_OPTIONS_REMOVE);
            canvas.removeEventListener('mousedown', blockEvent, EVENT_OPTIONS_REMOVE);
            canvas.removeEventListener('mousemove', blockEvent, EVENT_OPTIONS_REMOVE);
            // canvas.removeEventListener('mouseup', blockEvent, EVENT_OPTIONS_REMOVE);
            lockState.overriddenHandlers = null;
        }
    }

    const blockEvent = (e) => {
        // console.log("blockEvent", e)
        e.stopImmediatePropagation();
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    const onPointerDown = (e) => {
        // console.log("onPointerDown")
        if (rootRef.contains(e.target)) return;
        dragStartPos = {x: e.clientX, y: e.clientY};
        isDragBlocked = false;
    };

    const onPointerMove = (e) => {
        // console.log("onPointerMove")
        blockEvent(e);
        if (!dragStartPos) return;
        const dx = Math.abs(e.clientX - dragStartPos.x);
        const dy = Math.abs(e.clientY - dragStartPos.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            isDragBlocked = true;
            return blockEvent(e);
        }
    };

    const onPointerUp = (e) => {
        // console.log("onPointerUp")
        if (isDragBlocked) blockEvent(e);
        dragStartPos = null;
        isDragBlocked = false;
    };

    const onMouseDown = (e) => {
        // console.log("onMouseDown")
        if (rootRef.contains(e.target)) return;
        dragStartPos = {x: e.clientX, y: e.clientY};
        isDragBlocked = false;
    };

    const onMouseMove = (e) => {
        // console.log("onMouseMove")
        blockEvent(e);
        if (!dragStartPos) return;
        const dx = Math.abs(e.clientX - dragStartPos.x);
        const dy = Math.abs(e.clientY - dragStartPos.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            isDragBlocked = true;
            return blockEvent(e);
        }
    };

    const onMouseUp = (e) => {
        // console.log("onMouseUp")
        if (isDragBlocked) blockEvent(e);
        dragStartPos = null;
        isDragBlocked = false;
    };

    const onTouchStart = (e) => {
        // console.log("onTouchStart")
        if (rootRef.contains(e.target)) return;
        const t = e.touches[0];
        if (t) {
            dragStartPos = {x: t.clientX, y: t.clientY};
            isDragBlocked = false;
        }
    };

    const onTouchMove = (e) => {
        // console.log("onTouchMove")
        if (!dragStartPos) return;
        const t = e.touches[0];
        if (!t) return;
        const dx = Math.abs(t.clientX - dragStartPos.x);
        const dy = Math.abs(t.clientY - dragStartPos.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            isDragBlocked = true;
            return blockEvent(e);
        }
    };

    const onTouchEnd = (e) => {
        // console.log("onTouchEnd")
        if (isDragBlocked) blockEvent(e);
        dragStartPos = null;
        isDragBlocked = false;
    };

    const onDragGeneric = (e) => {
        // console.log("onDragGeneric")
        if (rootRef.contains(e.target)) return;
        return blockEvent(e);
    };

    const onWheel = (e) => {
        // console.log("onWheel")
        if (rootRef.contains(e.target)) return;
        // Autoriser zoom overlay (Ctrl+Wheel) quand déverrouillé
        if (e.ctrlKey) return;
        if (e.ctrlKey || e.shiftKey || e.metaKey) {
            return blockEvent(e);
        }
    };

    const onContextMenu = (e) => {
        // console.log("onContextMenu")
        if (rootRef.contains(e.target)) return;
        if (isDragBlocked) return blockEvent(e);
    };

    const panHandler = (e) => {
        // console.log("panHandler")
        return blockEvent(e);
    };


    return {
        updatePageLock,
        detachListeners,
        create,
    };
})();