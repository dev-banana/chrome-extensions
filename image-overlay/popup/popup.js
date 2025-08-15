const DEFAULTS = {
    enabled: true,
    dataUrl: "",
    opacity: 0.6,
    scale: 1,
    left: 100,
    top: 100,
    clickThrough: true,
    unlocked: false,
    lockPage: false
};

const els = {
    enabled: document.getElementById('enabled'),
    file: document.getElementById('file'),
    opacity: document.getElementById('opacity'),
    opacityOut: document.getElementById('opacityOut'),
    scale: document.getElementById('scale'),
    scaleOut: document.getElementById('scaleOut'),
    left: document.getElementById('left'),
    top: document.getElementById('top'),
    clickThrough: document.getElementById('clickThrough'),
    unlocked: document.getElementById('unlocked'),
    lockPage: document.getElementById('lockPage'),
    reset: document.getElementById('reset'),
    clear: document.getElementById('clear')
};

function syncOutputs() {
    els.opacityOut.textContent = Number(els.opacity.value).toFixed(2);
    els.scaleOut.textContent = Number(els.scale.value).toFixed(2);
}

function load() {
    chrome.storage.local.get(DEFAULTS, (s) => {
        els.enabled.checked = !!s.enabled;
        els.opacity.value = s.opacity;
        els.scale.value = s.scale;
        els.left.value = s.left;
        els.top.value = s.top;
        els.clickThrough.checked = !!s.clickThrough;
        els.unlocked.checked = !!s.unlocked;
        els.lockPage.checked = !!s.lockPage;
        syncOutputs();
    });
}

function setPartial(patch) {
    chrome.storage.local.set(patch);
}

// Handlers
els.enabled.addEventListener('change', () => setPartial({enabled: els.enabled.checked}));
els.opacity.addEventListener('input', () => {
    syncOutputs();
    setPartial({opacity: Number(els.opacity.value)});
});
els.scale.addEventListener('input', () => {
    syncOutputs();
    setPartial({scale: Number(els.scale.value)});
});
els.left.addEventListener('change', () => setPartial({left: Number(els.left.value)}));
els.top.addEventListener('change', () => setPartial({top: Number(els.top.value)}));
els.clickThrough.addEventListener('change', () => setPartial({clickThrough: els.clickThrough.checked}));
els.unlocked.addEventListener('change', () => setPartial({unlocked: els.unlocked.checked}));
els.lockPage.addEventListener('change', () => setPartial({lockPage: els.lockPage.checked}));

els.file.addEventListener('change', async () => {
    const file = els.file.files && els.file.files[0];
    if (!file) return;
    // Attention aux limites de taille de chrome.storage.local (~5 Mo par entrée). On peut compresser si besoin.
    const reader = new FileReader();
    reader.onload = () => {
        const dataUrl = reader.result;
        setPartial({dataUrl});
    };
    reader.readAsDataURL(file);
});

els.reset.addEventListener('click', () => {
    chrome.storage.local.set({...DEFAULTS});
    load();
});

els.clear.addEventListener('click', () => {
    setPartial({dataUrl: ""});
});

load();