const { Client, MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const translate = require('@vitalets/google-translate-api');
const { token, prefix, apiMeteo} = require("./config.json")

const client = new Client();

let setCity = apiMeteo.cityDefault;

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === "meteo") {
        let city;
        // if (!args.length) return message.reply(`Veuillez saisir une ville!`);

        if (!args.length) {
            city = setCity;
        } else {
            city = args.join(" ");
        }
        // const city = args.join(" ");
        
        let urlGeo = new URL(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.appid}`)
        const apiGeo = await fetchApi(urlGeo)
        
        let urlOneCall = new URL(`https://api.openweathermap.org/data/2.5/onecall?appid=${process.env.appid}&lat=${apiGeo[0].lat}&lon=${apiGeo[0].lon}&lang=${apiMeteo.lang}&units=${apiMeteo.units}&exclude=minutely`)
        const apiOneCall = await fetchApi(urlOneCall)

        /* const sunrise = parseString(msConv(apiOneCall.daily[1].dt));
        console.log(sunrise); */
        const timezone = msConv(apiOneCall.timezone_offset);

        /* for (let i = 0; i < apiOneCall.daily.length; i++) {
            const date = parseString(msConv(apiOneCall.daily[i].dt) + timezone);
            console.log(date);
        } */

        /* for (let i = 0; i < apiOneCall.hourly.length; i++) {
            const date = parseString(msConv(apiOneCall.hourly[i].dt) + timezone);
            console.log(date);
        } */
        const urlFlag = new URL(`https://flagcdn.com/h20/${apiGeo[0].country.toLowerCase()}.webp`)
        const urlIcon = new URL(`http://openweathermap.org/img/wn/${apiOneCall.current.weather[0].icon}@2x.png`)
        const localTime = parseString(Date.now() + timezone, true);

        const meteoEmbed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${parseFloat(apiOneCall.current.feels_like.toFixed(1))}°C`)
            .setAuthor(`${apiGeo[0].name}, ${apiGeo[0].country}`, `${urlFlag}`)
            .setDescription(`${apiOneCall.current.weather[0].description}`)
            .setThumbnail(`${urlIcon}`)
            .addFields(
                { name: 'Humidité 💦', value: `${apiOneCall.current.humidity}%`, inline: true },
                { name: 'Vent 💨', value: `${apiOneCall.current.wind_speed.toFixed()}%`, inline: true }
            )
            // .addField('Inline field title', 'Some value here', true)
	        .setFooter(`${localTime}`);
        message.channel.send(meteoEmbed)

        /* translate(`${apiOneCall.alerts[0].description}`, {to: 'fr'}).then(res => {
            console.log(res.text);
            message.channel.send(res.text)
            //=> I speak English
            console.log(res.from.language.iso);
            //=> nl
        }).catch(err => {
            console.error(err);
        }); */
        
        
        
        /* if (args[0] === "p") {
        console.log("mdr");
            return
        } */

        /* console.log("toto");
        message.channel.send(`${message.author}`); */

        function fetchApi(url) {
            const api = fetch(url).then((res) => res.json()).catch(() => console.log("erreur"));
            return api;
        }

        function msConv(value) {
            return value * 1000;
        }

        function parseString(value, weekday = false) {
            const localTimeString = new Date(value).toLocaleString("fr-FR", {
                timeZone: "UTC",
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: weekday ? "long" : undefined,
                hour: "numeric",
                minute: "numeric",
            });
            return localTimeString;
        }

    } else if (commandName === "setmeteo") { 
        setCity = args.join(" ");
        message.channel.send("Ville par default ajouté")
    } else if (commandName === "trad") {
        const phrase = args.join(" ");
        // message.channel.send(phrase)
        translate(`${phrase}`, {to: 'fr'}).then(res => {
            console.log(res.text);
            message.channel.send(res.text)
            //=> I speak English
            console.log(res.from.language.iso);
            //=> nl
        }).catch(err => {
            console.error(err);
        });
    } /* else if (commandName === "delete") {
        const amount = args[0];
        message.channel.bulkDelete(amount, true);
    } */
})



client.login(process.env.token);
