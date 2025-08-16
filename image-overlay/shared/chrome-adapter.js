window.OverlayImage = window.OverlayImage || {};
window.OverlayImage.Chrome = (function () {

    const getCurrentTabId = (cb) => {
        try {
            chrome.runtime.sendMessage({action: 'getCurrentTab'}, function (resp) {
                if (chrome.runtime.lastError) {
                    console.error('Erreur Chrome.runtime :', chrome.runtime.lastError.message);
                    cb && cb(null);
                    return;
                }

                if (resp && typeof resp.tabId === 'number') {
                    cb(resp.tabId);
                } else {
                    console.warn('TabID non valide:', resp);
                    cb(null);
                }
            });
        } catch (e) {
            console.error('Erreur dans getCurrentTabId:', e);
            cb(null);
        }
    }

    const captureVisibleTab = (cb) => {
        try {
            chrome.runtime.sendMessage({action: 'captureVisibleTab'}, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Erreur capture:', chrome.runtime.lastError.message);
                    cb(null);
                    return;
                }
                cb(response && response.dataUrl ? response.dataUrl : null);
            });
        } catch (e) {
            cb(null);
        }
    }


    const cleanupSubscribers = [];
    const onCleanupRequest = (fn) => {
        if (typeof fn === 'function') cleanupSubscribers.push(fn);
    }

    try {
        chrome.runtime.onMessage.addListener(function (msg) {
            if (msg && msg.action === 'cleanupTab') {
                for (var i = 0; i < cleanupSubscribers.length; i++) {
                    try {
                        cleanupSubscribers[i](msg.removedTabId);
                    } catch (e) {
                    }
                }
            }
        });
    } catch (e) {
    }

    return {
        getCurrentTabId,
        onCleanupRequest,
        captureVisibleTab,
    };
})();