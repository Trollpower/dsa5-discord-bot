import { SlashCommandBuilder } from 'discord.js';
import path from 'path';
import kalender from '../data/kalender.json' with { type: 'json' };

const kalenderChoices = kalender.monate.map(month => ({ name: month.name, value: month.name }));

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Kalender-Befehl')
		.addSubcommand(subcommand => subcommand
			.setName('monate')
			.setDescription('Zeigt den DSA-Kalender an'))
		.addSubcommand(subcommand => subcommand
			.setName('woche')
			.setDescription('Zeigt die Wochentage an'))
		.addSubcommand(subcommand => subcommand
			.setName('calc')
			.setDescription('Berechnet die Tage zwischen zwei Kalenderdaten')
			.addIntegerOption(option => option
				.setName('starttag')
				.setDescription('Starttag')
				.setMinValue(1)
				.setRequired(true))
			.addStringOption(option => option
				.setName('startmonat')
				.setDescription('Startmonat')
				.addChoices(...kalenderChoices)
				.setRequired(true))
			.addIntegerOption(option => option
				.setName('endtag')
				.setDescription('Endtag')
				.setMinValue(1)
				.setRequired(true))
			.addStringOption(option => option
				.setName('endmonat')
				.setDescription('Endmonat')
				.addChoices(...kalenderChoices)
				.setRequired(true))),
};