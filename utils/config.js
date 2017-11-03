'use strict';

const DB_INFO = {
    DB_NAME: 'extension_db',
    DB_VERSION: 1,
    DB_STORE_NAME: {
        TIMER: 'timers',
        MESSAGE: 'messages',
    },
};

let setting = {
    async init() {
        let config = await browser.storage.local.get();
        this.itemsPerPage = config.itemsPerPage || 30;
        this.maxMessages = config.maxMessages || 200;
        this.badgeOnlyFail = config.badgeOnlyFail || false;
        this.itemsShown = config.itemsShown || 10;
    },
    async change(key, value) {
        this[key] = value;
        await browser.storage.local.set({ [key]: value });
    },
    async reset() {
        await browser.storage.local.clear();
        this.init();
    }
};