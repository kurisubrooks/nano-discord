const path = require("path");
const request = require("request");
const _ = require("lodash");
const XML = require("xml2js");
const parser = new XML.Parser();

var cache = [];

exports.main = (bot, config, botdir) => {
    const core = require(path.join(botdir, "core.js"));
    const url = "http://www.rfs.nsw.gov.au/feeds/major-Fire-Updates.xml";
    const channel = "188512903513505792"; // kaori-#notices
    const interval = 300000; // 5 minutes

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
                    if (cache.length === 0) cache = response;

                    for (i = 0; i < response.rss.channel[0].item.length; i++) {
                        if (cache.rss.channel[0].item[i].guid[0]._ === response.rss.channel[0].item[i].guid[0]._) return;
                        cache = response;

                        bot.sendMessage({
                            to: channel,
                            message: `【:fire:】**NSW RFS Alert**\n【:point_right:】**${response.rss.channel[0].item[i].title[0]}**\n【:point_right:】${response.rss.channel[0].item[i].description[0]}`
                        });
                    }
                });
            }
        });
    }

    setTimeout(function() {
        setInterval(check, interval);
        check();
    }, 3000);

    check();
};
