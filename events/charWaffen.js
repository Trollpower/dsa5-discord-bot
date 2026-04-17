import { ButtonBuilder, ActionRowBuilder, ButtonStyle, Events, MessageFlags } from 'discord.js';
import path from 'path';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	customIds: ['waffe+', 'waffe-', 'waffe!'],
	async execute(interaction, character, client) {
		if (!interaction.isButton()) return;
		const persistCharacter = client.Persistence.persistCharacter;
		if (interaction.customId === 'waffe') {
			const row = new ActionRowBuilder();
			const waffen = character.waffen ?? [];
			const embedWaffen = {
				color: 0xF33D33,
				title: 'Waffen',
				fields: [],
			};
			waffen.forEach(waffenName => {
				row.addComponents(new ButtonBuilder().setCustomId('waffe+' + waffenName).setLabel(waffenName).setStyle(ButtonStyle.Primary));
				const equiped = character.angelegteWaffen?.includes(waffenName) === true;
				embedWaffen.fields.push({ name: waffenName, value: equiped ? 'X' : '\u200b', inline: true });
			});

			return await interaction.reply({ content: 'Wähle Waffe', components: [row], fetchReply: true, embeds: [embedWaffen], flags: MessageFlags.Ephemeral });
		}
		else if (interaction.customId.startsWith('waffe+')) {
			character.angelegteWaffen = character.angelegteWaffen ?? [];
			character.angelegteWaffen = character.angelegteWaffen.filter(item => item !== 'Waffenlos');
			if (character.angelegteWaffen?.length >= 2) {
				const row = new ActionRowBuilder();
				const embedWaffen = {
					color: 0xF33D33,
					title: 'Welche Waffe wegstecken?',
					fields: [],
				};
				character.angelegteWaffen.forEach(waffenName => {
					row.addComponents(new ButtonBuilder().setCustomId('waffe-' + waffenName).setLabel(waffenName).setStyle(ButtonStyle.Primary));
					embedWaffen.fields.push({ name: waffenName, value: '\u200b', inline: true });
				});
				persistCharacter(character);
				return await interaction.reply({ content: 'Wähle Waffe zum wegstecken', components: [row], fetchReply: true, embeds: [embedWaffen], flags: MessageFlags.Ephemeral });
			}
			else {
				const waffenName = interaction.customId.split('+')[1];
				character.angelegteWaffen.push(waffenName);
				persistCharacter(character);
				return await interaction.reply({ content: waffenName + ' ausgerüstet', flags: MessageFlags.Ephemeral });
			}
		}
		else if (interaction.customId.startsWith('waffe-')) {
			const waffenName = interaction.customId.split('-')[1];
			const index = character.angelegteWaffen.indexOf(waffenName);
			if (index > -1) {
				character.angelegteWaffen.splice(index, 1);
				persistCharacter(character);
				return await interaction.reply({ content: waffenName + ' abgelegt', flags: MessageFlags.Ephemeral });
			}
		}
		else if (interaction.customId.startsWith('waffe!')) {
			const waffenName = interaction.customId.split('!')[1];
			const index = character.waffen.indexOf(waffenName);
			if (index > -1) {
				character.waffen.splice(index, 1);
				character.angelegteWaffen.splice(index, 1);
				persistCharacter(character);
				return await interaction.reply({ content: waffenName + ' entfernt', flags: MessageFlags.Ephemeral });
			}
		}
	},
};