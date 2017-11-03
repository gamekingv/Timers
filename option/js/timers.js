/*globals background, handleError, i18nMessage, CodeMirror*/

Vue.component('timers', {
    template: '#timer-tab',
    data: () => ({
        timers: [],
        form: {
            name: '',
            type: '',
            delay: 1,
            timePoint: new Date(),
            interval: 1,
            retry: false,
            retryInterval: 1,
            scripts: ''
        },
        rules: {
            name: [
                { required: true, message: i18nMessage.timerFormNameHint, trigger: 'change' }
            ],
            type: [
                { required: true, message: i18nMessage.timerFormTypeHint, trigger: 'change' }
            ],
            delay: [
                { type: 'integer', trigger: 'change' }
            ],
            timePoint: [
                { type: 'date', message: i18nMessage.timerFormTimePointHint, trigger: 'change' }
            ],
            interval: [
                { type: 'integer', trigger: 'change' }
            ],
            retry: [
                { type: 'boolean', trigger: 'change' }
            ],
            retryInterval: [
                { type: 'integer', trigger: 'change' }
            ],
            scripts: [
                { required: true, message: i18nMessage.timerFormScriptsHint, trigger: 'change' }
            ],
        },
        types: {
            onBoot: i18nMessage.timerFormTypeOnBoot,
            afterBoot: i18nMessage.timerFormTypeAfterBoot,
            daily: i18nMessage.timerFormTypeDaily,
            interval: i18nMessage.timerFormTypeInterval,
            once: i18nMessage.timerFormTypeOnce
        },
        states: {
            success: i18nMessage.timerListStateSuccess,
            fail: i18nMessage.timerListStateFail,
            running: i18nMessage.timerListStateRunning,
            beforeTrigger: i18nMessage.timerListStateBeforeTrigger
        },
        editing: '',
        loading: false,
        dialogFormVisible: false
    }),
    created() {
        background.timer.getAllTimers().then(timers => this.timers = timers).catch(handleError);
    },
    methods: {
        resetForm() {
            this.form.name = '';
            this.form.type = '';
            this.form.delay = 1;
            this.form.timePoint = new Date();
            this.form.interval = 1;
            this.form.retry = false;
            this.form.retryInterval = 1;
            this.form.scripts = '';
            this.editing = '';
        },
        submitForm() {
            this.$refs.form.validate(async (valid) => {
                if (valid) {
                    this.loading = true;
                    try {
                        if (this.editing) {
                            const id = await background.timer.updateTimer(Object.assign({ id: this.editing, enable: true }, this.form), true);
                            this.timers.splice(this.timers.findIndex(item => item.id == this.editing), 1,
                                await background.timer.getTimer(id));
                            this.editing = '';
                        } else {
                            const id = await background.timer.addTimer(this.form);
                            this.timers.push(await background.timer.getTimer(id));
                        }
                    }
                    catch (e) { handleError(e); }
                    this.dialogFormVisible = false;
                    this.loading = false;
                }
            });
        },
        editTimer(timer) {
            this.form.name = timer.name;
            this.form.type = timer.type;
            this.form.delay = timer.delay;
            this.form.timePoint = timer.timePoint;
            this.form.interval = timer.interval;
            this.form.retry = timer.retry;
            this.form.retryInterval = timer.retryInterval;
            this.form.scripts = timer.scripts;
            this.editing = timer.id;
            this.dialogFormVisible = true;
        },
        async deleteTimer(id) {
            try {
                await background.timer.deleteTimer(id);
                this.timers.splice(this.timers.findIndex(item => item.id == id), 1);
            }
            catch (e) { handleError(e); }
        },
        async formRefresh(manual) {
            try {
                let timers = await background.timer.getAllTimers();
                this.timers = timers;
                manual && this.$message.success(i18nMessage.timerListRefreshSuccess);
            }
            catch (e) {
                manual && this.$message.error(i18nMessage.timerListRefreshFail);
                handleError(e);
            }
        },
        async toggleTimer(id) {
            try {
                await background.timer.toggleTimer(id);
            }
            catch (e) { handleError(e); }
        }
    }
});

Vue.component('code-mirror', {
    template: '#code-mirror',
    props: ['scripts'],
    mounted() {
        this.editor = CodeMirror.fromTextArea(this.$refs.textarea, {
            mode: 'javascript',
            lineNumbers: true,
            theme: 'base16-light',
            indentUnit: 4,
            inputStyle: 'contenteditable'
        });
        this.editor.setOption('extraKeys', {
            Tab: cm => {
                if (cm.somethingSelected()) {
                    cm.indentSelection('add');
                } else {
                    cm.replaceSelection(cm.getOption('indentWithTabs') ? '\t' :
                        Array(cm.getOption('indentUnit') + 1).join(' '), 'end', '+input');
                }
            }
        });
        this.editor.setValue(this.scripts);
        this.editor.on('change', e => {
            this.$emit('update:scripts', e.getValue());
            this.silent = true;
        });
    },
    watch: {
        scripts(newValue) {
            if (!this.silent)
                this.editor.setValue(newValue);
            this.silent = false;
        }
    }
});