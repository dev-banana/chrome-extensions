(function () {
    'use strict';

    const ImageUtils =  window.OverlayImage.ImageUtils;

    const elements = {};
    let currentConfig = {};
    let isInitializing = false;
    let isSynchronizing = false;

    // Initialisation des éléments DOM
    function initElements() {
        elements.enabled = document.getElementById('enabled');
        elements.file = document.getElementById('file');
        elements.imagePreview = document.getElementById('imagePreview');
        elements.previewImg = document.getElementById('previewImg');
        elements.imageInfo = document.getElementById('imageInfo');
        elements.opacity = document.getElementById('opacity');
        elements.opacityOut = document.getElementById('opacityOut');
        elements.scale = document.getElementById('scale');
        elements.scaleOut = document.getElementById('scaleOut');
        elements.width = document.getElementById('width');
        elements.height = document.getElementById('height');
        elements.rotate = document.getElementById('rotate');
        elements.rotateOut = document.getElementById('rotateOut');
        elements.left = document.getElementById('left');
        elements.top = document.getElementById('top');
        elements.reset = document.getElementById('reset');
        elements.clear = document.getElementById('clear');
        elements.clickThrough = document.getElementById('clickThrough');
        elements.unlocked = document.getElementById('unlocked');
        elements.lockPage = document.getElementById('lockPage');
        elements.displayMode = document.getElementById('displayMode');
        elements.noDiffColor = document.getElementById('noDiffColor');
        elements.noDiffColorA = document.getElementById('noDiffColorA');
        elements.diffColorDelta = document.getElementById('diffColorDelta');
        elements.diffNeighborRadius = document.getElementById('diffNeighborRadius');
    }

    // Met à jour l'interface utilisateur
    function updateUI(config) {
        const DEFAULTS = window.OverlayImage.Constants.DEFAULTS; // Récupération des valeurs par défaut
        isInitializing = true;

        elements.enabled.checked = !!(config.enabled ?? DEFAULTS.enabled);

        // Opacité
        elements.opacity.value = config.opacity ?? DEFAULTS.opacity;
        elements.opacityOut.textContent = ((config.opacity ?? DEFAULTS.opacity) * 100).toFixed(0) + '%';

        // Echelle
        elements.scale.value = config.scale ?? DEFAULTS.scale;
        elements.scaleOut.textContent = ((config.scale ?? DEFAULTS.scale) * 100).toFixed(1) + '%';

        // Largeur / Hauteur
        elements.width.value = config.width ?? DEFAULTS.width;
        elements.height.value = config.height ?? DEFAULTS.height;

        // Rotation
        elements.rotate.value = config.rotate ?? DEFAULTS.rotate;
        elements.rotateOut.textContent = (config.rotate ?? DEFAULTS.rotate) + '°';

        // Position
        elements.left.value = config.left ?? DEFAULTS.left;
        elements.top.value = config.top ?? DEFAULTS.top;

        // Autres options (checkboxes)
        elements.clickThrough.checked = !!(config.clickThrough ?? DEFAULTS.clickThrough);
        elements.unlocked.checked = !!(config.unlocked ?? DEFAULTS.unlocked);
        elements.lockPage.checked = !!(config.lockPage ?? DEFAULTS.lockPage);
        elements.displayMode.checked = (config.displayMode === "color-diff");
        elements.noDiffColor.value = ImageUtils.rgbToHex(config.noDiffColor ?? DEFAULTS.noDiffColor);
        elements.noDiffColorA.value = (config.noDiffColor ?? DEFAULTS.noDiffColor).a;
        elements.diffColorDelta.value = config.diffColorDelta ?? DEFAULTS.diffColorDelta;
        elements.diffNeighborRadius.value = config.diffNeighborRadius ?? DEFAULTS.diffNeighborRadius;



        // Mise à jour de l'aperçu de l'image
        updateImagePreview(config.dataUrl, config.naturalWidth, config.naturalHeight);

        // Application du style pour l'état "enabled"
        document.body.className = config.enabled ? '' : 'disabled';

        isInitializing = false;

    }

    // Aperçu de l'image
    function updateImagePreview(dataUrl, naturalWidth, naturalHeight) {
        if (dataUrl) {
            elements.imagePreview.style.display = 'block';
            elements.previewImg.src = dataUrl;
            elements.imageInfo.textContent = `Dimensions: ${naturalWidth} x ${naturalHeight}`;
        } else {
            elements.imagePreview.style.display = 'none';
            elements.previewImg.src = '';
            elements.imageInfo.textContent = 'No image selected';
        }
    }

    // Sauvegarde et mise à jour unifiées
    function saveAndUpdate(patch) {
        if (isInitializing) return;

        Object.assign(currentConfig, patch);

        // Sauvegarde dans le stockage et mise à jour de l'UI
        window.OverlayImage.Storage.saveForCurrentContext(currentConfig, () => {
            updateUI(currentConfig);
        });
    }

    // Gestion des changements de dimensions (liens scale-width-height)
    function handleDimensionChange(changedField, newValue) {
        if (isSynchronizing || isInitializing) return;

        const naturalWidth = currentConfig.naturalWidth;
        const naturalHeight = currentConfig.naturalHeight;

        if (!naturalWidth || !naturalHeight) return;

        const linked = ImageUtils.calculateLinkedSize(
            changedField,
            newValue,
            naturalWidth,
            naturalHeight
        );

        saveAndUpdate({
            width: linked.width,
            height: linked.height,
            scale: linked.scale,
        });
    }

    // Réinitialisation
    function resetConfig() {
        const defaults = window.OverlayImage.Constants.DEFAULTS;
        const resetConfig = {
            ...defaults,
            enabled: currentConfig.enabled,
            dataUrl: currentConfig.dataUrl,
            naturalWidth: currentConfig.naturalWidth,
            naturalHeight: currentConfig.naturalHeight,
        };

        if (currentConfig.dataUrl && currentConfig.naturalWidth && currentConfig.naturalHeight) {
            const dimensions = ImageUtils.scaleToPixels(
                defaults.scale,
                currentConfig.naturalWidth,
                currentConfig.naturalHeight
            );

            resetConfig.width = dimensions.width;
            resetConfig.height = dimensions.height;
        }

        saveAndUpdate(resetConfig);
    }

    // Suppression de l'image
    function clearImage() {
        const patch = {
            dataUrl: '',
            naturalWidth: null,
            naturalHeight: null,
            width: null,
            height: null,
            scale: 1,
        };

        saveAndUpdate(patch);
        elements.file.value = '';
    }

    // Gestion du fichier image
    function handleFileUpload(file) {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            const dataUrl = e.target.result;

            ImageUtils.getNaturalDimensions(dataUrl, (naturalWidth, naturalHeight) => {
                const dimensions = ImageUtils.scaleToPixels(
                    currentConfig.scale || 1,
                    naturalWidth,
                    naturalHeight
                );

                const patch = {
                    dataUrl,
                    naturalWidth,
                    naturalHeight,
                    width: dimensions.width,
                    height: dimensions.height,
                };

                saveAndUpdate(patch);
            });
        };

        reader.readAsDataURL(file);
    }

    // Ajout des listeners
    function attachEventListeners() {
        elements.enabled.addEventListener('change', function () {
            saveAndUpdate({ enabled: this.checked });
        });

        elements.file.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                handleFileUpload(this.files[0]);
            }
        });

        elements.opacity.addEventListener('input', function () {
            saveAndUpdate({ opacity: parseFloat(this.value) });
        });

        elements.scale.addEventListener('input', function () {
            handleDimensionChange('scale', parseFloat(this.value));
        });

        elements.width.addEventListener('input', function () {
            handleDimensionChange('width', parseInt(this.value, 10));
        });

        elements.height.addEventListener('input', function () {
            handleDimensionChange('height', parseInt(this.value, 10));
        });

        elements.rotate.addEventListener('input', function () {
            saveAndUpdate({ rotate: parseFloat(this.value) });
        });

        elements.left.addEventListener('input', function () {
            saveAndUpdate({ left: parseInt(this.value, 10) || 0 });
        });

        elements.top.addEventListener('input', function () {
            saveAndUpdate({ top: parseInt(this.value, 10) || 0 });
        });

        elements.clickThrough.addEventListener('change', function () {
            saveAndUpdate({ clickThrough: this.checked, ...(this.checked ? { unlocked: false } : {})});
        });

        elements.unlocked.addEventListener('change', function () {
            saveAndUpdate({ unlocked: this.checked });
        });

        elements.lockPage.addEventListener('change', function () {
            saveAndUpdate({ lockPage: this.checked });
        });

        elements.displayMode.addEventListener('change', function () {
            saveAndUpdate({ displayMode: this.checked ? "color-diff" : "image", forceRefresh: this.checked });
        });
        elements.noDiffColor.addEventListener('change', function () {
            const rgb = ImageUtils.hexToRgb(this.value);
            const a = elements.noDiffColorA.value;
            saveAndUpdate({ noDiffColor: {...rgb, a} });
        });
        elements.noDiffColorA.addEventListener('input', function () {
            const rgb = ImageUtils.hexToRgb(elements.noDiffColor.value);
            const a = this.value;
            saveAndUpdate({ noDiffColor: {...rgb, a} });
        });
        elements.diffColorDelta.addEventListener('input', function () {
            saveAndUpdate({ diffColorDelta: parseInt(this.value, 10) || 0 });
        });
        elements.diffNeighborRadius.addEventListener('input', function () {
            saveAndUpdate({ diffNeighborRadius: parseInt(this.value, 10) || 0 });
        });
        elements.reset.addEventListener('click', resetConfig);
        elements.clear.addEventListener('click', clearImage);
    }

    // Chargement initial
    function loadInitialConfig() {
        console.log("load initial config");
        window.OverlayImage.Chrome.getCurrentTabId(function (id) {
            console.log("id", id)
        })
        window.OverlayImage.Chrome.onCleanupRequest(
            function (removedTabId) {
                console.log("cleanup", removedTabId)
                if (currentConfig.tabId === removedTabId) {
                    resetConfig();
                }
            }
        )
        window.OverlayImage.Storage.loadForCurrentContext((config) => {
            console.log("load config", config)
            currentConfig = (config || window.OverlayImage.Constants.DEFAULTS);
            updateUI(currentConfig);
        });
    }

    // Attente des modules
    function waitForModules() {
        let attempts = 0;
        const maxAttempts = 50;

        function check() {
            if (
                window.OverlayImage &&
                window.OverlayImage.Storage &&
                window.OverlayImage.Constants &&
                window.OverlayImage.ImageUtils
            ) {
                loadInitialConfig();
                return;
            }

            if (attempts++ < maxAttempts) {
                setTimeout(check, 10);
            } else {
                console.warn('Popup: modules non chargés.');
            }
        }

        check();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initElements();
        attachEventListeners();
        waitForModules();
    });
})();