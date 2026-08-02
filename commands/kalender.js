import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Kalender-Befehl')
		.addSubcommand(subcommand => subcommand
			.setName('show')
			.setDescription('Zeigt den DSA-Kalender an')),
};