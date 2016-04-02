const _ = require("lodash");
const path = require("path");
const crimson = require("crimson");

var latestID = {};
var latestQuake = "";

// kurisubrooks#general
var c_general = '132368736119291904';

exports.main = (discord, config, botdir) => {
    const core = require(path.join(botdir, "core.js"));
    const keychain = require(path.join(botdir, "keychain.js"));
    const shake = require("socket.io-client")(keychain.shake);

    function debug(text) {
        discord.sendMessage({ to: '164807725966950400', message: text });
    }

    shake.on("connect", () => {
        crimson.success("Connected to Shake.");
        debug("**【 √ 】** Connected to Shake.");
    });

    shake.on("data", data => run(data)); 

    shake.on("reconnect", () => {
        crimson.warn("Connection to Shake was lost, reconnecting...");
        debug("**【 ! 】** Connection to Shake was lost, reconnecting...");
    });

    shake.on("disconnect", () => {
        crimson.error("Connection to Shake was lost!");
        debug("**【 ! 】** Connection to Shake was lost!");
    });

    function run(data) {
        data = JSON.parse(data);
        var update = "";

        if (Number(data.situation) === 1) update = "Final";
        else if (Number(data.revision) === 1) update = "Epicenter";
        else update = "#" + (Number(data.revision) - 1);

        var message = `**【！】Earthquake Early Warning【 ${update} 】**\n　ー　${data.epicenter_en}\n　ー　Magnitude: ${data.magnitude}, Seismic: ${data.seismic_en}, Depth: ${data.depth}`;
        if (Number(data.situation) === 1) message += "\nhttps://maps.googleapis.com/maps/api/staticmap?center=" + data.latitude + "," + data.longitude + "&zoom=6&size=350x250&markers=" + data.latitude + "," + data.longitude + "&style=feature:road|visibility:off";

        if (latestQuake !== data.earthquake_id) {
            latestQuake = data.earthquake_id;

            discord.sendMessage({
                to: c_general,
                message: message
            }, (err, res) => {
                if (!err) latestID[c_general] = res.id;
            });
        } else {
            _.each(latestID, (messageID, channel) => 
                discord.editMessage({
                    channel: c_general,
                    messageID: messageID,
                    message: message
                }, (err, res) => {
                    if (!err) latestID[c_general] = res.id;
                })
            );
        }
    }
};
