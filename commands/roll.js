import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Würfelwurf-Kommando')
		.addStringOption(option => option
			.setName('würfel')
			.setDescription('Welche Würfel, z.B. 3D6+4')
			.setRequired(true)),
};