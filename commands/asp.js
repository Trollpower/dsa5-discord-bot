import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Astralpunkte anzeigen und bearbeiten')
		.addSubcommand(subcommand =>
			subcommand
				.setName('plus')
				.setDescription('Astralpunkte erhalten')
				.addStringOption(option => option.setName('wieviel')
					.setDescription('Absoluter Wert oder Würfelwurf')
					.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('minus')
				.setDescription('Astralpunkte abziehen')
				.addStringOption(option => option.setName('wieviel')
					.setDescription('Absoluter Wert oder Würfelwurf')
					.setRequired(true)),
		),
};