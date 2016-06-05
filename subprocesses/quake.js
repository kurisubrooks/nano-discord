const path = require("path");
const _ = require("lodash");
const Crimson = require("crimson");
const crimson = new Crimson({});

var last_id = {};
var last_quake = "";

exports.main = (bot, config, dir) => {
    const core = require(path.join(dir, "core.js"));
    const keychain = require(path.join(dir, "keychain.js"));
    const socket = require("socket.io-client")(keychain.shake);

    //function test(){eew({id:20160605063657,drill:!1,situation:0,revision:1,details:{alarm:!1,announced:"2016/06/05 06:37:16",occurred:"2016/06/05 06:36:36",magnitude:3.6,epicenter:{id:797,en:"Offshore Western Satsuma Peninsula",ja:"\u85a9\u6469\u534a\u5cf6\u897f\u65b9\u6c96"},seismic:{en:"1",ja:"1"},geography:{lat:31.1,"long":129.3,depth:10,offshore:!0}}}),setTimeout(function(){eew({id:20160605063657,drill:!1,situation:0,revision:2,details:{alarm:!1,announced:"2016/06/05 06:37:27",occurred:"2016/06/05 06:36:36",magnitude:3.6,epicenter:{id:797,en:"Offshore Western Satsuma Peninsula",ja:"\u85a9\u6469\u534a\u5cf6\u897f\u65b9\u6c96"},seismic:{en:"1",ja:"1"},geography:{lat:31.1,"long":129.3,depth:10,offshore:!0}}})},2500),setTimeout(function(){eew({id:20160605063657,drill:!1,situation:0,revision:3,details:{alarm:!1,announced:"2016/06/05 06:37:47",occurred:"2016/06/05 06:36:36",magnitude:3.6,epicenter:{id:797,en:"Offshore Western Satsuma Peninsula",ja:"\u85a9\u6469\u534a\u5cf6\u897f\u65b9\u6c96"},seismic:{en:"1",ja:"1"},geography:{lat:31.1,"long":129.3,depth:10,offshore:!0}}})},3e3),setTimeout(function(){eew({id:20160605063657,drill:!1,situation:1,revision:4,details:{alarm:!1,announced:"2016/06/05 06:37:54",occurred:"2016/06/05 06:36:36",magnitude:3.6,epicenter:{id:797,en:"Offshore Western Satsuma Peninsula",ja:"\u85a9\u6469\u534a\u5cf6\u897f\u65b9\u6c96"},seismic:{en:"1",ja:"1"},geography:{lat:31.1,"long":129.3,depth:10,offshore:!0}}})},4e3)}

    var channels = [
        "132368736119291904", // kurisubrooks-#general
        "188512903513505792"  // kaori-#notices
    ];

    var debug = [
        //"164807725966950400", // kurisubrooks-#code
        "188512903513505792"    // kaori-#notices
    ];

    function posdebug(text, type) {
        setTimeout(function() {
            _.each(debug, (channel) => {
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
            });
        }, 1250);
    }

    socket.on("connect", () => socket.emit("open", { version: 2 }));
    socket.on("message", (data) => posdebug("API Message:\n" + JSON.stringify(data)), "e");
    socket.on("auth", (data) => {
        if (data.ok) {
            crimson.success("Shake > Connected");
            posdebug("【:ok_hand:】**Connected to Shake**");
            //setTimeout(test, 2000);
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

        if (data.alarm) {
            title_template = "【:bell:】**Emergency Earthquake Warning**";
            msg_template = `【:point_right:】**${data.details.epicenter.en}**\n【:point_right:】**Magnitude:** ${data.details.magnitude}, **Max. Seismic:** ${data.details.seismic.en}, **Depth:** ${data.details.geography.depth}km\n【:point_right:】@everyone`;
        }  else if (data.situation === 2) {
            title_template = "【:no_bell:】**Earthquake Warning Cancelled**";
            msg_template = `【:point_right:】This warning has been cancelled.`;
        } else {
            title_template = "【:loudspeaker:】**Earthquake Information**";
            msg_template = `【:point_right:】**${data.details.epicenter.en}**\n【:point_right:】**Magnitude:** ${data.details.magnitude}, **Max. Seismic:** ${data.details.seismic.en}, **Depth:** ${data.details.geography.depth}km`;
        }

        if (data.situation === 1) msg_template += `\n\nhttps://maps.googleapis.com/maps/api/staticmap?center=${data.details.geography.lat},${data.details.geography.long}&zoom=6&size=300x240&markers=${data.details.geography.lat},${data.details.geography.long}&style=feature:road%7Cvisibility:off`;

        if (data.situation === 1) {
            update = "Final";
        } else if (data.situation === 2) {
            update = "Cancelled";
        } else {
            update = "#" + data.revision;
        }

        if (last_quake !== data.id) {
            last_quake = data.id;

            _.each(channels, (channel) => {
                bot.sendMessage({
                    to: channel,
                    message: `${title_template} 〈${update}〉\n${msg_template}`
                }, (err, res) => {
                    if (err) posdebug(JSON.stringify(err, null, 4), "e");
                    if (!err) last_id[channel] = res.id;
                    //console.log(last_id);
                });
            });
        } else {
             _.each(last_id, (messageID, channel) => {
                bot.editMessage({
                    channel: channel,
                    messageID: messageID,
                    message: `${title_template} 〈${update}〉\n${msg_template}`
                }, (err, res) => {
                    if (err) posdebug(JSON.stringify(err, null, 4), "e");
                    if (!err) last_id[channel] = res.id;
                    //console.log(last_id);
                });
            });
        }
    }
};
