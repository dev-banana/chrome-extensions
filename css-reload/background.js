// we create a listener on our extension button
chrome.action.onClicked.addListener((tab) => {

    // for security reason, chrome:// urls are blocked, so we skip them
    if(!tab.url.includes("chrome://")) {

        //load our extension configuration
        chrome.storage.sync.get({reloadIframe: true}, function(options) {

            // little trick to call our script in the current tab with arguments
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                args: [options.reloadIframe],
                function: reloadIframe => Object.assign(self, {reloadIframe}), // we add our arguments in the 'self' scope like globally declared vars
            }, () => chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: ['scripts/reload.js']
            }));
        });
    }
});