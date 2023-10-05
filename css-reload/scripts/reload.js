(function() {
    const reloadCss = function(el) {
        if(el.rel.toLowerCase().indexOf('stylesheet') >= 0 && el.href){
            const h = el.href.replace(/(&|%5C?)forceReload=\d+/,""); // get target url for the link element
            el.href = h + (h.indexOf("?") >= 0 ? "&" : "?") + "forceReload="+(new Date().valueOf()); // force the reload by appending current date
        }
    };

    // reload each <link> css elements
    Array.from(document.getElementsByTagName("link")).forEach( el => reloadCss(el) );

    if( reloadIframe ?? true ) {
        // we do the same for each iframe element we found
        Array.from(document.getElementsByTagName("iframe")).forEach( ifr => {
            Array.from(ifr.contentDocument.getElementsByTagName("link")).forEach( el => reloadCss(el) );
        });
    }
})()