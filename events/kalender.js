import { Events } from 'discord.js';
import path from 'path';
import { createEmbedFromCalendar } from '../common/embeds.js';
import kalender from '../data/kalender.json' with { type: 'json' };

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName !== path.basename(import.meta.url, '.js')) return;
		if (interaction.options.getSubcommand() !== 'show') return;

		await interaction.reply({ embeds: createEmbedFromCalendar(kalender) });
	},
};