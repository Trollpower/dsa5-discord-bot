import { ButtonBuilder, ActionRowBuilder, ButtonStyle, Events } from 'discord.js';
import path from 'path';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('primary')
						.setLabel('Primary')
						.setStyle(ButtonStyle.Primary),
				);
			await interaction.reply({ content: 'Pong!', components: [row] });
		}
	},
};