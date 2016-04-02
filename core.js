const path = require("path");
const request = require("request");
const crimson = require("crimson");
const keychain = require(path.join(__dirname, "keychain.js"));

exports.success = '#52C652';
exports.error = '#E93F3C';
exports.warn = '#F5AD1E';
exports.info = '#52B7D6';
exports.debug = false;
exports.errno = '*Nano has encountered an error!* ';

exports.delMsg = function(discord, channel, id) {
    discord.deleteMessage({
        channel: channel,
        messageID: id
    });
};
