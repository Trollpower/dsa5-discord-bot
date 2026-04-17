import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Ausweichen-Kommando')
		.addIntegerOption(option => option.setName('bonus-malus')
			.setDescription('Der Bonus oder Malus beim Ausweichen')
			.setRequired(false)),
};