import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Angriffs-Kommando')
		.addIntegerOption(option => option.setName('bonus-malus')
			.setDescription('Der Bonus oder Malus des Angriffs')
			.setRequired(false))
		.addStringOption(option => option.setName('charwaffenname')
			.setDescription('Der Name der Waffe')
			.setRequired(false)
			.setAutocomplete(true)),
};