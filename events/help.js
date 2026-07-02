import { Events, MessageFlags } from 'discord.js';
import { createField } from '../common/embeds.js';

import path from 'path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const COMMAND_OPTION_SUBCOMMAND = 1;
const COMMAND_OPTION_SUBCOMMAND_GROUP = 2;

const formatOptionSuffix = (options = []) => {
	const params = options
		.filter(option => option?.type !== COMMAND_OPTION_SUBCOMMAND && option?.type !== COMMAND_OPTION_SUBCOMMAND_GROUP)
		.map(option => option.required ? `<${option.name}>` : `[${option.name}]`);

	return params.length > 0 ? ` ${params.join(' ')}` : '';
};

const formatCommandDetails = (command, prefix = `/${command.name}`) => {
	const lines = [];
	const rootOptions = Array.isArray(command?.options) ? command.options : [];
	const directOptions = rootOptions
		.filter(option => option?.type !== COMMAND_OPTION_SUBCOMMAND && option?.type !== COMMAND_OPTION_SUBCOMMAND_GROUP);

	if (directOptions.length > 0) {
		lines.push(`${prefix}${formatOptionSuffix(directOptions)}`);
	}

	for (const option of rootOptions) {
		if (option?.type === COMMAND_OPTION_SUBCOMMAND) {
			lines.push(`${prefix} ${option.name}${formatOptionSuffix(option.options)}`);
			continue;
		}

		if (option?.type !== COMMAND_OPTION_SUBCOMMAND_GROUP) {
			continue;
		}

		const subcommands = Array.isArray(option.options)
			? option.options.filter(child => child?.type === COMMAND_OPTION_SUBCOMMAND)
			: [];

		if (subcommands.length === 0) {
			lines.push(`${prefix} ${option.name}`);
			continue;
		}

		for (const sub of subcommands) {
			lines.push(`${prefix} ${option.name} ${sub.name}${formatOptionSuffix(sub.options)}`);
		}
	}

	if (lines.length === 0) {
		return 'Keine Optionen oder Unterbefehle';
	}

	return lines.map(line => `- ${line}`).join('\n');
};

const loadCommands = async () => {
	const rootPath = process.cwd();
	const commandsPath = path.join(rootPath, 'commands');
	const commandFiles = fs.readdirSync(commandsPath)
		.filter(file => file.endsWith('.js'));

	const commands = [];
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const commandModule = await import(pathToFileURL(filePath).href);
		const command = commandModule.default ?? commandModule;
		if (!command?.data?.toJSON) {
			continue;
		}
		const json = command.data.toJSON();
		commands.push(json);
	}

	commands.sort((a, b) => a.name.localeCompare(b.name));
	return commands;
};

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, _character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName !== path.basename(import.meta.url, '.js')) return;

		const commands = await loadCommands();
		const embed = {
			color: 0x0099ff,
			title: '__**Befehlsübersicht**__',
			fields: [],
		};

		for (const command of commands) {
			const isMeisterOnly = command.name === 'gm' || command.name === 'gruppe';
			const isMeister = interaction.isMeister();

			let aufrufe;
			if (isMeisterOnly && !isMeister) {
				aufrufe = '*(Nur für Meister sichtbar)*';
			}
			else {
				aufrufe = formatCommandDetails(command);
			}

			embed.fields.push(createField({
				fieldName: `/${command.name}`,
				fieldValues: [
					{ key: 'Beschreibung', value: command.description ?? '-' },
					{ key: 'Aufrufe', value: '\n' + aufrufe },
				],
				isInline: true,
				valueFormatting: '',
			}));
		}

		return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},
};
