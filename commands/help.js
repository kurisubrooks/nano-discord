const _ = require('lodash');
const path = require('path');
const config = require('../config.json');

exports.main = (discord, channel, user, args, messageID) => {
    var message = "";
    var commands = "**Commands:**\n";
    var reacts = "**Reactions:**\n";
    var gifs = "**GIFs:**\n";

    _.forEach(config.commands, (value) => {
        if (!value.hidden) commands += `\`!${value.command}\`: ${value.desc}\n`;
    });

    _.forEach(config.reacts, (value, key) => {
        reacts += `\`!${key}\` `;
    });

    _.forEach(config.gifs, (value, key) => {
        gifs += `\`!${key}\` `;
    });

    message = commands + '\n' + reacts + '\n\n' + gifs;

    discord.sendMessage({
        to: channel,
        message: message
    }, core.delMsg(discord, channel, messageID));

};