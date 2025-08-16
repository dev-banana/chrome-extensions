// background.js (à ajouter)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCurrentTab') {
        if (sender && sender.tab) {
            sendResponse({tabId: sender.tab.id});
        } else {
            // Sinon, essayer de trouver l'onglet actif
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    sendResponse({ tabId: tabs[0].id });
                } else {
                    console.warn('No active tab found in the request.');
                    sendResponse({ tabId: null });
                }
            });
        }
    }

    if (request.action === 'captureVisibleTab') {
        // Vérifier que sender.tab existe
        if (!sender.tab) {
            console.error("No active tab found in the request.");
            sendResponse({dataUrl: null});
            return;
        }

        // Essayer de capturer l'onglet actuel
        try {
            chrome.tabs.captureVisibleTab(
                sender.tab.windowId,
                { format: 'png', quality: 90 },
                (dataUrl) => {
                    if (chrome.runtime.lastError) {
                        console.error('Erreur capture:', chrome.runtime.lastError.message);

                        // Essayer une approche alternative avec l'onglet actif
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs && tabs.length > 0) {
                                chrome.tabs.captureVisibleTab(
                                    tabs[0].windowId,
                                    { format: 'png', quality: 90 },
                                    (fallbackDataUrl) => {
                                        if (chrome.runtime.lastError) {
                                            console.error('Erreur capture fallback:', chrome.runtime.lastError.message);
                                            sendResponse({dataUrl: null});
                                        } else {
                                            sendResponse({dataUrl: fallbackDataUrl});
                                        }
                                    }
                                );
                            } else {
                                sendResponse({dataUrl: null});
                            }
                        });
                        return;
                    }
                    sendResponse({dataUrl});
                }
            );
        } catch (error) {
            console.error('Exception lors de la capture:', error);
            sendResponse({dataUrl: null});
        }
    }

    return true;
});


// Nettoyer quand un onglet est fermé
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // Envoyer un message aux content scripts pour nettoyer
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'cleanupTab',
                removedTabId: tabId
            }).catch(() => {
                // Ignorer les erreurs pour les onglets qui ne répondent pas
            });
        });
    });
});