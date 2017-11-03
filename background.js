/*globals setting, database, timer, message*/

'use strict';

init();

async function init() {
    await setting.init();
    await database.init();
    await timer.init();
    await message.init();
    window.setting = setting;
    window.timer = timer;
    window.message = message;
}
