window.OverlayImage.Dom = (() => {

    const el = (tag, options={}) => {
        const {children, events, ...props} = options;
        const node = document.createElement(tag);

        if (props) {
            for (let p in props) {
                if (!props.hasOwnProperty(p)) continue;
                const v = props[p];
                if (p === 'className') node.className = v;
                else if (p === 'text') node.textContent = v;
                else if (p === 'html') node.innerHTML = v;
                else if (p === 'dataset' && v && typeof v === 'object') {
                    for (let dk in v) {
                        if (v.hasOwnProperty(dk)) node.dataset[dk] = String(v[dk]);
                    }
                } else if (p === 'style' && typeof v === 'string') {
                    node.setAttribute('style', v);
                } else if (p !== 'onAction' && p !== 'on') {
                    node.setAttribute(p, v);
                }
            }
        }
        if (children && children.length) {
            for (let i = 0; i < children.length; i++) {
                const c = children[i];
                if (c) node.appendChild(c);
            }
        }

        if (events && events.length) {
            for (let i = 0; i < events.length; i++) {
                const e = events[i];
                const {type, handler} = e;
                if( typeof handler === 'function' ) {
                    node.addEventListener(type, handler);
                }
            }
        }

        return node;
    }

    const div = (options) => el('div', options);
    const span = (options) => el('span', options);
    const label = (options) => el('label', options);
    const text = (options) => el('text', options);
    const a = (options) => el('a', options);
    const input = (options) => el('input', options);
    const button = (options) => el('button', options);
    const img = (options) => el('img', options);



    const badgeRow = (id, label, children=[]) => {
        return div({
            className: 'overlay-row',
            id: id,
            children: [
                span({className: 'overlay-row-label', text: label}),
                ...children
            ]
        })
    }

    const badgeIcon = (icon, options={}) => {
        const {onClick, events,...opts} = options;
        return span({
            className: 'overlay-row-icon',
            children: [document.createTextNode(icon)],
            events: [
                ...(onClick ? [{type: 'click', handler: onClick}] : []),
                ...(events || [])
            ],
            ...opts,
        })
    }

    const badgeValue = (text, options={}) => {
        const {onClick, events,...opts} = options;
        return span({
            className: 'overlay-row-value',
            children: [document.createTextNode(text)],
            events: [
                ...(onClick ? [{type: 'click', handler: onClick}] : []),
                ...(events || [])
            ],
            ...opts,
        })
    }

    const badgeSlider = (value, options={}) => {
        const {onChange, events,...opts} = options;
        return input({
            className: 'overlay-row-slider',
            type: 'range',
            value: value,
            events: [
                ...(onChange ? [{type: 'change', handler: onChange}] : []),
                ...(events || [])
            ],
            ...opts,
        })
    }

    return {
        el,
        div,
        span,
        label,
        text,
        a,
        input,
        button,
        img,

        badgeRow,
        badgeIcon,
        badgeValue,
        badgeSlider,
    };
})();