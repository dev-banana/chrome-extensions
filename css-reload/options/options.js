// Saves options to chrome.storage
function save_options() {
    const reloadIframe = document.getElementById('iframes').checked;
    chrome.storage.sync.set({
        reloadIframe: reloadIframe
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value reloadIframe = true.
    chrome.storage.sync.get({
        reloadIframe: true
    }, function(items) {
        document.getElementById('iframes').checked = items.reloadIframe;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);