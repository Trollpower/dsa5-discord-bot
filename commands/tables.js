import { SlashCommandBuilder } from 'discord.js';
import data from '../tables/index.js';

const buildTableCommands = () => {
	const builder = new SlashCommandBuilder();
	builder.setName('tables').setDescription('Anzeigen von Tabellen');
	Object.keys(data).forEach(function(key) {
		builder.addSubcommand(subcommand =>
			subcommand
				.setName(key)
				.setDescription(data[key].title));
	});
	return builder;
};

export default {
	data: buildTableCommands(),
};