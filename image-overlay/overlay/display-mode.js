window.OverlayImage.DisplayMode = (() => {
    const ImageUtils = window.OverlayImage.ImageUtils;


    const applyDisplayMode = (dom, state) => {
        if (!dom || !dom.wrapper || !dom.img || !dom.canvas) return;

        switch (state.displayMode) {
            case "image":
                displayOverlayImage(dom, state);
                break;

            case "color-diff":
                if (state.forceRefresh) {
                    displayColorDiff(dom, state).then(null);
                }
                break;
        }
    }

    const _updateMouseBehaviour = (dom, state) => {
        const {root, wrapper} = dom;

        setTimeout(() => {
            if (state.unlocked) {
                wrapper.classList.add('unlocked');
                wrapper.style.pointerEvents = 'auto';
                root.style.zIndex = '99999999';
            } else {
                wrapper.classList.remove('unlocked');
                if(state.clickThrough) {
                    wrapper.style.pointerEvents = 'none';
                    // root.style.zIndex = '1';
                } else {
                    wrapper.style.pointerEvents = 'auto';
                    root.style.zIndex = '99999999';
                }
            }
        }, 10)
    }

    const _updateImagePosition = (dom, state) => {
        const {wrapper, img} = dom;

        let transform = '';
        if (state.rotate && state.rotate !== 0) {
            transform += 'rotate(' + state.rotate + 'deg) ';
        }

        if (state.width !== null && state.height !== null) {
            img.style.width = state.width + 'px';
            img.style.height = state.height + 'px';
            // const equivalentScale = ImageUtils.pixelsToScale(state.width, state.height, state.naturalWidth, state.naturalHeight);
            // if (Math.abs(equivalentScale - state.scale) > 0.001) {
            //     window.OverlayImage.State.set({scale: equivalentScale});
            // }
        } else {
            img.style.width = 'auto';
            img.style.height = 'auto';
            transform += 'scale(' + state.scale + ')';
        }

        wrapper.style.left = `${state.left | 0}px`;
        wrapper.style.top = `${state.top | 0}px`;

        wrapper.style.transform = transform;
    }

    const _disableWrapper = (dom) => {
        const {wrapper} = dom;
        wrapper.style.display = 'none';
        wrapper.style.pointerEvents = 'none';
    }


    const displayOverlayImage = (dom, state) => {
        const {wrapper, img, canvas} = dom;

        if (!state.dataUrl) {
            _disableWrapper(dom);
            return;
        }
        wrapper.style.display = 'block';

        canvas.style.display = 'none';

        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = String(state.opacity);
        img.src = state.dataUrl;
        _updateImagePosition(dom, state);
        _updateMouseBehaviour(dom, state);
    }


    const displayColorDiff = async (dom, state) => {
        const {root, wrapper, img, canvas} = dom;

        if (!state.dataUrl) {
            _disableWrapper(dom);
            return;
        }
        wrapper.style.display = 'block';

        // 1) Ensure the overlay image is ready
        img.src = state.dataUrl;
        await ImageUtils.isLoadedImg(img);

        img.style.display = 'block';
        img.style.visibility = 'visible';
        img.style.opacity = '1';
        root.style.zIndex = '99999999';
        _updateImagePosition(dom, state);

        // 2) Take Page screenshot
        canvas.style.display = 'none';
        img.style.display = 'none';
        const screenshotCanvas = await ImageUtils.takeTabScreenshot();
        if (!screenshotCanvas) {
            console.warn('Impossible de capturer la page');
            return;
        }
        img.style.display = 'block';

        // 3) Crop the screenshot to wrapper size
        const rect = wrapper.getBoundingClientRect();
        const croppedScreenshot = ImageUtils.cropImgToRect(screenshotCanvas, rect);

        // 4) Draw filter into the DOM canvas (device backing)
        ImageUtils.applyFilter("diff", canvas, img, croppedScreenshot, {
            noDiffColor: state.noDiffColor,
            diffColorDelta: state.diffColorDelta,
            diffNeighborRadius: state.diffNeighborRadius,
        })

        // 6) Present the result
        canvas.style.display = 'block';
        img.style.visibility = 'hidden';
        _updateMouseBehaviour(dom, state);
    }

    return {
        applyDisplayMode,
    };
})();