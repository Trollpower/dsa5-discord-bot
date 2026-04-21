import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('gruppe')
		.setDescription('Gruppen von Charakteren verwalten')
		.addSubcommand(subcommand =>
			subcommand
				.setName('erstellen')
				.setDescription('Neue Gruppe erstellen')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('Name der Gruppe')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('löschen')
				.setDescription('Gruppe löschen')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('Name der Gruppe')
						.setRequired(true)
						.setAutocomplete(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('hinzufügen')
				.setDescription('Charakter zu einer Gruppe hinzufügen')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('Name der Gruppe')
						.setRequired(true)
						.setAutocomplete(true))
				.addStringOption(option =>
					option
						.setName('charakter')
						.setDescription('Name des Charakters')
						.setRequired(true)
						.setAutocomplete(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('entfernen')
				.setDescription('Charakter aus einer Gruppe entfernen')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('Name der Gruppe')
						.setRequired(true)
						.setAutocomplete(true))
				.addStringOption(option =>
					option
						.setName('charakter')
						.setDescription('Name des Charakters')
						.setRequired(true)
						.setAutocomplete(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('anzeigen')
				.setDescription('Gruppe(n) anzeigen')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('Name der Gruppe (leer = alle Gruppen)')
						.setRequired(false)
						.setAutocomplete(true))),
};
