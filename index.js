const fs = require("fs");
const { Client, Collection } = require("discord.js");
const { prefix } = require("./config.json");

const client = new Client();
client.commands = new Collection();
client.cooldowns = new Collection();

const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
    const commandFiles = fs
        .readdirSync(`./commands/${folder}`)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
        client.commands.get(commandName) ||
        client.commands.find(
            (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
        );

    if (!command) return;

    if (command.guildOnly && message.channel.type === "dm") {
        return message.reply(
            "Je ne peux pas exécuter cette commande dans les DM !"
        );
    }

    if (command.permissions) {
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return message.reply("Tu ne peux pas faire ça!");
        }
    }

    if (command.args && !args.length) {
        let reply = `Vous n'avez fourni aucun argument, ${message.author}!`;

        if (command.usage) {
            reply += `\nL'utilisation appropriée serait : \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }

    const { cooldowns } = client;

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime =
            timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(
                `S'il vous plaît, attendez ${timeLeft.toFixed(
                    1
                )} seconde(s) avant de réutiliser la commande ${command.name}`
            );
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply(
            "une erreur s'est produite lors de l'exécution de cette commande !"
        );
    }
});

client.login(process.env.token);
