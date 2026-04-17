import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('gm')
		.setDescription('GM-Befehl (nur für den Meister)')
		.addSubcommandGroup(group =>
			group
				.setName('events')
				.setDescription('Event-Log verwalten')
				.addSubcommand(subcommand =>
					subcommand
						.setName('count')
						.setDescription('Anzahl der Events im NDJSON-Log anzeigen')
						.addStringOption(option =>
							option
								.setName('charakter')
								.setDescription('Nur Events dieses Charakters zählen (optional)')
								.setRequired(false)))
				.addSubcommand(subcommand =>
					subcommand
						.setName('trim')
						.setDescription('Log auf die letzten N Events kürzen')
						.addIntegerOption(option =>
							option
								.setName('anzahl')
							.setDescription('Anzahl der Events, die erhalten bleiben sollen (0 = alle entfernen)')
							.setMinValue(0)
								.setRequired(true)))
				.addSubcommand(subcommand =>
					subcommand
						.setName('list')
						.setDescription('Events nach Name und Häufigkeit auflisten')
						.addStringOption(option =>
							option
								.setName('charakter')
								.setDescription('Nur Events dieses Charakters (optional)')
								.setRequired(false))))
		.addSubcommandGroup(group =>
			group
				.setName('char')
				.setDescription('Charakter-Einstellungen verwalten')
				.addSubcommand(subcommand =>
					subcommand
						.setName('cheating-get')
						.setDescription('Cheating-Werte eines Charakters anzeigen')
						.addStringOption(option =>
							option
								.setName('charactername')
								.setDescription('Name des Charakters')
								.setAutocomplete(true)
								.setRequired(true)))
				.addSubcommand(subcommand =>
					subcommand
						.setName('cheating-set')
						.setDescription('cheating.general eines Charakters setzen')
						.addStringOption(option =>
							option
								.setName('charactername')
								.setDescription('Name des Charakters')
								.setAutocomplete(true)
								.setRequired(true))
						.addIntegerOption(option =>
							option
								.setName('wert')
								.setDescription('Neuer Wert für cheating.general (0–100)')
								.setMinValue(0)
								.setMaxValue(100)
								.setRequired(true)))
				.addSubcommand(subcommand =>
					subcommand
						.setName('cheating-set-crit')
						.setDescription('cheating.crit eines Charakters setzen')
						.addStringOption(option =>
							option
								.setName('charactername')
								.setDescription('Name des Charakters')
								.setAutocomplete(true)
								.setRequired(true))
						.addIntegerOption(option =>
							option
								.setName('wert')
								.setDescription('Neuer Wert für cheating.crit (0–100)')
								.setMinValue(0)
								.setMaxValue(100)
								.setRequired(true)))
				.addSubcommand(subcommand =>
					subcommand
						.setName('proben')
						.setDescription('Die letzten Proben aller oder eines bestimmten Charakters anzeigen (max. 50)')
						.addStringOption(option =>
							option
								.setName('charactername')
								.setDescription('Name des Charakters (leer = alle)')
								.setAutocomplete(true)
								.setRequired(false))))
		.addSubcommandGroup(group =>
			group
				.setName('user')
				.setDescription('Benutzer-Berechtigungen verwalten')
				.addSubcommand(subcommand =>
					subcommand
						.setName('meister')
						.setDescription('Temporäre Meister-Berechtigungen per Button vergeben/entziehen'))
				.addSubcommand(subcommand =>
					subcommand
						.setName('pc')
						.setDescription('Spielercharakter für einen Benutzer festlegen')
						.addUserOption(option =>
							option
								.setName('benutzer')
								.setDescription('Discord-Benutzer, dem der Charakter zugewiesen wird')
								.setRequired(true))
						.addStringOption(option =>
							option
								.setName('charactername')
								.setDescription('Name des Charakters')
								.setRequired(true)
								.setAutocomplete(true)))),
};

