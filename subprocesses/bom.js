const path = require("path");
const request = require("request");
const XML = require("xml2js");
const parser = new XML.Parser();

exports.main = (bot, config, botdir) => {
    const core = require(path.join(botdir, "core.js"));
    const url = "http://www.bom.gov.au/fwo/IDZ00054.warnings_nsw.xml";
    const channel = "188512903513505792"; // kaori-#notices
    const interval = 5 * 60 * 1000; // 5 * s * ms

    var cache = [];

    function posdebug(text, type) {
        setTimeout(function() {
            if (type === "e") {
                bot.sendMessage({
                    to: channel,
                    message: core.error("quake", text)
                });
            } else {
                bot.sendMessage({
                    to: channel,
                    message: text
                });
            }
        }, 1250);
    }

    function check() {
        request(url, function (err, res, out) {
            if (err) {
                posdebug(err, "e");
            } else if (out === undefined) {
                posdebug("Response:\n" + out + "\n\nStatus Code: " + res.statusCode, "e");
            } else {
                parser.parseString(out, (error, response) => {
                    if (error) posdebug(error, "e");
                    if (response === undefined || res.statusCode !== 200)
                        posdebug("Response:\n" + out + "\n\nStatus Code: " + res.statusCode, "e");
                    for (i = 0; i < response.rss.channel[0].item.length; i++) {
                        var uid = response.rss.channel[0].item[i].guid[0]._;
                        if (cache.indexOf(uid) === -1) {
                            bot.sendMessage({
                                to: channel,
                                message: `【:cloud_lightning:】**NSW Bureau of Meteorology Alert**\n【:point_right:】**${response.rss.channel[0].item[i].title[0]}**\n【:point_right:】${response.rss.channel[0].item[i].link[0]}`
                            });

                            cache.push(uid);
                        }
                    }
                });
            }
        });
    }

    check();
    setInterval(check, interval);
};
