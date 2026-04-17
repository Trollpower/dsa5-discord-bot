import { Events } from 'discord.js';
import path from 'path';
import tables from '../tables/index.js';

const createColumn = (header, values = [], isInline = true) => {
	return {
		name: header,
		value: values.filter(kv => kv !== null).map(kv => `${kv}
`).join(''),
		inline: isInline,
	};
};

const tableHandlers = {};
for (const key of Object.keys(tables)) {
	tableHandlers[key] = async ({ interaction }) => {
		const table = tables[key];
		if (table) {
			const embed = {
				color: 0x0099ff,
				title: `__**${table.title}**__`,
				fields: [
					createColumn(table.table[0][0], table.table.slice(1).map(item => item[0]), true),
					createColumn(table.table[0][1], table.table.slice(1).map(item => item[1]), true),
				],
			};
			await interaction.reply({ embeds: [embed] });
		}
	};
}

function handleSubcommandTable({ interaction }) {
	const subcommand = interaction.options.getSubcommand?.();
	if (tableHandlers[subcommand]) {
		return tableHandlers[subcommand]({ interaction });
	}
}

export default {
	type: Events.InteractionCreate,
	name: path.basename('tables', '.js'),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename('tables', '.js')) {
			return handleSubcommandTable({ interaction });
		}
	},
};