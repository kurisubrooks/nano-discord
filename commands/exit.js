const path = require('path');
const core = require(path.join(__dirname, "../", "core.js"));

exports.main = (discord, channel, user, args, messageID, config) => {
    if (config.masters.indexOf(user) >= 0) {
        discord.sendMessage({
            to: channel,
            message: "Restarting\nhttp://i.imgur.com/kiKRmYY.gif"
        }, () => {
            core.delMsg(discord, channel, messageID);
            setTimeout(() => process.exit(0), 2000);
        });
    }
    else discord.sendMessage({
        to: channel,
        message: 'Only senpai can control me!'
    });
};
