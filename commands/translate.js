const path = require("path");
const core = require(path.join(__dirname, "../", "core.js"));
const keychain = require(path.join(__dirname, "../", "keychain.js"));
const request = require("request");
const hepburn = require("hepburn");
const xml = require("xml2js");
const xmlp = new xml.Parser();
const qs = require("qs");
const _ = require("lodash");

var langs = {
    //"af": "Afrikaans",
    //"ar": "Arabic",
    //"bg": "Bulgarian",
    //"cs": "Czech",
    //"da": "Danish",
    "de": "German",
    //"el": "Greek",
    "en": "English",
    "es": "Spanish",
    //"fa": "Persian",
    "fi": "Finnish",
    //"fj": "Fijian",
    "fr": "French",
    //"he": "Hebrew",
    //"hi": "Hindi",
    //"hr": "Croatian",
    //"hu": "Hungarian",
    //"hy": "Armenian",
    //"id": "Indonesian",
    //"is": "Icelandic",
    "it": "Italian",
    "ja": "Japanese",
    //"ka": "Georgian",
    "ko": "Korean",
    "la": "Latin",
    //"lo": "Lao",
    //"lt": "Lithuanian",
    //"mi": "Māori",
    //"mk": "Macedonian",
    "ms": "Malay",
    "nl": "Dutch",
    "no": "Norwegian",
    //"pa": "Punjabi",
    "pl": "Polish",
    "pt": "Portuguese",
    //"ro": "Romanian",
    "ru": "Russian",
    //"sk": "Slovak",
    //"sm": "Samoan",
    //"sr": "Serbian",
    "sv": "Swedish",
    //"ta": "Tamil",
    //"th": "Thai",
    //"tl": "Filipino",
    //"to": "Tongan",
    //"tr": "Turkish",
    //"uk": "Ukranian",
    //"vi": "Vietnamese",
    //"cy": "Welsh",
    "zh": "Chinese (Traditional)",
    "zh-cn": "Chinese",
    "zh-tw": "Mandarin (Traditional)"//,
    //"zu": "Zulu"
};

function romaji(input, channel) {
    var options = {
        headers: { "User-Agent": "Mozilla/5.0" },
        url: "http://jlp.yahooapis.jp/FuriganaService/V1/furigana",
        form: {
            appid: keychain.yahoojp,
            sentence: input
        }
    };

    return new Promise((resolve, reject) => {
        request.post(options, function(e, r, b) {
            if (e) reject(e);
            if (b !== undefined) {
                xmlp.parseString(b, function(err, res) {
                    if (err) reject(err);
                    if (res !== undefined) {
                        var output = [];

                        if (res.ResultSet) {
                            try {
                                _.forEach(res.ResultSet.Result[0].WordList[0].Word, (val) => {
                                    if (val.Roman) {
                                        if (val.Roman[0] == " ") return;
                                        output.push(val.Roman[0].replace(/ha/g, "wa"));
                                    } else if (val.Surface) {
                                        if (val.Surface[0] == " ") return;
                                        output.push(val.Surface[0]);
                                    } else return;
                                });
                            } catch(e) {
                                send_error(core.error("translate", e));
                            }
                        } else resolve(["n/a"]);

                        resolve(output);
                    }
                });
            }
        });
    });
}

function check_iso(lang) {
    lang = lang.toLowerCase();
    if (lang in langs) return langs[lang];
    else return "Unknown";
}

exports.main = (bot, channel, user, args, id, options) => {
    function send_error(text) {
        bot.sendMessage({
            to: channel,
            message: text
        });
    }

    if (args[0] == "help") {
        var results = "";
        var count = 0;

        _.forEach(langs, (value, key) => {
            ++count;
            results += `\`${value}[${key}]\`, `;
            //if (count == 5 || count == 10 || count == 15 || count == 20 || count == 25) results += "\n";
        });

        bot.sendMessage({
            to: channel,
            message: user + ": \n**Syntax:** " + "`!translate {to[,from]} {query}`\n\n" + "**Languages:** " + results
        });

        return;
    }

    var lang = args[0].split(",");
    var tolang = (lang[0] == "zh") ? "zh-TW" : lang[0];
    var frlang = lang.length > 1 ? lang[1] : "auto";
    var translate = args.slice(1)
                        .join(" ")
                        .replace(/。/g, ". ")
                        .replace(/、/g, ", ")
                        .replace(/？/g, "? ")
                        .replace(/！/g, "! ")
                        .replace(/「/g, "\"")
                        .replace(/」/g, "\" ")
                        .replace(/　/g, " ");

    var fetch = {
        headers: { "User-Agent": "Mozilla/5.0" },
        url: keychain.translate + qs.stringify({
            dt: "t", // data type
            client: "gtx", // client type
            sl: frlang, // from language
            tl: tolang, // to language
            q: translate // query
        })
    };

    request.get(fetch, (err, res, body) => {
        if (err) {
            send_error(core.error("translate", err));
            return;
        } else if (res.statusCode !== 200) {
            send_error(core.error("translate", "Status Code was not 200, saw " + res.statusCode + " instead"));
            return;
        } else if (body.startsWith(",", 1)) {
            console.log(body);
            send_error(core.error("translate", "Malformed Response:\n" + body));
            return;
        } else if (args[0] == " ") {
            send_error(core.error("translate", "Unknown Language"));
            return;
        }

        var response = JSON.parse(body.replace(/\,+/g, ","));
        var translation = response[0][0][0];
        var query       = (typeof response[0][0][1] === "string") ? response[0][0][1] : translate;
        var from_lang   = response[1];
        var to_lang     = tolang;
        var to_roma     = (tolang == "ja") ? translation : query ;

        var from_fancy = check_iso(from_lang);
        var to_fancy   = check_iso(to_lang);
        var other = "";

        if (response[3]) {
            if (response[3][0]) {
                _.forEach(response[3][0], function(value) {
                    other += check_iso(value);
                });
            }
        }

        var format = [`**${from_fancy}:** ${query}`, `**${to_fancy}:** ${translation.firstUpper()}`];

        if (to_lang == "ja" || from_lang == "ja") {
            romaji(to_roma, channel).then((furigana) => {
                var format_roma = `**Romaji:** ${hepburn.cleanRomaji(furigana.join(" ")).toLowerCase().replace(/thi/g, "ti")}`;

                if (from_lang === "ja") format.splice(1, 0, format_roma);
                else if (to_lang === "ja") format.push(format_roma);

                bot.sendMessage({
                    to: channel,
                    message: user + ": \n" + format.join("\n")
                }, core.delMsg(bot, channel, id));
            });
        } else {
            bot.sendMessage({
                to: channel,
                message: user + ": \n" + format.join("\n")
            }, core.delMsg(bot, channel, id));
        }
    });
};
