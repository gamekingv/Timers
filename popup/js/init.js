'use strict';

let i18nMessage = new Proxy({}, {
    get: (target, name) => browser.i18n.getMessage(`popupPage${name.replace(name.charAt(0), name.charAt(0).toUpperCase())}`)
});

document.title = i18nMessage.title;

function handleError(e) {
    console.error(e);
}