const _ = require("lodash");
const path = require("path");
const request = require("request");
const core = require(path.join(__dirname, "../", "core.js"));
const keychain = require(path.join(__dirname, "../", "keychain.js"));

const util = require("util");

// Do not change this to ES6, does not work then.
String.prototype.toUpperLowerCase = function() {
    var string = this.split("");
    string[0] = string[0].toUpperCase();
    return string.join("");
};

exports.main = (discord, channel, user, args, messageID, config) => {
    request.get({url: "https://api.wunderground.com/api/" + keychain.wunderground + "/geolookup/q/" + encodeURIComponent(args.join(" ")) + ".json"}, (error, response) => {
        if (error) {
            discord.sendMessage({
                to: channel,
                message: "**Error:** Unknown API Error"
            });

            return;
        }

        var body = JSON.parse(response.body);

        if (body.response.error) {
            discord.sendMessage({
                to: channel,
                message: "**Error:** " + (body.response.error.description).toUpperLowerCase() + "."
            });

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

            discord.sendMessage({
                to: channel,
                message: "**Error:** Did you mean " + places.join(", ") + " or " + lastPlace + "."
            });

            return;
        }
        var location;
        if (body.location.city) location = body.location.city;
        if (body.location.state) location += ", " + body.location.state;
        if (body.location.country_name) location += ", " + body.location.country_name;
        request.get({url: "https://api.wunderground.com/api/" + keychain.wunderground + "/forecast/q/" + encodeURIComponent(args.join(" ")) + ".json"}, (error, response) => {
            if (error) {
                discord.sendMessage({
                    to: channel,
                    message: "**Error:** Unknown API Error"
                });

                return;
            }

            var body = JSON.parse(response.body);
            if (body.response.error) {
                discord.sendMessage({
                    to: channel,
                    message: "**Error:** " + (body.response.error.description).toUpperLowerCase() + "."
                });

                return;
            }

            var forecast = [];
            _.each(body.forecast.simpleforecast.forecastday, (v) => {
                forecast.push('＞ ' + v.date.weekday_short + ", " + v.date.day + " " + v.date.monthname + " " + v.date.year + "\n" + v.date.ampm + " " + v.conditions + ", Min: " + v.low.celsius + "º, Max: " + v.high.celsius + "º");
            });

            discord.sendMessage({
                to: channel,
                message: "Here's the forecast for **" + location + "**:\n" + forecast.join("\n\n")
            }, core.delMsg(discord, channel, messageID));
        });
    });
};
