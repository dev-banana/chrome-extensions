(() => {
    const DEFAULTS = {
        enabled: true,
        dataUrl: "", // image encodée en data: URL
        opacity: 0.6,
        scale: 1,
        left: 100, // px
        top: 100,  // px
        clickThrough: true, // true => pointer-events: none (clics passants)
        unlocked: false, // si false, pas de drag; si true, on peut déplacer avec la souris
        lockPage: false // bloque le drag de la page (ex: canvas de carte)
    };

    let state = {...DEFAULTS};
    let pageLockEnabled = false;

    const root = document.createElement('div');
    root.id = 'overlay-image-root';

    const wrapper = document.createElement('div');
    wrapper.id = 'overlay-image-wrapper';

    const img = document.createElement('img');
    img.id = 'overlay-image';

    const badge = document.createElement('div');
    badge.id = 'overlay-image-badge';
    badge.textContent = '';

    wrapper.appendChild(img);
    root.appendChild(wrapper);
    root.appendChild(badge);
    document.documentElement.appendChild(root);

    // Variables pour la gestion du page lock
    let pageLockHandlers = null;

    function setupPageLock() {
        if (pageLockHandlers) {
            console.log('Page lock already installed, skipping');
            return; // Déjà configuré, ne pas recréer
        }

        let dragStartPos = null;
        let isDragBlocked = false;
        const DRAG_THRESHOLD = 1; // pixels

        // Fonction pour bloquer complètement un événement
        const blockEvent = (e) => {
            if (!pageLockEnabled) return;
            e.stopImmediatePropagation();
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const onPointerDown = (e) => {
            if (!pageLockEnabled) return;
            // Ignorer si c'est sur notre overlay
            if (root.contains(e.target)) return;

            dragStartPos = { x: e.clientX, y: e.clientY };
            isDragBlocked = false;
        };

        const onPointerMove = (e) => {
            if (!pageLockEnabled) return;
            if (!dragStartPos) return;

            const deltaX = Math.abs(e.clientX - dragStartPos.x);
            const deltaY = Math.abs(e.clientY - dragStartPos.y);

            // Dès qu'on dépasse le seuil, on bloque TOUT
            if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                isDragBlocked = true;
                return blockEvent(e);
            }
        };

        const onPointerUp = (e) => {
            if (!pageLockEnabled) return;
            if (isDragBlocked) {
                blockEvent(e);
            }
            // Reset des variables
            dragStartPos = null;
            isDragBlocked = false;
        };

        // Mouse events - même logique
        const onMouseDown = (e) => {
            if (!pageLockEnabled) return;
            if (root.contains(e.target)) return;
            dragStartPos = { x: e.clientX, y: e.clientY };
            isDragBlocked = false;
        };

        const onMouseMove = (e) => {
            if (!pageLockEnabled) return;
            if (!dragStartPos) return;

            const deltaX = Math.abs(e.clientX - dragStartPos.x);
            const deltaY = Math.abs(e.clientY - dragStartPos.y);

            if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                isDragBlocked = true;
                return blockEvent(e);
            }
        };

        const onMouseUp = (e) => {
            if (!pageLockEnabled) return;
            if (isDragBlocked) {
                blockEvent(e);
            }
            dragStartPos = null;
            isDragBlocked = false;
        };

        // Touch events
        const onTouchStart = (e) => {
            if (!pageLockEnabled) return;
            if (root.contains(e.target)) return;

            const touch = e.touches[0];
            if (touch) {
                dragStartPos = { x: touch.clientX, y: touch.clientY };
                isDragBlocked = false;
            }
        };

        const onTouchMove = (e) => {
            if (!pageLockEnabled) return;
            if (!dragStartPos) return;

            const touch = e.touches[0];
            if (!touch) return;

            const deltaX = Math.abs(touch.clientX - dragStartPos.x);
            const deltaY = Math.abs(touch.clientY - dragStartPos.y);

            if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                isDragBlocked = true;
                return blockEvent(e);
            }
        };

        const onTouchEnd = (e) => {
            if (!pageLockEnabled) return;
            if (isDragBlocked) {
                blockEvent(e);
            }
            dragStartPos = null;
            isDragBlocked = false;
        };

        // Bloquer tous les événements de drag natifs
        const onDragStart = (e) => {
            if (!pageLockEnabled) return;
            if (root.contains(e.target)) return;
            return blockEvent(e);
        };

        const onDrag = (e) => {
            if (!pageLockEnabled) return;
            if (root.contains(e.target)) return;
            return blockEvent(e);
        };

        // Pour les cartes, on doit aussi bloquer wheel avec les modificateurs
        const onWheel = (e) => {
            if (!pageLockEnabled) return;
            if (root.contains(e.target)) return;

            // Si c'est notre zoom de l'overlay, laisser passer
            if (state.unlocked && e.ctrlKey) return;

            // Bloquer les autres wheel events qui pourraient être des zoom de carte
            if (e.ctrlKey || e.shiftKey || e.metaKey) {
                return blockEvent(e);
            }
        };

        // Canvas et événements spécifiques aux cartes
        const onContextMenu = (e) => {
            if (!pageLockEnabled) return;
            if (root.contains(e.target)) return;
            // Bloquer le menu contextuel pendant les drags
            if (isDragBlocked) {
                return blockEvent(e);
            }
        };

        // Attacher TOUS les handlers avec la priorité maximale
        const eventOptions = { capture: true, passive: false };

        // Pointer events
        document.addEventListener('pointerdown', onPointerDown, eventOptions);
        document.addEventListener('pointermove', onPointerMove, eventOptions);
        document.addEventListener('pointerup', onPointerUp, eventOptions);
        document.addEventListener('pointercancel', onPointerUp, eventOptions);

        // Mouse events
        document.addEventListener('mousedown', onMouseDown, eventOptions);
        document.addEventListener('mousemove', onMouseMove, eventOptions);
        document.addEventListener('mouseup', onMouseUp, eventOptions);

        // Touch events
        document.addEventListener('touchstart', onTouchStart, eventOptions);
        document.addEventListener('touchmove', onTouchMove, eventOptions);
        document.addEventListener('touchend', onTouchEnd, eventOptions);
        document.addEventListener('touchcancel', onTouchEnd, eventOptions);

        // Drag events
        document.addEventListener('dragstart', onDragStart, eventOptions);
        document.addEventListener('drag', onDrag, eventOptions);
        document.addEventListener('dragend', onDrag, eventOptions);
        document.addEventListener('dragover', onDrag, eventOptions);
        document.addEventListener('dragenter', onDrag, eventOptions);
        document.addEventListener('dragleave', onDrag, eventOptions);
        document.addEventListener('drop', onDrag, eventOptions);

        // Wheel et context menu
        document.addEventListener('wheel', onWheel, eventOptions);
        document.addEventListener('contextmenu', onContextMenu, eventOptions);

        // Pour les cartes qui utilisent des événements custom
        document.addEventListener('pan', blockEvent, eventOptions);
        document.addEventListener('panstart', blockEvent, eventOptions);
        document.addEventListener('panmove', blockEvent, eventOptions);
        document.addEventListener('panend', blockEvent, eventOptions);

        // Stocker les nouvelles références de handlers
        pageLockHandlers = {
            pointerdown: onPointerDown,
            pointermove: onPointerMove,
            pointerup: onPointerUp,
            pointercancel: onPointerUp,
            mousedown: onMouseDown,
            mousemove: onMouseMove,
            mouseup: onMouseUp,
            touchstart: onTouchStart,
            touchmove: onTouchMove,
            touchend: onTouchEnd,
            touchcancel: onTouchEnd,
            dragstart: onDragStart,
            drag: onDrag,
            dragend: onDrag,
            dragover: onDrag,
            dragenter: onDrag,
            dragleave: onDrag,
            drop: onDrag,
            wheel: onWheel,
            contextmenu: onContextMenu,
            pan: blockEvent,
            panstart: blockEvent,
            panmove: blockEvent,
            panend: blockEvent
        };

        console.log('Page lock handlers installed'); // Debug
    }

    function removePageLock() {
        if (!pageLockHandlers) return;

        const eventOptions = { capture: true };

        try {
            // Supprimer tous les event listeners avec gestion d'erreur
            const events = [
                'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
                'mousedown', 'mousemove', 'mouseup',
                'touchstart', 'touchmove', 'touchend', 'touchcancel',
                'dragstart', 'drag', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop',
                'wheel', 'contextmenu',
                'pan', 'panstart', 'panmove', 'panend'
            ];

            events.forEach(eventType => {
                if (pageLockHandlers[eventType]) {
                    document.removeEventListener(eventType, pageLockHandlers[eventType], eventOptions);
                }
            });

        } catch (error) {
            console.warn('Error removing page lock handlers:', error);
        }

        pageLockHandlers = null;
        console.log('Page lock handlers removed'); // Debug
    }

    function disablePageLock() { pageLockEnabled = false; }


    function applyState() {
        // Affichage global
        root.style.display = state.enabled && state.dataUrl ? 'block' : 'none';

        // --- Gestion des interactions de l'overlay ---
        if (state.clickThrough) {
            // Mode passant : l'overlay n'intercepte rien
            root.style.pointerEvents = 'none';
        } else {
            // Mode interactif : seuls le badge et potentiellement l'image interceptent
            root.style.pointerEvents = 'none'; // Root reste transparent
        }

        // Image
        img.src = state.dataUrl || '';
        img.style.opacity = String(state.opacity);

        // Position et échelle
        wrapper.style.left = state.left + 'px';
        wrapper.style.top = state.top + 'px';
        wrapper.style.transform = `scale(${state.scale})`;

        // Drag mode
        if (state.unlocked) {
            wrapper.classList.add('unlocked');
            wrapper.style.pointerEvents = 'auto';
        } else {
            wrapper.classList.remove('unlocked');
            wrapper.style.pointerEvents = state.clickThrough ? 'none' : 'auto';
        }

        // Badge avec icônes cadenas
        const overlayMode = state.clickThrough ? 'click-through' : 'interactive';
        const overlayLockIcon = state.unlocked ? '🔓' : '🔒';
        const pageLockIcon = state.lockPage ? '🔒' : '🔓';

        badge.innerHTML = `
  <div class="overlay-row" id="badge-calque">
    <span class="overlay-row-label">Overlay :</span>
    <span class="overlay-row-value">${overlayMode}</span>
    <span class="overlay-row-icon" aria-label="${state.unlocked ? 'lock' : 'unlock'}">${overlayLockIcon}</span>
  </div>
  <div class="overlay-row" id="badge-page">
    <span class="overlay-row-label">Page :</span>
    <span class="overlay-row-icon" aria-label="${state.lockPage ? 'unlock page' : 'lock page'}">${pageLockIcon}</span>
  </div>
`;
        badge.style.pointerEvents = 'auto';

        // Gestion des clics sur le badge
        const badgeCalque = badge.querySelector('#badge-calque');
        const badgePage = badge.querySelector('#badge-page');

        if (badgeCalque) {
            badgeCalque.onclick = () => {
                if (state.clickThrough) {
                    // passer de passant -> interactif (clickThrough false)
                    state.clickThrough = false;
                } else if (!state.unlocked) {
                    // interactif -> déverrouillé
                    state.unlocked = true;
                } else {
                    // déverrouillé -> passant
                    state.unlocked = false;
                    state.clickThrough = true;
                }
                chrome.storage.local.set({ clickThrough: state.clickThrough, unlocked: state.unlocked });
                applyState();
            };
        }

        if (badgePage) {
            badgePage.onclick = () => {
                state.lockPage = !state.lockPage;
                chrome.storage.local.set({ lockPage: state.lockPage });
                // Gérer le page lock séparément
                applyPageLockState();

            };
        }

        badge.style.display = state.dataUrl ? 'block' : 'none';
    }

