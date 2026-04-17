import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Eigenschafts-Kommando')
		.addSubcommand(subcommand =>
			subcommand
				.setName('mut')
				.setDescription('Mut-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('klugheit')
				.setDescription('Klugheits-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bbei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('intuition')
				.setDescription('Intuitions-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('charisma')
				.setDescription('Charisma-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('fingerfertigkeit')
				.setDescription('Fingerfertigkeits-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('gewandheit')
				.setDescription('Gewandheits-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('konstitution')
				.setDescription('Konstitutions-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('körperkraft')
				.setDescription('Körperkraft-Probe')
				.addIntegerOption(option => option.setName('bonus-malus')
					.setDescription('Der Bonus oder Malus bei der Probe')
					.setRequired(false)),
		),
};