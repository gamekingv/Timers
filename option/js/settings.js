/*globals background*/

Vue.component('settings', {
    template: '#setting-tab',
    data: () => ({
        form: {
            itemsPerPage: background.setting.itemsPerPage,
            maxMessages: background.setting.maxMessages,
            badgeOnlyFail: background.setting.badgeOnlyFail,
            itemsShown: background.setting.itemsShown
        },
        rules: {
            itemsPerPage: [
                { type: 'integer', trigger: 'change' }
            ],
            maxMessages: [
                { type: 'integer', trigger: 'change' }
            ],
            itemsShown: [
                { type: 'integer', trigger: 'change' }
            ]
        },
    }),
    methods: {
        async handleChange(key, value) {
            await background.setting.change(key, value);
            key == 'badgeOnlyFail' && background.message.setBadge();
        }
    }
});