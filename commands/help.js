const _ = require("lodash");
const path = require("path");
const config = require("../config.json");
const core = require("../core.js");

exports.main = (bot, channel, user, args, id, options) => {
    var commands = "**Commands:**\n";
    var reacts = "**Reactions:**\n";
    var gifs = "**GIFs:**\n";

    _.forEach(_.sortBy(config.commands, "command"), (value) => {
    //_.forEach(config.commands, (value) => {
        if (value.admin && options.masters.indexOf(options.trigger.id) > -1) commands += `\`!${value.command}\`: ${value.desc} **[ADMIN]**\n`;
        else if (!value.admin) commands += `\`!${value.command}\`: ${value.desc}\n`;
    });

    //_.forEach(_.sortBy(config.reacts), (value, key) => {
    _.forEach(config.reacts, (value, key) => {
        reacts += `\`!${key}\` `;
    });

    //_.forEach(_.sortBy(config.gifs), (value, key) => {
    _.forEach(config.gifs, (value, key) => {
        gifs += `\`!${key}\` `;
    });

    bot.sendMessage({
        to: channel,
        message: commands + "\n" + reacts + "\n\n" + gifs
    }, core.delMsg(bot, channel, id));
};
