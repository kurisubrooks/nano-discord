const request = require("request");
const crimson = require("crimson");
const path = require("path");
const keychain = require(path.join(__dirname, "keychain.js"));

exports.success = '#52C652';
exports.danger = '#E93F3C';
exports.warn = '#F5AD1E';
exports.info = '#52B7D6';
exports.debug = false;
exports.kurisu = 'U0E4ZL97H';
exports.errno = '*Nano.js has encountered an error!* ';

exports.delMsg = function(bot, channel, id) {
    bot.deleteMessage({
        channel: channel,
        messageID: id
    });
};

exports.error = function(module, message) {
    return "**Error:** An error was thrown from " + module + ".js\n\n```" + message.toString() + "```";
};

String.prototype.toUpperLowerCase = function() {
    var string = this.split("");
    string[0] = string[0].toUpperCase();
    return string.join("");
};

String.prototype.firstUpper = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};
