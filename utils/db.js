/*globals DB_INFO*/

'use strict';

let database = {
    db: null,
    init() {
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.open(DB_INFO.DB_NAME, DB_INFO.DB_VERSION);
            request.onerror = reject;
            request.onsuccess = e => {
                this.db = e.target.result;
                resolve();
            };
            request.onupgradeneeded = e => {
                let db = e.target.result;
                if (!db.objectStoreNames.contains(DB_INFO.DB_STORE_NAME.TIMER)) {
                    let timerStore = db.createObjectStore(DB_INFO.DB_STORE_NAME.TIMER, { keyPath: 'id' });
                    timerStore.createIndex('id', 'id', { unique: true });
                }
                if (!db.objectStoreNames.contains(DB_INFO.DB_STORE_NAME.MESSAGE)) {
                    let messageStore = db.createObjectStore(DB_INFO.DB_STORE_NAME.MESSAGE, { keyPath: 'id' });
                    messageStore.createIndex('id', 'id', { unique: true });
                    messageStore.createIndex('timer', 'timer');
                    messageStore.createIndex('state', 'state');
                    messageStore.createIndex('stateWithType', ['state', 'type']);
                    messageStore.createIndex('type', 'type');
                }
            };
        });
    },
    startStore(name) {
        let transaction = this.db.transaction([name], 'readwrite');
        transaction.onerror = e => console.error(e);
        return transaction.objectStore(name);
    },
    addTimer(timer) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.TIMER).add(timer);
            request.onerror = reject;
            request.onsuccess = () => resolve(timer);
        });
    },
    getTimer(id) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.TIMER).get(id);
            request.onerror = reject;
            request.onsuccess = e => resolve(e.target.result);
        });
    },
    updateTimer(timer) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.TIMER).put(timer);
            request.onerror = reject;
            request.onsuccess = () => resolve(timer);
        });
    },
    deleteTimer(id) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.TIMER).delete(id);
            request.onerror = reject;
            request.onsuccess = () => resolve();
        });
    },
    getAllTimers() {
        return new Promise((resolve, reject) => {
            let timers = [], request = this.startStore(DB_INFO.DB_STORE_NAME.TIMER).openCursor();
            request.onerror = reject;
            request.onsuccess = e => {
                let cursor = e.target.result;
                if (cursor) {
                    timers.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(timers);
                }
            };
        });
    },
    addMessage(message) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE).add(message);
            request.onerror = reject;
            request.onsuccess = () => resolve(message);
        });
    },
    getMessage(id) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE).get(id);
            request.onerror = reject;
            request.onsuccess = e => resolve(e.target.result);
        });
    },
    updateMessage(message) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE).put(message);
            request.onerror = reject;
            request.onsuccess = () => resolve(message);
        });
    },
    deleteMessage(id) {
        return new Promise((resolve, reject) => {
            let request = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE).delete(id);
            request.onerror = reject;
            request.onsuccess = () => resolve();
        });
    },
    getMessages(page, count, state, type) {
        return new Promise((resolve, reject) => {
            let messages = [], skipped = page == 1,
                store = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE),
                request = state ? store.index(type ? 'stateWithType' : 'state').openCursor(type ? [state, type] : state, 'prev') : store.openCursor(null, 'prev');
            request.onerror = reject;
            request.onsuccess = e => {
                if (messages.length >= count) {
                    return resolve(messages);
                }
                let cursor = e.target.result;
                if (cursor) {
                    if (!skipped) {
                        skipped = true;
                        return cursor.advance((page - 1) * count);
                    }
                    messages.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(messages);
                }
            };
        });
    },
    getAllMessages() {
        return new Promise((resolve, reject) => {
            let messages = [], request = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE).openCursor(null, 'prev');
            request.onerror = reject;
            request.onsuccess = e => {
                let cursor = e.target.result;
                if (cursor) {
                    messages.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(messages);
                }
            };
        });
    },
    getMessagesCount(state, type) {
        return new Promise((resolve, reject) => {
            let store = this.startStore(DB_INFO.DB_STORE_NAME.MESSAGE),
                request = state ? store.index(type ? 'stateWithType' : 'state').count(type ? [state, type] : state) : store.count();
            request.onerror = reject;
            request.onsuccess = e => resolve(e.target.result);
        });
    }
};
