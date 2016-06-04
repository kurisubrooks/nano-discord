const path = require("path");
const Crimson = require("crimson");
const crimson = new Crimson({});

last_ts = "";
last_quake = "";

exports.main = (bot, config, dir) => {
    const core = require(path.join(dir, "core.js"));
    const keychain = require(path.join(dir, "keychain.js"));
    const socket = require("socket.io-client")(keychain.shake);

    var general = "132368736119291904"; // #general
    var debug   = "164807725966950400"; // #code

    function posdebug(text, type) {
        setTimeout(function() {
            if (type === "e") {
                bot.sendMessage({
                    to: debug,
                    message: core.error("quake", text)
                });
            } else {
                bot.sendMessage({
                    to: debug,
                    message: text
                });
            }
        }, 1250);
    }

    socket.on("connect", () => socket.emit("open", { version: 2 }));
    socket.on("message", (data) => posdebug("API Message:\n" + JSON.stringify(data)), "e");

    socket.on("auth", (data) => {
        if (data.ok) {
            crimson.success("Shake > Connected");
            posdebug("【:ok_hand:】**Connected to Shake**");
        } else {
            posdebug("API Connection Refused:\n" + data.message, "e");
            crimson.fatal("Shake Connection Refused: " + data.message);
        }
    });

    socket.on("quake.eew", (data) => eew(data));
    socket.on("reconnect", () => crimson.warn("Shake > Reconnecting"));
    socket.on("disconnect", () => {
        crimson.error("Shake > Connection Lost");
        posdebug("【:warning:】**Disconnected from Shake**");
    });

    function eew(data) {
        var update;
        var title_template;
        var msg_template;
            data = (typeof data === "object") ? data : JSON.parse(data);

        // Title Template
        if (data.alarm) {
            // やばい
            title_template = "【:bell:】**Emergency Earthquake Warning**";
            msg_template = `【:point_right:】**${data.details.epicenter.en}**\n【:point_right:】**Magnitude:** ${data.details.magnitude}, **Max. Seismic:** ${data.details.seismic.en}, **Depth:** ${data.details.geography.depth}km\n【:point_right:】@everyone`;
        }  else if (data.situation === 2) {
            // キャンセル
            title_template = "【:no_bell:】**Earthquake Warning Cancelled**";
            msg_template = `【:point_right:】This warning has been cancelled.`;
        } else {
            // ノーマル
            title_template = "【:loudspeaker:】**Earthquake Information**";
            msg_template = `【:point_right:】**${data.details.epicenter.en}**\n【:point_right:】**Magnitude:** ${data.details.magnitude}, **Max. Seismic:** ${data.details.seismic.en}, **Depth:** ${data.details.geography.depth}km`;
        }

        // Map on Final
        if (data.situation === 1) msg_template += `\n\nhttps://maps.googleapis.com/maps/api/staticmap?center=${data.details.geography.lat},${data.details.geography.long}&zoom=6&size=400x300&format=png&markers=${data.details.geography.lat},${data.details.geography.long}&maptype=roadmap&style=feature:landscape.natural.terrain|hue:0x00ff09|visibility:off&style=feature:transit.line|visibility:off&style=feature:road.highway|visibility:simplified&style=feature:poi|visibility:off&style=feature:administrative.country|visibility:off&style=feature:road|visibility:off`;

        // Updates
        if (data.situation === 1) {
            update = "Final";
        } else if (data.situation === 2) {
            update = "Cancelled";
        } else {
            update = "#" + data.revision;
        }

        if (last_quake != data.id) {
            last_quake = data.id;

            bot.sendMessage({
                to: general,
                message: `${title_template} 〈${update}〉\n${msg_template}`
            }, (err, res) => {
                console.log(err);
                console.log(res);
                if (err) posdebug(err, "e");
                if (!err) last_ts = res.id;
            });
        } else {
            setTimeout(function() {
                bot.editMessage({
                    to: general,
                    messageID: last_ts,
                    message: `${title_template} 〈${update}〉\n${msg_template}`
                }, (err, res) => {
                    console.log(err);
                    console.log(res);
                    if (err) posdebug(err, "e");
                    if (!err) last_ts = res.id;
                });
            }, 100);
        }
    }
};
