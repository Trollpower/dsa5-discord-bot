import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Anzeige von Daten')
		.addStringOption(option => option
			.setName('detailname')
			.setDescription('Der Name')
			.setRequired(true)
			.setAutocomplete(true)),
};