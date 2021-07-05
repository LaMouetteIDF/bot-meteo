const { Client, MessageEmbed } = require("discord.js");
const fetch = require("node-fetch");
const { prefix } = require("./config.json");
const bot = new Client();
const dotenv = require("dotenv");
dotenv.config();
/* --------------- Function --------------- */
function timeStampMs(timestamp, option) {
    let value = timestamp;
    switch (option) {
        case "hourly":
            value = timestamp * 1000;
            option = {
                timeZone: "UTC",
                hour: "numeric",
            };
            break;
        case "time":
            value = timestamp * 1000;
            option = {
                timeZone: "UTC",
                hour: "numeric",
                minute: "numeric",
            };
            break;
        case "daily":
            value = timestamp * 1000;
            option = {
                timeZone: "UTC",
                weekday: "long",
                day: "numeric",
                month: "long",
            };
            break;
        default:
            option = {
                timeZone: "UTC",
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "numeric",
                year: "numeric",
            };
            break;
    }
    const date = new Date(value).toLocaleString("fr-FR", option);
    if (date === "00 h") {
        return new Date(value).toLocaleString("fr-FR", {
            timeZone: "UTC",
            weekday: "short",
            day: "numeric",
        });
    }
    return date;
}
/* ---------------| Function |--------------- */
/* --------------- Api geo --------------- */
async function callApiGeo(q, appid) {
    const url = new URL(`http://api.openweathermap.org/geo/1.0/direct`);
    const searchParams = {
        appid,
        limit: 1,
        q: q,
    };
    url.search = new URLSearchParams(searchParams).toString();
    const res = await fetch(url).catch((err) => {return err.code;});
    if (res === "ENOTFOUND") return res;
    const status = {
        response: res.ok,
        cod: res.status,
        description: res.statusText,
        apiName: "geo/direct",
    };
    if (!res.ok) {
        const error = {
            status: status
        };
        return error;
    }
    const data = await res.json();
    const d = data[0];
    const geo = {
        name: d.local_names ? d.local_names.fr : d.name,
        country: d.country,
        flag: `http://www.countryflags.io/${d.country.toLowerCase()}/flat/64.png`,
        locat: {
            lat: d.lat,
            lon: d.lon,
        },
        status,
    };
    return geo;
}
/* ---------------| Api geo |--------------- */
/* --------------- Api onecall --------------- */
async function callApiData(locat, appid) {
    const url = new URL(`https://api.openweathermap.org/data/2.5/onecall`);
    const searchParams = {
        appid,
        exclude: "minutely",
        units: "metric",
        lang: "fr",
        lat: locat.lat,
        lon: locat.lon,
    };
    url.search = new URLSearchParams(searchParams).toString();
    const res = await fetch(url).catch((err) => {return err.code;});
    if (res === "ENOTFOUND") return res;
    const status = {
        response: res.ok,
        cod: res.status,
        description: res.statusText,
        apiName: "data/onecall",
    };
    if (!res.ok) {
        const error = {
            status: status
        };
        return error;
    }
    const data = await res.json();
    const d = data;
    const onecall = {
        current: {
            temp: `${parseFloat(d.current.temp.toFixed(1))}°C`,
            temp_max: `${parseFloat(d.daily[0].temp.max.toFixed(1))}°C`,
            temp_min: `${parseFloat(d.daily[0].temp.min.toFixed(1))}°C`,
            description: d.current.weather[0].description,
            icon: d.current.weather[0].icon,
            urlIcon: `http://openweathermap.org/img/wn/${d.current.weather[0].icon}@2x.png`,
            pop: `${(d.hourly[0].pop * 100).toFixed(0)}%`,
            humidity: `${d.current.humidity}%`,
            wind_speed: `${d.current.wind_speed.toFixed()}%`,
            timezone: d.timezone,
            timezone_local: timeStampMs(Date.now() + d.timezone_offset * 1000),
            sunrise: timeStampMs(d.current.sunrise + d.timezone_offset, "time"),
            sunset: timeStampMs(d.current.sunset + d.timezone_offset, "time"),
        },
        hourly: [],
        daily: [],
        status,
    };
    for (let i = 0; i < d.hourly.length; i++) {
        onecall.hourly[i] = {
            temp: `${parseFloat(d.hourly[i].temp.toFixed(1))}°C`,
            description: d.hourly[i].weather[0].description,
            pop: `${(d.hourly[i].pop * 100).toFixed(0)}%`,
            dt: timeStampMs(d.hourly[i].dt + d.timezone_offset, "hourly"),
        };
    }
    for (let i = 0; i < d.daily.length; i++) {
        onecall.daily[i] = {
            max: `${parseFloat(d.daily[i].temp.max.toFixed(1))}°C`,
            min: `${parseFloat(d.daily[i].temp.min.toFixed(1))}°C`,
            description: d.daily[i].weather[0].description,
            pop: `${(d.daily[i].pop * 100).toFixed(0)}%`,
            dt: timeStampMs(d.daily[i].dt + d.timezone_offset, "daily"),
        };
    }
    return onecall;
}
/* ---------------| Api onecall |--------------- */
/* --------------- Bot Discord --------------- */
bot.once("ready", () => {
    console.log(`Bot connecté avec ${bot.user.tag}`);
});
bot.on("message", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    // Commande météo
    if (command === "meteo") {
        const city = args.join(" ");
        if (city === "") return console.log("Champ vide");
        async function callApi(q, appid) {
            const g = await callApiGeo(q, appid);
            if (g === "ENOTFOUND") return console.log(g);
            if (!g.status.response) return console.log(g.status);
            const d = await callApiData(g.locat, appid);
            if (d === "ENOTFOUND") return console.log(d);
            if (!d.status.response) { 
                const err = {
                    geoErr: g.status,
                    dataErr: d.status
                }
                return console.log(err);
            }
            const meteoEmbed = new MessageEmbed()
                .setColor(`${d.current.icon.includes("n") ? '#3F48CC' : '#00A2E8'}`)
                .setTitle(`${d.current.temp}`)
                .setAuthor(`${g.name}, ${g.country}`)
                .setDescription(`${d.current.description}`)
                .setThumbnail(`${d.current.urlIcon}`)
                .addFields(
                    { name: 'Humidité  💦', value: `${d.current.humidity}`, inline: true },
                    { name: 'Vent  💨', value: `${d.current.wind_speed}`, inline: true },
                    { name: 'Précipitations  ☔', value: `${d.current.pop}`, inline: true }
                )
                .addFields(
                    { name: 'Max | Min  🌡', value: `${d.current.temp_max} | ${d.current.temp_min}`, inline: true},
                    { name: 'Lever du soleil  ☀', value: `${d.current.sunrise}`, inline: true},
                    { name: 'Coucher du soleil  🌑', value: `${d.current.sunset}`, inline: true}
                )
                .setFooter(`${d.current.timezone}  ●  ${d.current.timezone_local}`, `${g.flag}`);
            meteoEmbed.addField("\u200b", '🕐 ==== Prévisions heure par heure ==== 🕐', false);
            for (let i = 0; i < 6; i++) {
                meteoEmbed.addField(`${d.hourly[i].dt}`, `${d.hourly[i].temp}  \n${d.hourly[i].description}\n${d.hourly[i].pop}  ☔`, true)
            }
            meteoEmbed.addField("\u200b", '🌥 ==== Prévisions quotidienne ==== 🌥', false)
            for (let i = 0; i < 6; i++) {
                meteoEmbed.addField(`${d.daily[i].dt}`, `${d.daily[i].max} | ${d.daily[i].min}\n${d.daily[i].description}\n${d.daily[i].pop}  ☔`, true)
            }
            meteoEmbed.addField('\u200b', `Fuseau horaire du pays`, false)
            message.channel.send(meteoEmbed);
        }
        callApi(city, process.env.APPID);
    }
})
bot.login(process.env.TOKEN);
/* ---------------| Bot Discord |--------------- */
