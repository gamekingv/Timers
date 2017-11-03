/*globals handleError*/

'use strict';

let background;

browser.runtime.getBackgroundPage().then(p => background = p).then(() => {
    new Vue({
        el: '#popup-panel',
        data: {
            messages: [],
            count: background.setting.itemsShown
        },
        created() {
            this.formRefresh();
        },
        methods: {
            async formRefresh() {
                try {
                    this.messages = await background.message.getMessages(1, this.count, 'unread');
                }
                catch (e) {
                    handleError(e);
                }
            },
            async setRead(message) {
                this.messages.splice(this.messages.findIndex(item => item.id == message.id), 1);
                let newMessages = await background.message.getMessages(2, this.count, 'unread');
                if (newMessages.length > 0)
                    this.messages.push(newMessages[0]);
                message.state = 'read';
                await background.message.updateMessage(message);
            },
            async setAllRead() {
                this.messages = [];
                let messages = await background.message.getAllMessages();
                for (let message of messages.filter(item => item.state == 'unread')) {
                    message.state = 'read';
                    await background.message.updateMessage(message);
                }
            },
            async seeMore() {
                await browser.runtime.openOptionsPage();
                window.close();
            },
            parseTime(time) {
                let date = new Date(time);
                return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}`;
            },
        }
    });
}).catch(handleError);