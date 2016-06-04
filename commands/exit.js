const path = require("path");
const core = require(path.join(__dirname, "../", "core.js"));

exports.main = (bot, channel, user, args, id, options) => {
    if (options.masters.indexOf(options.trigger.id) >= 0) {
        bot.sendMessage({
            to: channel,
            message: "Be right back!\nhttp://i.imgur.com/kiKRmYY.gif"
        }, function() {
            core.delMsg(bot, channel, id);
            setTimeout(() => process.exit(0), 1000);
        });
    } else {
        bot.sendMessage({
            to: channel,
            message: core.error("exit", "Insufficient Permissions")
        });
    }
};
