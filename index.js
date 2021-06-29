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
        if (!args.length) {
            city = setCity;
        } else {
            city = args.join(" ");
        }

        async function callApi(city) {
            const data = await returnApi(city)
            console.log(data)

            const colorEmberd = data.current.icon.includes("n") ?  '#113177' : '#3393AD';
            const meteoEmbed = new MessageEmbed()
            .setColor(`${colorEmberd}`)
            .setTitle(`${data.current.temp}`)
            .setAuthor(`${data.geo.name}, ${data.geo.country}`)
            .setDescription(`${data.current.description}`)
            .setThumbnail(`${data.current.urlIcon}`)
            .addFields(
                { name: 'Humidité  💦', value: `${data.current.humidity}`, inline: true },
                { name: 'Vent  💨', value: `${data.current.wind_speed}`, inline: true },
                { name: 'Précipitations  ☔', value: `${data.current.pop}`, inline: true }
            )
            .addFields(
                { name: 'Max | Min  🌡', value: `${data.current.max} | ${data.current.min}`, inline: true},
                { name: 'Lever du soleil  ☀', value: `${data.current.sunrise}`, inline: true},
                { name: 'Coucher du soleil  🌑', value: `${data.current.sunset}`, inline: true}
            )
            .addField("\u200b", '🕐 ==== Prévisions heure par heure ==== 🕐', false)
            // .addField("🕐 ==== Prévisions heure par heure ==== 🕐", '\u200b', false)
            .addFields(
                { name: `${data.hourly[0].dt}`, value: `${data.hourly[0].temp}  \n${data.hourly[0].description}\n${data.hourly[0].pop}  ☔`, inline: true},
                { name: `${data.hourly[1].dt}`, value: `${data.hourly[1].temp}  \n${data.hourly[1].description}\n${data.hourly[1].pop}  ☔`, inline: true},
                { name: `${data.hourly[2].dt}`, value: `${data.hourly[2].temp}  \n${data.hourly[2].description}\n${data.hourly[2].pop}  ☔`, inline: true},
                { name: `${data.hourly[3].dt}`, value: `${data.hourly[3].temp}  \n${data.hourly[3].description}\n${data.hourly[3].pop}  ☔`, inline: true},
                { name: `${data.hourly[4].dt}`, value: `${data.hourly[4].temp}  \n${data.hourly[4].description}\n${data.hourly[4].pop}  ☔`, inline: true},
                { name: `${data.hourly[5].dt}`, value: `${data.hourly[5].temp}  \n${data.hourly[5].description}\n${data.hourly[5].pop}  ☔`, inline: true},
            )
            .addField("\u200b", '🌥 ==== Prévisions quotidienne ==== 🌥', false)
            // .addField("🌥 ==== Prévisions quotidienne ==== 🌥", '\u200b', false)
            .addFields(
                { name: `${data.daily[0].dt}`, value: `${data.daily[0].max} | ${data.daily[0].min}\n${data.daily[0].description}\n${data.daily[0].pop}  ☔`, inline: true},
                { name: `${data.daily[1].dt}`, value: `${data.daily[1].max} | ${data.daily[1].min}\n${data.daily[1].description}\n${data.daily[1].pop}  ☔`, inline: true},
                { name: `${data.daily[2].dt}`, value: `${data.daily[2].max} | ${data.daily[2].min}\n${data.daily[2].description}\n${data.daily[2].pop}  ☔`, inline: true},
                { name: `${data.daily[3].dt}`, value: `${data.daily[3].max} | ${data.daily[3].min}\n${data.daily[3].description}\n${data.daily[3].pop}  ☔`, inline: true},
                { name: `${data.daily[4].dt}`, value: `${data.daily[4].max} | ${data.daily[4].min}\n${data.daily[4].description}\n${data.daily[4].pop}  ☔`, inline: true},
                { name: `${data.daily[5].dt}`, value: `${data.daily[5].max} | ${data.daily[5].min}\n${data.daily[5].description}\n${data.daily[5].pop}  ☔`, inline: true},
            )
            .addField('\u200b', 'Fuseau horaire du pays', false)
	        .setFooter(`${data.geo.timezone}  ●  ${data.geo.timezone_local}`, `${data.geo.urlFlag}`);

            message.channel.send(meteoEmbed)
        }
        
        callApi(city)

    } else if (commandName === "setmeteo") { 
        setCity = args.join(" ");
        message.channel.send("Ville par default ajouté")
    } else if (commandName === "trad") {
        const phrase = args.join(" ");
        // message.channel.send(phrase)
        translate(`${phrase}`, {to: 'fr'}).then(res => {
            // console.log(res.text);
            message.channel.send(res.text)
            //=> I speak English
            // console.log(res.from.language.iso);
            //=> nl
        }).catch(err => {
            console.error(err);
        });
    } /* else if (commandName === "delete") {
        const amount = args[0];
        message.channel.bulkDelete(amount, true);
    } */
})

