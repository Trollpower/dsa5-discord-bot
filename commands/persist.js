import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Persistiere einen Charakter')
		.addStringOption(option => option
			.setName('character-name')
			.setDescription('Name des Charakters')
			.setRequired(false))
		.addBooleanOption(option => option
			.setName('reload-from-disc')
			.setDescription('Von Festplatte neu laden')
			.setRequired(false)),
};