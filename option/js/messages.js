/*globals background, handleError, i18nMessage*/

Vue.component('messages', {
    template: '#message-tab',
    data: () => ({
        messages: [],
        types: {
            success: i18nMessage.messageListTypeSuccess,
            fail: i18nMessage.messageListTypeFail,
        },
        total: 0,
        page: 1,
        count: 1
    }),
    created() {
        this.formRefresh();
    },
    methods: {
        async formRefresh(manual) {
            try {
                this.total = await background.message.getMessagesCount();
                this.count = background.setting.itemsPerPage;
                let totalPage = Math.ceil(this.total / this.count);
                if (totalPage > 0 && this.page > totalPage) this.page = totalPage;
                this.messages = await background.message.getMessages(this.page, this.count);
                manual && this.$message.success(i18nMessage.messageListRefreshSuccess);
            }
            catch (e) {
                manual && this.$message.error(i18nMessage.messageListRefreshFail);
                handleError(e);
            }
        },
        async setRead(message) {
            message.state = 'read';
            await background.message.updateMessage(message);
        },
        async setAllRead() {
            for (let message of this.messages.filter(item => item.state == 'unread'))
                message.state = 'read';
            let messages = await background.message.getAllMessages();
            for (let message of messages.filter(item => item.state == 'unread'))
                await this.setRead(message);
        },
        async deleteMessage(id) {
            await background.message.deleteMessage(id);
            await this.formRefresh();
        },
        async handlePageChange(page) {
            this.messages = await background.message.getMessages(page, this.count);
        },
        parseTime(time) {
            let date = new Date(time);
            return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}`;
        }
    }
});