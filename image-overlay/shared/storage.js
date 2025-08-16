window.OverlayImage = window.OverlayImage || {};
window.OverlayImage.Storage = (function () {
    const PREFIX = 'overlay:tabConfig_';

    function getStorageKey(tabId) {
        return `${PREFIX}${tabId}`;
    }

    function getCurrentTabId(cb) {
        try {
            if (window.OverlayImage.Chrome && typeof window.OverlayImage.Chrome.getCurrentTabId === 'function') {
                window.OverlayImage.Chrome.getCurrentTabId(function (id) {
                    cb(id || null);
                });
                return;
            }
        } catch (e) {
            console.error('Erreur lors de la récupération du tabId:', e);
        }
        cb(null);
    }

    function loadForCurrentContext(callback) {
        getCurrentTabId((tabId) => {
            if (!tabId) {
                console.warn('Aucun tabId détecté.');
                callback(null); // Retourne `null` si pas de tabId
                return;
            }

            const key = getStorageKey(tabId);
            chrome.storage.local.get([key], (items) => {
                if (chrome.runtime.lastError) {
                    console.error('Erreur lors du chargement de la configuration:', chrome.runtime.lastError.message);
                    callback(null);
                    return;
                }

                const config = items[key] || null;
                callback(config);
            });
        });
    }

    function saveForCurrentContext(data, callback) {
        getCurrentTabId((tabId) => {
            if (!tabId) {
                console.error('Impossible de sauvegarder: aucun tabId détecté.');
                if (callback) callback();
                return;
            }

            const key = getStorageKey(tabId);
            chrome.storage.local.set({[key]: data}, callback);
        });
    }

    function attachStorageListener(onUpdateCallback) {
        getCurrentTabId((tabId) => {
            if (!tabId) {
                console.error("Impossible d'attacher le listener : aucun tabId détecté.");
                return;
            }

            const storageKey = getStorageKey(tabId);

            try {
                chrome.storage.onChanged.addListener(function (changes, areaName) {
                    if (areaName !== 'local') return;
                    if (!changes || !changes[storageKey]) return;

                    const nextState = changes[storageKey].newValue || {};
                    onUpdateCallback(nextState); // Appelle le callback avec les nouvelles données
                });
            } catch (e) {
                console.error("Erreur lors de la configuration du listener de stockage :", e);
            }
        });
    }


    function cleanup(callback) {
        getCurrentTabId((currentTabId) => {
            chrome.storage.local.get(null, (items) => {
                const keysToRemove = Object.keys(items).filter((key) => {
                    // Supprime uniquement les clés qui ne correspondent pas à l'onglet courant
                    return key.startsWith(PREFIX) && !key.includes(currentTabId);
                });

                if (keysToRemove.length > 0) {
                    chrome.storage.local.remove(keysToRemove, () => {
                        if (typeof callback === 'function') callback();
                        console.log('Les clés suivantes ont été nettoyées:', keysToRemove);
                    });
                } else {
                    if (typeof callback === 'function') callback();
                }
            });
        });
    }


    return {
        loadForCurrentContext,
        saveForCurrentContext,
        attachStorageListener,
        cleanup,
    };
})();