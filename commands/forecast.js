const _ = require("lodash");
const path = require("path");
const request = require("request");
const core = require(path.join(__dirname, "../", "core.js"));
const keychain = require(path.join(__dirname, "../", "keychain.js"));

const util = require("util");

exports.main = (bot, channel, user, args, id, options) => {
    function send_error(text) {
        bot.sendMessage({
            to: channel,
            message: text
        }, core.delMsg(bot, channel, id));
    }

    if (args.length === 0) args = ["penrith", "australia"];
    request.get({url: "https://api.wunderground.com/api/" + keychain.wunderground + "/geolookup/q/" + encodeURIComponent(args.join(" ")) + ".json"}, (error, response) => {
        if (args.length === 0) args = ["penrith", "australia"];

        var body;

        if (error) {
            send_error(core.error("forecast", "error"));
            return;
        } else if (response.statusCode !== 200) {
            send_error(core.error("forecast", "Malformed Request or API Error"));
            return;
        } else {
            try {
                body = JSON.parse(response.body);
            } catch (err) {
                send_error(core.error("forecast", "Couldn't parse response"));
                return;
            }

            if (body.response.error) {
                send_error(core.error("forecast", (body.response.error.description).toUpperLowerCase()));
                return;
            }

            if (body.response.results && body.response.results.length > 1) {
                var places = [];
                _.each(body.response.results, (v) => {
                    var place = v.name === v.city ? "_" + v.name : v.name + ", " + v.city;
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

                send_error(core.error("forecast", "Did you mean:\n" + places.join(", ") + " or " + lastPlace));
                return;
            }

            var location;
            if (body.location.city) location = body.location.city;
            if (body.location.state) location += ", " + body.location.state;
            if (body.location.country_name) location += ", " + body.location.country_name;

            request.get({url: "https://api.wunderground.com/api/" + keychain.wunderground + "/forecast/q/" + encodeURIComponent(args.join(" ")) + ".json"}, (err, res) => {
                if (err) {
                    send_error(core.error("forecast", err));
                    return;
                }

                var body = JSON.parse(res.body);
                if (body.response.error) {
                    send_error(core.error("forecast", (body.response.error.description).toUpperLowerCase()));
                    return;
                }

                var forecast = [];
                _.each(body.forecast.simpleforecast.forecastday, (v) => {
                    forecast.push("**" + v.date.weekday_short + ",** " + v.date.day + " " + v.date.monthname + " " + v.date.year + "\n" +
                    v.date.ampm + " " + v.conditions + ", Min: " + v.low.celsius + "º, Max: " + v.high.celsius + "º");
                });

                var icon = body.forecast.simpleforecast.forecastday[0].icon;

                bot.sendMessage({
                    to: channel,
                    message: "**" + location + "**\n" + forecast.join("\n\n") + "\n\n" + "http://kurisubrooks.com/static/tenki/day/" + image(icon) + ".png"
                }, core.delMsg(bot, channel, id));
            });
        }
    });
};

function image(c) {
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
