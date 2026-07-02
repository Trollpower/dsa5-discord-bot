import { Events, MessageFlags } from 'discord.js';
import path from 'path';
import { persistCharacter } from '../common/persistence.js';

export default {
	type: Events.InteractionCreate,
	customIds: ['rüstung:', 'rüstung!'],
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isButton()) return;
		if (interaction.customId.startsWith('rüstung:')) {
			const ruestungName = interaction.customId.split(':')[1];
			character.angelegteRuestung = ruestungName;
			persistCharacter(character);
			await interaction.reply({ content: ruestungName + ' ausgerüstet', flags: MessageFlags.Ephemeral });
		}
		else if (interaction.customId.startsWith('rüstung!')) {
			const ruestungsName = interaction.customId.split('!')[1];
			const index = character.ruestungen.indexOf(ruestungsName);
			if (index > -1) {
				character.ruestungen.splice(index, 1);
				character.angelegteRuestung = '';
				persistCharacter(character);
				return await interaction.reply({ content: ruestungsName + ' entfernt', flags: MessageFlags.Ephemeral });
			}
		}
	},
};