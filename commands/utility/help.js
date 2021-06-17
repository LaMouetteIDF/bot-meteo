const { prefix } = require("../../config.json");

module.exports = {
    name: "help",
    description:
        "Liste toutes mes commandes ou informations sur une commande spécifique.",
    aliases: ["commands"],
    usage: "[command name]",
    cooldown: 5,
    execute(message, args) {
        const data = [];
        const { commands } = message.client;

        if (!args.length) {
            data.push("Voici une liste de toutes mes commandes :");
            data.push(commands.map((command) => command.name).join(", "));
            data.push(
                `\nVous pouvez envoyer \`${prefix}help [command name]\` pour obtenir des informations sur une commande spécifique !`
            );

            return message.author
                .send(data, { split: true })
                .then(() => {
                    if (message.channel.type === "dm") return;
                    message.reply(
                        "Je t'ai envoyé un DM avec toutes mes commandes !"
                    );
                })
                .catch((error) => {
                    console.error(
                        `Impossible d'envoyer le DM d'aide à ${message.author.tag}.\n`,
                        error
                    );
                    message.reply(
                        "il semble que je ne peux pas vous envoyer de DM ! Avez-vous des DM désactivés ?"
                    );
                });
        }

        const name = args[0].toLowerCase();
        const command =
            commands.get(name) ||
            commands.find((c) => c.aliases && c.aliases.includes(names));

        if (!command) {
            return message.reply("ce n'est pas une commande valide !");
        }

        data.push(`**Name:** ${command.name}`);

        if (command.aliases)
            data.push(`**Aliases:** ${command.aliases.join(", ")}`);
        if (command.desciption)
            data.push(`**Description:** ${command.desciption}`);
        if (command.usage)
            data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

        data.push(`**Cooldown** ${command.cooldown || 3} seconde(s)`);

        message.channel.send(data, { split: true });
    },
};
