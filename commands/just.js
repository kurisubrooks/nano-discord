const path = require("path");
const core = require(path.join(__dirname, "../", "core.js"));

exports.main = (bot, channel, user, args, id, options) => {
    var text = "#just" + args.join("").toLowerCase() + "things";

    bot.sendMessage({
        to: channel,
        message: user + ": " + text
    }, core.delMsg(bot, channel, id));
};
