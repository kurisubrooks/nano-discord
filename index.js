const _ = require("lodash");
const path = require("path");
const util = require("util");
const Crimson = require("crimson");
const crimson = new Crimson({});
const Discord = require("discord.io");

const core = require(path.join(__dirname, "core.js"));
const keychain = require(path.join(__dirname, "keychain.js"));

const bot = new Discord.Client({
    token: keychain.discordtoken,
    autorun: true
});

const wrongType = (part, command, key) => crimson.fatal("Incorrect type for " + part + " in command " + command + " at key " + key + ".");

// Load Config
try {
    // Define config and bot.
    const config = require(path.join(__dirname, "config.json"));
    if (typeof config.sign !== "string" || typeof config.debug !== "boolean") crimson.fatal("Configuration of 'sign' and/or 'debug' is incorrect.");
    const commands = config.commands;
    if (!(commands instanceof Array)) crimson.fatal("Section `commands` should be an array.");

    _.each(commands, (command, key) => {
        if (typeof command.command !== "string") crimson.fatal("Missing command name ['command'] at key " + key + ".");
        if (typeof command.desc !== "string")   wrongType("description ['desc']", command.command, key);
        if (!(config.masters instanceof Array)) wrongType("masters ['masters']", command.command, key);
        if (!(command.args instanceof Array))   wrongType("alias ['alias']", command.command, key);
        if (!(command.args instanceof Array))   wrongType("arguments ['args']", command.command, key);
        _.each(config.subprocesses, (v, key) => {
            if (typeof v !== "string") wrongType("subprocess ['subprocess']", "subprocesses", key);
            if (v.startsWith(config.sign)) crimson.fatal("Commands cannot start with " + config.sign);
        });
        _.each(command.alias, (v, key) => { if (typeof v !== "string") wrongType("alias ['alias']", command.command, key); });
        _.each(command.args, (v, key) => { if (!(v instanceof Array)) wrongType("arguments ['args']", command.command, key); });
    });

} catch(e) {
    crimson.error("Failed to start. Either config.json is not present, corrupted or missing arguments.");
    crimson.fatal(e);
}

_.each(config.subprocesses, (v) => {
    try {
        var subprocess = require(path.join(__dirname, "subprocesses", v + ".js"));
        subprocess.main(bot, config, __dirname);
    } catch(e) {
        crimson.error("Failed to start subprocess '" + v + "'.");
        crimson.fatal(e);
    }
});

// Initialise Discord
bot.on("ready", function() {
    crimson.success(bot.username + " connected to Discord");
    /*setTimeout(function() {
        console.log(bot.inviteURL);
    }, 2500);*/
});

bot.on("disconnect", bot.connect);

bot.on("message", function(user, userID, channelID, text, event) {
    /*console.log(user, userID, channelID, text);
    console.log(event);*/
    if (bot.id == userID) {
        crimson.info(user + ": [result]");
        return;
    }

    crimson.info(user + ": " + bot.fixMessage(text));

    if (text.startsWith(config.sign)) {
        var args = text.split(" ");
        var command = args.splice(0, 1)[0].toLowerCase();

        if (command.startsWith(config.sign)) command = command.slice(config.sign.length);

        try {
            var matchedAlias = _.map(_.filter(commands, {alias: [command]}), "command");
            var originalCommand = command;
            if (matchedAlias.length > 0) command = matchedAlias[0];
            var matched = _.filter(commands, {command: command});

            if (matched.length > 0) {
                matched = matched[0];

                var supportedArgs = [];
                _.each(matched.args, (v) => supportedArgs.push(v.length));

                if (matched.args.length === 0 || supportedArgs.indexOf(args.length) !== -1) {
                    var module = require(path.join(__dirname, "commands", command + ".js"));
                    module.main(bot, channelID, user, args, event.d.id, {
                        config: config,
                        command: originalCommand,
                        masters: config.masters,
                        trigger: {
                            id: userID,
                            username: user,
                            real_name: user,
                            icon: event.d.author.avatar
                        }
                    });

                    return;
                }
            }
        } catch(e) {
            bot.sendMessage({
                to: channelID,
                message: "Failed to run command `" + command + "`. Here's what Na-nose: ```" + e + "```"
            });
        }
    }

    var reactOrGifMatched = false;

    // For-each every part of the text.
    _.each(text.split(" "), (part) => {
        if (reactOrGifMatched) return false;
        if (part.startsWith(config.sign)) part = part.slice(config.sign.length).toLowerCase();
        else return;

        // Reactions
        if (typeof config.reacts[part] === "string") {
            bot.sendMessage({
                to: channelID,
                message: user + ": " + config.reacts[part]
            });

            if (text === config.sign + part) core.delMsg(bot, channelID, event.d.id);
            reactOrGifMatched = true;
        }

        // GIF Reactions
        else if (typeof config.gifs[part] === "string") {
            bot.sendMessage({
                to: channelID,
                message: user + ": " + config.gifs[part]
            });

            if (text === config.sign + part) core.delMsg(bot, channelID, event.d.id);
            reactOrGifMatched = true;
        }
    });
});
