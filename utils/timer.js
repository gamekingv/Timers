/*globals database, message*/

'use strict';

let timer = {
    timers: [],
    async init() {
        let timers = await this.getAllTimers();
        timers.forEach(async timer => await this.setTimer(timer.id));
    },
    async setTimer(id) {
        let timer = await this.getTimer(id), now = Date.now();
        if (!timer.enable) return;
        if (timer.next && timer.next < now) return await this.runScript(timer);
        switch (timer.type) {
            case 'onBoot':
                await this.runScript(timer);
                break;
            case 'afterBoot':
                await this.runDelay(timer);
                break;
            case 'daily':
                await this.runDaily(timer);
                break;
            case 'interval':
                await this.runInterval(timer);
                break;
            case 'once':
                await this.runOnce(timer);
                break;
        }
    },
    async addTimer(timer) {
        if (!timer) throw timer;
        let id = Date.now();
        timer.lastResult = 'beforeTrigger';
        await database.addTimer(Object.assign({ id: id, enable: true }, timer));
        await this.setTimer(id);
        return id;
    },
    async getTimer(id) {
        if (!id) throw id;
        return await database.getTimer(id);
    },
    async updateTimer(timer, isEdit) {
        if (!timer) throw timer;
        if (isEdit) {
            timer.lastResult = 'beforeTrigger';
        }
        await database.updateTimer(timer);
        if (isEdit) {
            this.clearTimer(timer.id);
            await this.setTimer(timer.id);
        }
        return timer.id;
    },
    async deleteTimer(id) {
        if (!id) throw id;
        this.clearTimer(id);
        return await database.deleteTimer(id);
    },
    async getAllTimers() {
        return await database.getAllTimers();
    },
    async deleteAllTimers() {
        return await database.deleteAllTimers();
    },
    clearTimer(id) {
        let index = this.timers.findIndex(item => item.id == id);
        if (index > -1) {
            clearTimeout(this.timers[index].timer);
            this.timers.splice(index, 1);
        }
    },
    async runScript(timer) {
        let script = {
            scripts: timer.scripts,
            isFinished: false
        };
        script.success = this.finish.bind(this, timer.id, script, 'success');
        script.fail = this.finish.bind(this, timer.id, script, 'fail');
        timer.last = Date.now();
        timer.lastResult = 'running';
        timer.next = undefined;
        this.clearTimer(timer.id);
        await this.updateTimer(timer);
        try {
            let timer;
            eval(script.scripts);
        }
        catch (e) { script.fail(e); }
    },
    async runDelay(timer) {
        timer.next = Date.now() + timer.delay * 1000;
        await this.updateTimer(timer);
        this.timers.push({
            id: timer.id,
            timer: setTimeout(() => this.runScript(timer), timer.delay * 1000)
        });
    },
    async runDaily(timer) {
        let now = new Date(), nowValue = now.getTime();
        now.setFullYear(timer.timePoint.getFullYear());
        now.setMonth(timer.timePoint.getMonth());
        now.setDate(timer.timePoint.getDate());
        let diff = timer.timePoint.getTime() - now.getTime();
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        timer.next = nowValue + diff;
        await this.updateTimer(timer);
        this.timers.push({
            id: timer.id,
            timer: setTimeout(() => this.runScript(timer), diff)
        });
    },
    async runInterval(timer) {
        timer.next = Date.now() + timer.interval * 1000;
        await this.updateTimer(timer);
        this.timers.push({
            id: timer.id,
            timer: setTimeout(() => this.runScript(timer), timer.interval * 1000)
        });
    },
    async runOnce(timer) {
        let diff = timer.timePoint.getTime() - Date.now();
        if (diff > 0) {
            timer.next = timer.timePoint.getTime();
            await this.updateTimer(timer);
            this.timers.push({
                id: timer.id,
                timer: setTimeout(() => this.runScript(timer), diff)
            });
        }
        else if (timer.lastResult == 'beforeTrigger')
            this.runScript(timer);
    },
    async retry(id) {
        let timer = await this.getTimer(id);
        timer.next = Date.now() + timer.retryInterval * 1000;
        await this.updateTimer(timer);
        this.timers.push({
            id: id,
            timer: setTimeout(() => this.runScript(timer), timer.retryInterval * 1000)
        });
    },
    async finish(id, script, type, info) {
        if (type != 'success' && type != 'fail' || script.isFinished) return;
        if (typeof info != String)
            if (info.toString)
                info = info.toString();
            else
                info = JSON.stringify(info);
        script.isFinished = true;
        let timer = await this.getTimer(id);
        timer.lastResult = type;
        await this.updateTimer(timer);
        await this.addMessage(type, timer, info);
        if (type == 'fail' && timer.retry)
            await this.retry(timer.id);
        else if (timer.type == 'daily' || timer.type == 'interval')
            await this.setTimer(timer.id);
    },
    async addMessage(type, timer, info) {
        await message.addMessage({
            type: type,
            timerId: timer.id,
            timerName: timer.name,
            info: info,
            state: 'unread'
        });
    },
    async toggleTimer(id) {
        let timer = await this.getTimer(id);
        timer.enable = !timer.enable;
        await this.updateTimer(timer);
        if (timer.enable)
            await this.setTimer(id);
        else
            this.clearTimer(id);
    }
};