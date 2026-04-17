import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Initiative-Kommando')
		.addSubcommand(subcommand =>
			subcommand
				.setName('würfeln')
				.setDescription('Initiative würfeln'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('set')
				.setDescription('Initiativewert für einen Character festlegen')
				.addIntegerOption(option => option.setName('wert').setDescription('Der Initiativewert').setRequired(true))
				.addStringOption(option => option.setName('charaktername').setDescription('Der Charactername').setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('reset')
				.setDescription('Initiativewerte für alle zurücksetzen'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription('Initiative anzeigen'),
		),
};