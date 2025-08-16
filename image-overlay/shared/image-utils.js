window.OverlayImage.ImageUtils = (() => {

    const SCALE_PRECISION = 1;

    const calculateLinkedSize = (changedField, newValue, naturalWidth, naturalHeight) => {
        if (!naturalWidth || !naturalHeight) return {
            width: null,
            height: null,
            scale: 1
        };

        const ratio = naturalWidth / naturalHeight;

        if (changedField === 'width') {
            return {
                width: newValue,
                height: Math.round(newValue / ratio),
                scale: Number((newValue / naturalWidth).toFixed(SCALE_PRECISION))
            };
        } else if (changedField === 'height') {
            return {
                width: Math.round(newValue * ratio),
                height: newValue,
                scale: Number((newValue / naturalHeight).toFixed(SCALE_PRECISION))
            };
        } else if (changedField === 'scale') {
            return {
                width: Math.round(naturalWidth * newValue),
                height: Math.round(naturalHeight * newValue),
                scale: newValue
            };
        }
        return {};
    }

    const scaleToPixels = (scale, naturalWidth, naturalHeight) => {
        if (!naturalWidth || !naturalHeight) return {
            width: null,
            height: null,
        };

        return {
            width: Math.round(naturalWidth * scale),
            height: Math.round(naturalHeight * scale)
        };
    }

    const pixelsToScale = (width, height, naturalWidth, naturalHeight) => {
        if (!naturalWidth || !naturalHeight || !width) return 1;

        return Number((width / naturalWidth).toFixed(SCALE_PRECISION));
    }

    const getNaturalDimensions = (dataUrl, callback) => {
        if (!dataUrl) {
            callback(null, null);
            return;
        }

        const img = new Image();
        img.onload = () => {
            callback(img.naturalWidth, img.naturalHeight);
        };
        img.onerror = () => {
            callback(null, null);
        };
        img.src = dataUrl;
    }

    const cropImgToRect = (source, boundingRect) => {
        const crop = {
            sx: Math.round(boundingRect.left),
            sy: Math.round(boundingRect.top),
            sw: Math.round(boundingRect.width),
            sh: Math.round(boundingRect.height),
        };

        const maxW = source.width;
        const maxH = source.height;
        crop.sx = Math.max(0, Math.min(crop.sx, Math.max(0, maxW - 1)));
        crop.sy = Math.max(0, Math.min(crop.sy, Math.max(0, maxH - 1)));
        crop.sw = Math.max(1, Math.min(crop.sw, maxW - crop.sx));
        crop.sh = Math.max(1, Math.min(crop.sh, maxH - crop.sy));

        const {sx, sy, sw, sh} = crop;

        const out = document.createElement('canvas');
        out.width = Math.max(1, sw | 0);
        out.height = Math.max(1, sh | 0);
        const ctx = out.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, out.width, out.height);
        return out;
    }

    const takeTabScreenshot = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                window.OverlayImage.Chrome.captureVisibleTab(screenshot => {
                    if (!screenshot) {
                        console.warn('Impossible de capturer la page');
                        resolve(null);
                    }
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d", {willReadFrequently: true});
                    const img = new Image();
                    const pixelRatio = window.devicePixelRatio || 1;

                    img.onload = function () {
                        canvas.width = img.width / pixelRatio;
                        canvas.height = img.height / pixelRatio;
                        context.drawImage(
                            img,
                            0, 0, img.width, img.height,
                            0, 0, canvas.width, canvas.height
                        );
                        resolve(canvas);
                    };
                    img.onerror = function () {
                        console.warn('Erreur lors du chargement de la capture');
                        resolve(null);
                    };
                    img.src = screenshot;
                })
            }, 10)
        });

    }

    const isLoadedImg = async (img) => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) return;
        await new Promise((resolve, reject) => {
            const onLoad = () => {
                cleanup();
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    resolve();
                } else {
                    reject(new Error('Image loaded but has no dimensions'));
                }
            };
            const onError = () => {
                cleanup();
                reject(new Error('Failed to load image'));
            };
            const cleanup = () => {
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
            };
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
            setTimeout(() => {
                cleanup();
                reject();
            }, 5000);
        });
    }


    const applyFilter = (mode, canvas, overlayImg, compareImg, options = {}) => {
        const imgWidth = overlayImg.width;
        const imgHeight = overlayImg.height;
        const cropWidth = compareImg.width;
        const cropHeight = compareImg.height;

        // Draw both images into temporary canvases
        const temp1 = document.createElement("canvas");
        temp1.width = imgWidth;
        temp1.height = imgHeight;
        const ctx1 = temp1.getContext("2d", {willReadFrequently: true});
        ctx1.drawImage(overlayImg, 0, 0, imgWidth, imgHeight);
        const data1 = ctx1.getImageData(0, 0, imgWidth, imgHeight);
        const pixels1 = data1.data;

        const temp2 = document.createElement("canvas");
        temp2.width = cropWidth;
        temp2.height = cropHeight;
        const ctx2 = temp2.getContext("2d", {willReadFrequently: true});
        ctx2.drawImage(compareImg, 0, 0, cropWidth, cropHeight);
        const data2 = ctx2.getImageData(0, 0, cropWidth, cropHeight);
        const pixels2 = data2.data;

        // Output canvas
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctxOut = canvas.getContext("2d", {willReadFrequently: true});
        const dataOut = ctxOut.getImageData(0, 0, cropWidth, cropHeight);
        const pixelsOut = dataOut.data;

        switch (mode) {
            case "diff":
                _filterDiff(pixelsOut, pixels1, pixels2, options);
                break;
            default:
                _filterSimple(pixelsOut, pixels2);
        }

        ctxOut.putImageData(dataOut, 0, 0);
    }

    const _filterSimple = (pixelsOut, pixelsA) => {
        for (let i = 0; i < pixelsOut.length; i += 4) {
            pixelsOut[i] = pixelsA[i]; // R
            pixelsOut[i + 1] = pixelsA[i + 1]; // G
            pixelsOut[i + 2] = pixelsA[i + 2]; // B
            pixelsOut[i + 3] = pixelsA[i + 3]; // A
        }
    }
    const _filterDiff = (pixelsOut, pixelsA, pixelsB, options = {}) => {
        const {
            noDiffColor = {r: 0, g: 0, b: 0, a: 255},
            diffColorDelta = 3,
            diffNeighborRadius = 0,
        } = options;

        const len = pixelsOut.length;

        const matchesAt = (idx) => {
            const dr = Math.abs(pixelsA[idx] - pixelsB[idx]);
            const dg = Math.abs(pixelsA[idx + 1] - pixelsB[idx + 1]);
            const db = Math.abs(pixelsA[idx + 2] - pixelsB[idx + 2]);
            const da = Math.abs(pixelsA[idx + 3] - pixelsB[idx + 3]);
            return (dr <= diffColorDelta && dg <= diffColorDelta && db <= diffColorDelta && da <= diffColorDelta);
        };

        for (let i = 0; i < len; i += 4) {

            const centerMatches = matchesAt(i);
            let treatAsNoDiff = centerMatches;

            if (!centerMatches && diffNeighborRadius > 0) {
                let anyNeighborMatches = false;

                for (let step = 1; step <= diffNeighborRadius; step++) {
                    const left = i - step * 4;
                    const right = i + step * 4;

                    if (left >= 0 && matchesAt(left)) {
                        anyNeighborMatches = true;
                        break;
                    }
                    if (right < len && matchesAt(right)) {
                        anyNeighborMatches = true;
                        break;
                    }
                }

                if (anyNeighborMatches) {
                    treatAsNoDiff = true;
                }
            }

            if (treatAsNoDiff) {
                pixelsOut[i] = noDiffColor.r;
                pixelsOut[i + 1] = noDiffColor.g;
                pixelsOut[i + 2] = noDiffColor.b;
                pixelsOut[i + 3] = noDiffColor.a;
            } else {
                pixelsOut[i] = pixelsA[i];
                pixelsOut[i + 1] = pixelsA[i + 1];
                pixelsOut[i + 2] = pixelsA[i + 2];
                pixelsOut[i + 3] = pixelsA[i + 3];
            }
        }
    }

    const rgbToHex = ({r, g, b}) => {
        return "#" + [r, g, b]
            .map(x => x.toString(16).padStart(2, "0"))
            .join("");
    }

    const hexToRgb = (hex) => {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return {r, g, b};
    }

    return {
        calculateLinkedSize,
        scaleToPixels,
        pixelsToScale,
        getNaturalDimensions,
        takeTabScreenshot,
        cropImgToRect,
        isLoadedImg,
        applyFilter,
        rgbToHex,
        hexToRgb,
    };
})();