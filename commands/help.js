const _ = require("lodash");
const path = require("path");
const config = require("../config.json");
const core = require("../core.js");

exports.main = (bot, channel, user, args, id, options) => {
    var commands = "**Commands:**\n";
    var reacts = "**Reactions:**\n";
    var gifs = "**GIFs:**\n";
    var stickers = "**Stickers:**\n";

    _.forEach(_.sortBy(config.commands, "command"), (value) => {
        if (value.admin && options.masters.indexOf(options.trigger.id) > -1) commands += `\`!${value.command}\`: ${value.desc} **[ADMIN]**\n`;
        else if (!value.admin) commands += `\`!${value.command}\`: ${value.desc}\n`;
    });

    _.forEach(config.reacts, (value, key) => {
        reacts += `\`!${key}\` `;
    });

    _.forEach(config.gifs, (value, key) => {
        gifs += `\`!${key}\` `;
    });

    _.forEach(config.stickers, (value, key) => {
        stickers += `\`!${key}\` `;
    });

    bot.sendMessage({
        to: channel,
        message: commands + "\n" + reacts + "\n\n" + gifs + "\n\n" + stickers
    }, core.delMsg(bot, channel, id));
};
