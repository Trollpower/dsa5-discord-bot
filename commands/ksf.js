import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Kampfsonderfertigkeiten-Kommando')
		.addSubcommand(subcommand =>
			subcommand
				.setName('wuchtschlag')
				.setDescription('Wuchtschlag')
				.addIntegerOption(option => option.setName('stufe')
					.setDescription('Die Stufe des Wuchtschlags')
					.setRequired(true)
					.addChoices({ name: 'Stufe 1', value: 1 }, { name: 'Stufe 2', value: 2 }, { name: 'Stufe 3', value: 3 }))
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('finte')
				.setDescription('Finte')
				.addIntegerOption(option => option.setName('stufe')
					.setDescription('Die Stufe der Finte')
					.setRequired(true)
					.addChoices({ name: 'Stufe 1', value: 1 }, { name: 'Stufe 2', value: 2 }, { name: 'Stufe 3', value: 3 }))
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('sturmangriff')
				.setDescription('Sturmangriff')
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('basismanoever')
					.setDescription('Der Name des Basismanövers')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('todesstoß')
				.setDescription('Todesstoß')
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('basismanoever')
					.setDescription('Der Name des Basismanövers')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('vorstoß')
				.setDescription('Vorstoß')
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('basismanoever')
					.setDescription('Der Name des Basismanövers')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('entwaffnen')
				.setDescription('Entwaffnen')
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('basismanoever')
					.setDescription('Der Name des Basismanövers')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('zufallbringen')
				.setDescription('Zu Fall bringen')
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('basismanoever')
					.setDescription('Der Name des Basismanövers')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('rundumschlag')
				.setDescription('Rundumschlag')
				.addIntegerOption(option => option.setName('stufe')
					.setDescription('Die Stufe des Rundumschlags')
					.setRequired(true)
					.addChoices({ name: 'Stufe 1', value: 1 }, { name: 'Stufe 2', value: 2 }))
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(true)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('ps')
				.setDescription('Präziser Schuss/Wurf')
				.addIntegerOption(option => option.setName('stufe')
					.setDescription('Die Stufe des Präzisen Schusses/Wurfs')
					.setRequired(true)
					.addChoices({ name: 'Stufe 1', value: 1 }, { name: 'Stufe 2', value: 2 }, { name: 'Stufe 3', value: 3 }))
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der verwendeten Waffe')
					.setRequired(true)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('bk')
				.setDescription('Beidhändiger Kampf')
				.addStringOption(option => option
					.setName('waffenname')
					.setDescription('Der Name der Haupthand-Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addStringOption(option => option
					.setName('nebenhand')
					.setDescription('Der Name der Nebenhand-Waffe')
					.setRequired(false)
					.setAutocomplete(true))
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus des Angriffs')
					.setRequired(false)),
		),
};