async function returnApi(city) {
    function msConv(n) {
        return n * 1000;
    }
    function parseString(value, mon, d, w, h, min) {
        const localTimeString = new Date(value).toLocaleString("fr-FR", {
            timeZone: "UTC",
            month: mon ? "long" : undefined,
            day: d ? "numeric" : undefined,
            weekday: w ? "long" : undefined,
            hour: h ? "numeric" : undefined,
            minute: min ? "numeric" : undefined,
        });
        return localTimeString;
    }
    const urlGeo = new URL(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.appid}`)
    const apiGeo = await fetch(urlGeo)
        .then(res => {
            if (res.ok){
                const apiFetch = res.json().then(data => {
                    const geo = {
                        name: data[0].name,
                        country: data[0].country,
                        lat: data[0].lat,
                        lon: data[0].lon
                    }
                    return geo
                });
                return apiFetch
            } else {
                const err = {
                    nameApi: "geo",
                    ok: res.ok,
                    status: res.status,
                    statusText: res.statusText
                }
                return err
            }
        })
        .catch(err => console.log(err));
    
    const urlOnecall = new URL(`https://api.openweathermap.org/data/2.5/onecall?lat=${apiGeo.lat}&lon=${apiGeo.lon}&appid=${process.env.appid}&units=metric&lang=fr&exclude=minutely`)
    const apiOnecall = await fetch(urlOnecall)
        .then(res => {
            if (res.ok){
                const apiFetch = res.json().then(data => {
                    // console.log(data);
                    const dataApi = {
                        geo: {
                            name: apiGeo.name,
                            country: apiGeo.country,
                            urlFlag: `https://flagcdn.com/h20/${apiGeo.country.toLowerCase()}.webp`,
                            lat: apiGeo.lat,
                            lon: apiGeo.lon,
                            timezone: data.timezone,
                            timezone_offset: data.timezone_offset,
                            timezone_local: parseString(Date.now() + msConv(data.timezone_offset), true, true, true, true, true)
                        },
                        current: {
                            temp: `${parseFloat(data.current.temp.toFixed(1))}°C`,
                            feels_like: `${parseFloat(data.current.feels_like.toFixed(1))}°C`,
                            max: `${parseFloat(data.daily[0].temp.max.toFixed(1))}°C`,
                            min: `${parseFloat(data.daily[0].temp.min.toFixed(1))}°C`,
                            dew_point: `${parseFloat(data.current.dew_point.toFixed(1))}°C`,
                            description: data.current.weather[0].description,
                            icon: data.current.weather[0].icon,
                            urlIcon: `http://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png`,
                            pop: `${data.hourly[0].pop * 100}%`,
                            humidity: `${data.current.humidity}%`,
                            wind_speed: `${data.current.wind_speed.toFixed()}%`,
                            sunrise: parseString(msConv(data.current.sunrise) + msConv(data.timezone_offset), false, false, false, true, true),
                            sunset: parseString(msConv(data.current.sunset) + msConv(data.timezone_offset), false, false, false, true, true)
                        },
                        hourly: [],
                        daily: []
                    }
                    for (let i = 0; i < 6; i++) {
                        dataApi.hourly[i] = {
                            temp: `${parseFloat(data.hourly[i].temp.toFixed(1))}°C`,
                            dew_point: `${parseFloat(data.hourly[i].dew_point.toFixed(1))}°C`,
                            description: data.hourly[i].weather[0].description,
                            pop: `${data.hourly[i].pop * 100}%`,
                            dt:  parseString(msConv(data.hourly[i].dt) + msConv(data.timezone_offset), false, false, false, true, true)
                        }
                    }
                    for (let i = 0; i < 6; i++) {
                        dataApi.daily[i] = {
                            max: `${parseFloat(data.daily[i].temp.max.toFixed(1))}°C`, 
                            min: `${parseFloat(data.daily[i].temp.min.toFixed(1))}°C`, 
                            dew_point: `${parseFloat(data.daily[i].dew_point.toFixed(1))}°C`,
                            description: data.daily[i].weather[0].description,
                            pop: `${data.daily[i].pop * 100}%`, 
                            dt: parseString(msConv(data.daily[i].dt) + msConv(data.timezone_offset), true, true, true, false, false)
                        }
                    }
                    return dataApi
                })
                return apiFetch
            } else {
                const err = {
                    nameApi: "onecall",
                    ok: res.ok,
                    status: res.status,
                    statusText: res.statusText
                }
                return err
            }
        })

    return apiOnecall
}

client.login(process.env.token);
