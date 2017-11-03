/*globals handleError*/

'use strict';

let background;

browser.runtime.getBackgroundPage().then(p => background = p).then(() => {
    new Vue({
        el: '#setting-panel',
        data: {
            activePanel: 'timers',
        },
        methods: {
            handleTabChange(tab) {
                tab.$children[0].formRefresh && tab.$children[0].formRefresh();
            }
        }
    });
}).catch(handleError);