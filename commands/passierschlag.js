import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Passierschlag (Nahkampfangriff mit -4, keine Patzer/Krits)')
		.addStringOption(option => option.setName('waffenname')
			.setDescription('Der Name der verwendeten Waffe')
			.setRequired(false)
			.setAutocomplete(true))
		.addIntegerOption(option => option.setName('bonus-malus')
			.setDescription('Der Bonus oder Malus des Angriffs')
			.setRequired(false)),
};
