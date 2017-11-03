/*globals database, setting*/

'use strict';

let message = {
    async init() {
        this.setBadge();
    },
    async addMessage(message) {
        if (!message) throw message;
        let id = Date.now();
        await database.addMessage(Object.assign({ id: id }, message));
        let count = await this.getMessagesCount();
        if (count > 0 && count > setting.maxMessages) {
            let messages = await this.getMessages(2, setting.maxMessages);
            for (let message of messages)
                await this.deleteMessage(message.id);
        }
        await this.setBadge();
        return id;
    },
    async getMessage(id) {
        if (!id) throw id;
        return await database.getMessage(id);
    },
    async updateMessage(message) {
        if (!message) throw message;
        await database.updateMessage(message);
        await this.setBadge();
        return message.id;
    },
    async deleteMessage(id) {
        if (!id) throw id;
        await database.deleteMessage(id);
        await this.setBadge();
    },
    async getMessages(page, count, state) {
        if (!page || !count || page < 1 || count < 1 || state && state != 'unread') throw [page, count];
        return await database.getMessages(page, count, state, setting.badgeOnlyFail ? 'fail' : null);
    },
    async getAllMessages() {
        return await database.getAllMessages();
    },
    async deleteAllMessages() {
        return await database.deleteAllMessages();
    },
    async getMessagesCount(state) {
        if (state && state != 'unread') throw state;
        return await database.getMessagesCount(state, setting.badgeOnlyFail ? 'fail' : null);
    },
    async setBadge() {
        let count = await this.getMessagesCount('unread');
        await browser.browserAction.setBadgeText({ text: count > 0 ? count < 100 ? count.toString() : '99+' : '' });
    }
};