const { Client, MessageEmbed } = require("discord.js");
const client = new Client();
const {
    prefix,
    apiMeteo: { units, lang },
} = require("./config.json");
const fetch = require("node-fetch");

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "meteo") {
        if (!args.length) return message.reply(`Veuillez saisir une ville!`);
        const city = args.join(" ");
        let url = new URL(
            `http://api.openweathermap.org/data/2.5/weather?appid=${process.env.appid}&q=${city}&units=${units}&lang=${lang}`
        );
        const meteo = await fetch(url)
            .then((res) => res.json())
            .catch(() => message.reply(`\nErreur d'API`));

        if (!meteo.name)
            return message.reply(`\nError ${meteo.cod}\n${meteo.message}\n`);

        function parseString(value, weekday = false) {
            const localTimeString = new Date(value).toLocaleString("fr-FR", {
                timeZone: "UTC",
                weekday: weekday ? "long" : undefined,
                hour: "numeric",
                minute: "numeric",
            });
            return localTimeString;
        }

        const localTimezone = Math.ceil(meteo.timezone * 1000);
        const localTime = parseString(Date.now() + localTimezone, true);
        const sunrise = parseString(
            Math.ceil(meteo.sys.sunrise * 1000) + localTimezone
        );
        const sunset = parseString(
            Math.ceil(meteo.sys.sunset * 1000) + localTimezone
        );

        let ink = "#113177";
        if (meteo.weather[0].icon.includes("d")) {
            ink = "#3393AD";
        }

        let imgWeather = new URL(
            `http://openweathermap.org/img/wn/${meteo.weather[0].icon}@2x.png`
        );
        const meteoEmbed = new MessageEmbed()
            .setColor(`${ink}`)
            .setTitle(`${parseFloat(meteo.main.temp.toFixed(1))}°C`)
            .setAuthor(`${meteo.name}, ${meteo.sys.country}`)
            .setDescription(
                `${localTime}\n${meteo.weather[0].description}\n\nHumidité : ${
                    meteo.main.humidity
                }%\nVent : ${meteo.wind.speed.toFixed()}%\n\nLever du soleil : ${sunrise}\nCoucher du soleil : ${sunset}`
            )
            .setThumbnail(`${imgWeather}`);
        message.channel.send(meteoEmbed);
    }
});

client.login(process.env.token);
