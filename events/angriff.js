import { Events, MessageFlags } from 'discord.js';
import { waffenData } from '../data/index.js';
import path from 'path';

const ANGRIFF_QUICK_CUSTOM_ID_PREFIX = 'angriff:quick:';

export { ANGRIFF_QUICK_CUSTOM_ID_PREFIX };

const executeQuickAngriff = async ({ waffenName, bonusMalus, interaction, character, client }) => {
	const waffenNameChar = client.Utils.highestSimilarity(waffenName, (weaponName) => ({ name: weaponName, aliases: [] }), character.angelegteWaffen);
	if (!waffenNameChar) {
		return await interaction.reply({ content: `Du hast keine Waffe mit einem Namen '**${waffenName}**' angelegt`, flags: MessageFlags.Ephemeral });
	}
	const waffe = client.Utils.highestSimilarity(waffenNameChar, weapon => ({ name: weapon.name, aliases: [] }), waffenData);
	const data = client.Utils.attack({ character, waffenName: waffe.name, bonusMalusAngriff: bonusMalus, interaction });
	const embed = client.Utils.createResultEmbedFromAttack({ character, data, interaction, client });
	await interaction.reply({ content: `Angriff mit ${waffe.name}`, embeds: [embed] });
	return [data];
};

function handleSubcommandAngriff({ interaction, character, client }) {
	const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
	const waffenName = interaction.options.getString('charwaffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
	return executeQuickAngriff({ waffenName, bonusMalus, interaction, character, client });
}

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	customIds: [ANGRIFF_QUICK_CUSTOM_ID_PREFIX],
	async execute(interaction, character, client) {
		if (interaction.isButton() && interaction.customId.startsWith(ANGRIFF_QUICK_CUSTOM_ID_PREFIX)) {
			const payload = interaction.customId.slice(ANGRIFF_QUICK_CUSTOM_ID_PREFIX.length);
			// format: sectionKey:waffenName or sectionKey:waffenName:bonusMalus
			const parts = payload.split(':');
			const waffenName = decodeURIComponent(parts[1]);
			const bonusMalus = parts[2] ? parseInt(parts[2]) : 0;
			return executeQuickAngriff({ waffenName, bonusMalus, interaction, character, client });
		}

		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			return handleSubcommandAngriff({ interaction, character, client });
		}
	},
	async executeSchip(interaction, eventData, character, client) {
		const data = { ...eventData };
		data.atRoll = client.Common.rollDice(20);
		data.atBestaetigt = client.Common.rollDice(20);
		const embed = client.Utils.createResultEmbedFromAttack({ character, data, interaction, client });
		await interaction.reply({ content: 'Schicksalspunkt für Angriff', embeds: [embed] });
		return [data];
	},
};