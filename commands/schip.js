import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Schip-Kommando')
		.addStringOption(option => option
			.setName('maske')
			.setDescription('Maske für die drei Würfe, z. B. 010 für nur den zweiten Wurf')
			.setRequired(false)
			.addChoices(
				{ name: '001', value: '001' },
				{ name: '010', value: '010' },
				{ name: '011', value: '011' },
				{ name: '100', value: '100' },
				{ name: '101', value: '101' },
				{ name: '110', value: '110' },
				{ name: '111', value: '111' },
			),
		),
};