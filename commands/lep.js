import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Lebenspunkte-Kommando')
		.addSubcommand(subcommand =>
			subcommand
				.setName('plus')
				.setDescription('Lebenspunkte erhalten')
				.addStringOption(option => option.setName('wieviel')
					.setDescription('Absoluter Wert oder Würfelwurf')
					.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('minus')
				.setDescription('Lebenspunkte abziehen')
				.addStringOption(option => option.setName('wieviel')
					.setDescription('Absoluter Wert oder Würfelwurf')
					.setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('setzen')
				.setDescription('Lebenspunkte setzen')
				.addIntegerOption(option => option.setName('wert')
					.setDescription('Neuer Wert')
					.setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('tp')
				.setDescription('Trefferpunkte abziehen')
				.addStringOption(option => option.setName('wieviel')
					.setDescription('Absoluter Wert oder Würfelwurf')
					.setRequired(true)),
		),
};