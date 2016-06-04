const _ = require("lodash");
const path = require("path");
const util = require("util");
const request = require("request");
const moment = require("moment");
const core = require(path.join(__dirname, "../", "core.js"));
const keychain = require(path.join(__dirname, "../", "keychain.js"));

exports.main = (bot, channel, user, args, id, options) => {
    function send_error(text) {
        bot.sendMessage({
            to: channel,
            message: text
        }, core.delMsg(bot, channel, id));
    }

    if (args.length === 0) args = ["penrith", "australia"];
    request.get({url: "https://api.wunderground.com/api/" + keychain.wunderground + "/conditions/q/" + encodeURIComponent(args.join(" ")) + ".json"}, (error, response) => {
        var body;

        if (error) {
            send_error(core.error("weather", error));
            return;
        } else if (response.statusCode !== 200) {
            send_error(core.error("weather", "Malformed Request or API Error"));
            return;
        } else {
            try {
                body = JSON.parse(response.body);
            } catch (err) {
                send_error(core.error("weather", "Couldn\'t parse response"));
                return;
            }

            if (body.response.error) {
                send_error(core.error("weather", (body.response.error.description).toUpperLowerCase()));
                return;
            }

            if (body.response.results && body.response.results.length > 1) {
                var places = [];
                _.each(body.response.results, (v) => {
                    var place = "_";
                    if (v.name === v.city) place += v.name;
                    else place = v.name + ", " + v.city;
                    if (v.state) place += ", " + v.state;
                    if (v.country_name) place += ", " + v.country_name;
                    place += "_";
                    places.push(place);
                });

                var lastPlace = places.pop();
                if (places.length > 2) {
                    var newPlaces = places.slice(0, 2);
                    lastPlace = (places.length - newPlaces.length) + " others";
                    place = newPlaces;
                }

                send_error(core.error("weather", "Did you mean:\n" + places.join(", ") + " or " + lastPlace));
                return;
            }

            var location = body.current_observation.display_location.city + ", " + body.current_observation.display_location.state_name;
            var offset = body.current_observation.local_tz_offset;
            var localtime = moment().utcOffset(offset).format("hh:mm a");
            var icon = body.current_observation.icon.toLowerCase();

            var text = "**" + location + "**\n" + "**Temperature:** " + body.current_observation.temp_c + "º (" + body.current_observation.feelslike_c + "º)\n" +
            "**Condition:** " + body.current_observation.weather + "\n" +
            "**Humidity:** " + body.current_observation.relative_humidity + "\n" +
            "**Wind Speed:** " + body.current_observation.wind_kph + "km/h \n\n" + "http://kurisubrooks.com/static/tenki/" + cycle(offset) + "/" + image(icon, cycle(offset)) + ".png";

            bot.sendMessage({
                to: channel,
                message: text
            }, core.delMsg(bot, channel, id));

            /*slack._apiCall("chat.postMessage", {
                "as_user": true,
                "channel": channel.id,
                "attachments": JSON.stringify([{
                    "author_name": config.trigger.real_name,
                    "author_icon": config.trigger.icon,
                    "color": core.info,
                    "fallback": "Here\'s the weather for " + location,
                    "title": location + " (" + localtime + ")",
                    "thumb_url": "https://kurisubrooks.com/static/tenki/" + cycle(offset) + "/" + image(icon, cycle(offset)) + ".png",
                    "mrkdwn_in": ["text"],
                    "text":
                        "*Temperature:* " + body.current_observation.temp_c + "º (" + body.current_observation.feelslike_c + "º)\n" +
                        "*Condition:* " + body.current_observation.weather + "\n" +
                        "*Humidity:* " + body.current_observation.relative_humidity + "\n" +
                        "*Wind Speed:* " + body.current_observation.wind_kph + "km/h"
                }])
            }, core.delMsg(channel.id, ts));*/
        }
    });
};

function cycle(o) {
    var time = moment().utcOffset(o).format("HH");
    if (time <= 06 || time >= 19) return "night";
    else return "day";
}

function image(c, t) {
    console.log(c);
    switch (c) {
        case "chanceflurries":  return "flurry";
        case "chancerain":      return "rain";
        case "chancesleat":     return "sleet";
        case "chancesnow":      return "snow";
        case "chancetstorms":   return "thunderstorm";
        case "clear":           return "clear";
        case "cloudy":          return "cloudy";
        case "flurries":        return "flurry";
        case "fog":             return "haze";
        case "hazy":            return "haze";
        case "mostlycloudy":    return "mostly_cloudy";
        case "mostlysunny":     return "mostly_sunny";
        case "partlycloudy":    return "partly_cloudy";
        case "partlysunny":     return "partly_sunny";
        case "rain":            return "rain";
        case "sleat":           return "sleet";
        case "snow":            return "snow";
        case "sunny":           return "sunny";
        case "tstorms":         return "thunderstorm";
        case "unknown":         return "unknown";
    }
}
