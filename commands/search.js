const http = require('https');
const path = require('path');
const core = require(path.join(__dirname, "../", "core.js"));
const keychain = require(path.join(__dirname, "../", "keychain.js"));

exports.main = (discord, channel, user, args, messageID, config) => {
    try {
        var url = 'https://www.googleapis.com/customsearch/v1?key=' + keychain.google + '&num=1&cx=006735756282586657842:s7i_4ej9amu&q=' + encodeURIComponent(args.join(" "));

        http.get(url, (res) => {
            if (res.statusCode == 200) {
                var data = '';

                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    var result = JSON.parse(data);
                    if (result.searchInformation.totalResults != '0') {
                        var search_user = '<@' + user.name + '>';
                        var search_link = result.items[0].link;
                        var search_snip = result.items[0].snippet;

                        discord.sendMessage({
                            to: channel,
                            message: "**" + result.items[0].title + "**:\n" + result.items[0].link
                        }, core.delMsg(discord, channel, messageID));
                    }

                    else {
                        if (res.statusCode == 403) discord.send({
                            to: channel,
                            message: '**Error:** The search returned no results.'
                        });
                    }
                });
            }

            else if (res.statusCode != 200){
                if (res.statusCode == 403) discord.send({
                    to: channel,
                    message: '**Error**: Exceeded Maximum daily API calls.'
                });
                else if (res.statusCode == 500) discord.send({
                    to: channel,
                    message: '**Error**: An unknown error has occurred.'
                });
                else discord.sendMessage({
                    to: channel,
                    message: '**Error**: Unknown error, #**' + res.statusCode + '**'
                });
            }
        })

        .on('error', (error) => {
            discord.send({
                to: channel,
                message: core.errno + '```' + error + '```'
            });
        });
    }

    catch(error) {
        discord.send({
            to: channel,
            message: core.errno + '```' + error + '```'
        });
    }
};
