const request = require("request");
const path = require("path");
const core = require(path.join(__dirname, "../", "core.js"));
const keychain = require(path.join(__dirname, "../", "keychain.js"));

exports.main = (bot, channel, user, args, id, options) => {
    var url = "https://www.googleapis.com/customsearch/v1?key=" + keychain.google + "&num=1&cx=006735756282586657842:s7i_4ej9amu&q=" + encodeURIComponent(args.join(" "));

    function send_error(text) {
        bot.sendMessage({
            to: channel,
            message: text
        }, core.delMsg(bot, channel, id));
    }

    request(url, function(err, res, body) {
        if (err) {
            send_error(core.error("search", err));
            return;
        } else if (res.statusCode == 200) {
            var data = (typeof data === "object") ? body : JSON.parse(body);

            if (data.searchInformation.totalResults !== "0") {
                var result = data.items[0];
                //var image = (result.pagemap && result.pagemap.cse_thumbnail) ? "\n" + result.pagemap.cse_thumbnail[0].src : "";

                bot.sendMessage({
                    to: channel,
                    message: user + ": **" + result.title + "**\n" + result.snippet + "\n" + decodeURIComponent(result.link)// + image
                }, core.delMsg(bot, channel, id));
            }
        } else if (res.statusCode != 200){
            if (res.statusCode == 403) {
                send_error(core.error("search", "Exceeded Maximum Daily API Call Limit"));
            } else if (res.statusCode == 500) {
                send_error(core.error("search", "Unknown Error Occurred"));
            } else {
                send_error(core.error("search", "Unknown Error Occurred - " + res.statusCode));
            }
        }
    });
};