// Nouvelle fonction séparée pour gérer uniquement le page lock
    function applyPageLockState() {
        setupPageLock();
        pageLockEnabled = !!state.lockPage;
    }


    // Chargement initial depuis le storage
    chrome.storage.local.get(DEFAULTS, (stored) => {
        state = {...DEFAULTS, ...stored};
        applyState();
        applyPageLockState(); // Appliquer le page lock séparément
    });


    // Écoute des changements de storage pour MAJ en direct depuis le popup
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        let changed = false;
        let lockPageChanged = false;

        for (const key in changes) {
            if (key in state) {
                state[key] = changes[key].newValue;
                changed = true;

                // Suivre spécifiquement si lockPage a changé
                if (key === 'lockPage') {
                    lockPageChanged = true;
                }
            }
        }

        if (changed) {
            applyState();

            // Appliquer le page lock seulement si cette option a changé
            if (lockPageChanged) {
                applyPageLockState();
            }
        }
    });


    // Gestion du drag quand déverrouillé
    let dragging = false;
    let dragStart = {x: 0, y: 0, left: 0, top: 0};

    function onPointerDown(e) {
        if (!state.unlocked) return;
        if (!wrapper.contains(e.target)) return;
        dragging = true;
        dragStart = {x: e.clientX, y: e.clientY, left: state.left, top: state.top};
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!dragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        state.left = Math.round(dragStart.left + dx);
        state.top = Math.round(dragStart.top + dy);
        applyState();
    }

    function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        // Persiste la nouvelle position
        chrome.storage.local.set({left: state.left, top: state.top});
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerUp, true);

    // Zoom par molette quand déverrouillé (Ctrl+Molette pour éviter conflits)
    document.addEventListener('wheel', (e) => {
        if (!state.unlocked) return;
        if (!e.ctrlKey) return;
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.95 : 1.05;
        let next = +(state.scale * factor).toFixed(3);
        next = Math.max(0.05, Math.min(20, next));
        state.scale = next;
        applyState();
        chrome.storage.local.set({scale: state.scale});
    }, {passive: false});
})();