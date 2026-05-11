import { Events, MessageFlags } from 'discord.js';
import path from 'path';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName !== path.basename(import.meta.url, '.js')) return;

		const utils = client.Utils;
		const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
		const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';

		const data = utils.attack({ character, waffenName, bonusMalusAngriff: bonusMalus - 4, interaction });

		// Passierschlag: keine kritischen Treffer und keine Patzer möglich
		// Eine 1 bleibt eine 1 (Treffer), aber Bestätigung schlägt fehl → kein Krit
		if (data.atRoll === 1) data.atBestaetigt = data.kampffertigkeit.atBrutto + 1;
		// Eine 20 bleibt eine 20 (Fehlschlag), aber Bestätigung gelingt → kein Patzer
		if (data.atRoll === 20) data.atBestaetigt = data.kampffertigkeit.atBrutto;

		const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
		embed.fields.push({ name: 'Hinweis', value: 'Passierschlag (keine Patzer/Krits möglich)' });

		await interaction.reply({ content: `Passierschlag mit ${waffenName}`, embeds: [embed] });
		return [data];
	},
};
