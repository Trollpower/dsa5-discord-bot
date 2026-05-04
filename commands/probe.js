import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Probe-Kommando')
		.addStringOption(option => option
			.setName('fertigkeitsname')
			.setDescription('Der Name der Fertigkeit')
			.setRequired(true)
			.setAutocomplete(true))
		.addIntegerOption(option => option.setName('bonus-malus')
			.setDescription('Der Bonus oder Malus der Fertigkeitsprobe')
			.setRequired(false)),
};
