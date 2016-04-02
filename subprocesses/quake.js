const _ = require("lodash");
const path = require("path");
const crimson = require("crimson");

var latestID = {};
var latestQuake = "";

// kurisubrooks#general
var channel_id = '132368736119291904';

exports.main = (discord, config, botdir) => {
    const core = require(path.join(botdir, "core.js"));
    const keychain = require(path.join(botdir, "keychain.js"));
    const shake = require("socket.io-client")(keychain.shake);

    function post_to_general(text) {
        _.each(discord.servers, (server, serverID) => {
            _.each(server.channels, (channel) => {
                if(channel.name.toLowerCase() === "general") discord.sendMessage({ to: channel_id, message: text });
            });
        });
    }

    shake.on("connect", () => {
        crimson.success("Connected to Shake.");
        post_to_general("Connected to Shake.");
    });

    shake.on("data", data => run(data));

    shake.on("reconnect", () => {
        crimson.warn("Connection to Shake was lost, reconnecting...");
        post_to_general("**Notice**: Connection to Shake was lost, reconnecting...");
    });

    shake.on("disconnect", () => {
        crimson.error("Connection to Shake was lost!");
        post_to_general("**Error**: Connection to Shake was lost!");
    });

    function run(data) {
        data = JSON.parse(data);
        var update = "";

        if (Number(data.situation) === 1) update = "Final";
        else if (Number(data.revision) === 1) update = "Epicenter";
        else update = "#" + (Number(data.revision) - 1);

        var message = `**【！】Earthquake Early Warning【 ${update} 】**\n　ー　${data.epicenter_en}\n　ー　Magnitude: ${data.magnitude}, Seismic: ${data.seismic_en}, Depth: ${data.depth}`;
        if (Number(data.situation) === 1) message += "\nhttps://maps.googleapis.com/maps/api/staticmap?center=" + data.latitude + "," + data.longitude + "&zoom=6&size=350x250&format=png&markers=" + data.latitude + "," + data.longitude + "&maptype=roadmap&style=feature:landscape.natural.terrain|hue:0x00ff09|visibility:off&style=feature:transit.line|visibility:off&style=feature:road.highway|visibility:simplified&style=feature:poi|visibility:off&style=feature:administrative.country|visibility:off&style=feature:road|visibility:off";

        if (latestQuake !== data.earthquake_id) {
            latestQuake = data.earthquake_id;

            discord.sendMessage({
                to: channel_id,
                message: message
            }, (err, res) => {
                if (!err) latestID[channel_id] = res.id;
            });

            /*_.each(discord.servers, (server, serverID) => {
                _.each(server.channels, (channel) => {
                    if (channel.name.toLowerCase() === "general") {
                        discord.sendMessage({
                            to: channel_id,
                            message: message
                        }, (err, res) => {
                            if (!err) latestID[channel_id] = res.id;
                        });
                    }
                });
            });*/
        } else {
            _.each(latestID, (messageID, channel) => 
                discord.editMessage({
                    channel: channel_id,
                    messageID: messageID,
                    message: message
                }, (err, res) => {
                    if (!err) latestID[channel_id] = res.id;
                })
            );
        }
    }
};
