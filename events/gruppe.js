import { InteractionType, Events, MessageFlags } from 'discord.js';
import path from 'path';
import config from '../config.json' with { type: 'json' };
import { persistConfig } from '../common/persistence.js';

const getGroups = () => {
	if (!config.gruppen) {
		config.gruppen = {};
	}
	return config.gruppen;
};

const saveGroups = () => {
	persistConfig(config);
};

const handleAutocomplete = (interaction, client) => {
	const focusedOption = interaction.options.getFocused(true);
	const groups = getGroups();

	if (focusedOption.name === 'name') {
		const groupNames = Object.keys(groups);
		const filtered = groupNames
			.filter(name => name.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
			.slice(0, 25);
		return interaction.respond(filtered.map(name => ({ name, value: name })));
	}

	if (focusedOption.name === 'charakter') {
		const characters = client.characters.map(c => c.name);
		const filtered = characters
			.filter(name => name.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
			.slice(0, 25);
		return interaction.respond(filtered.map(name => ({ name, value: name })));
	}
};

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, _character, client) {
		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			return handleAutocomplete(interaction, client);
		}
		if (!interaction.isChatInputCommand()) return;

		const subcommand = interaction.options.getSubcommand();
		const groups = getGroups();

		if (subcommand === 'erstellen') {
			const name = interaction.options.getString('name').trim();
			if (groups[name]) {
				return interaction.reply({ content: `Gruppe **${name}** existiert bereits.`, flags: MessageFlags.Ephemeral });
			}
			groups[name] = [];
			saveGroups();
			return interaction.reply({ content: `Gruppe **${name}** wurde erstellt.`, flags: MessageFlags.Ephemeral });
		}

		if (subcommand === 'löschen') {
			const name = interaction.options.getString('name').trim();
			if (!groups[name]) {
				return interaction.reply({ content: `Gruppe **${name}** existiert nicht.`, flags: MessageFlags.Ephemeral });
			}
			delete groups[name];
			saveGroups();
			return interaction.reply({ content: `Gruppe **${name}** wurde gelöscht.`, flags: MessageFlags.Ephemeral });
		}

		if (subcommand === 'hinzufügen') {
			const name = interaction.options.getString('name').trim();
			const charName = interaction.options.getString('charakter').trim();
			if (!groups[name]) {
				return interaction.reply({ content: `Gruppe **${name}** existiert nicht.`, flags: MessageFlags.Ephemeral });
			}
			const character = client.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
			if (!character) {
				return interaction.reply({ content: `Charakter **${charName}** wurde nicht gefunden.`, flags: MessageFlags.Ephemeral });
			}
			if (groups[name].includes(character.name)) {
				return interaction.reply({ content: `**${character.name}** ist bereits in Gruppe **${name}**.`, flags: MessageFlags.Ephemeral });
			}
			groups[name].push(character.name);
			saveGroups();
			return interaction.reply({ content: `**${character.name}** wurde zu Gruppe **${name}** hinzugefügt.`, flags: MessageFlags.Ephemeral });
		}

		if (subcommand === 'entfernen') {
			const name = interaction.options.getString('name').trim();
			const charName = interaction.options.getString('charakter').trim();
			if (!groups[name]) {
				return interaction.reply({ content: `Gruppe **${name}** existiert nicht.`, flags: MessageFlags.Ephemeral });
			}
			const index = groups[name].findIndex(c => c.toLowerCase() === charName.toLowerCase());
			if (index === -1) {
				return interaction.reply({ content: `**${charName}** ist nicht in Gruppe **${name}**.`, flags: MessageFlags.Ephemeral });
			}
			const removed = groups[name].splice(index, 1)[0];
			saveGroups();
			return interaction.reply({ content: `**${removed}** wurde aus Gruppe **${name}** entfernt.`, flags: MessageFlags.Ephemeral });
		}

		if (subcommand === 'anzeigen') {
			const name = interaction.options.getString('name')?.trim();
			if (name) {
				if (!groups[name]) {
					return interaction.reply({ content: `Gruppe **${name}** existiert nicht.`, flags: MessageFlags.Ephemeral });
				}
				const members = groups[name].length > 0 ? groups[name].join(', ') : '*leer*';
				return interaction.reply({ content: `**${name}**: ${members}`, flags: MessageFlags.Ephemeral });
			}
			const groupNames = Object.keys(groups);
			if (groupNames.length === 0) {
				return interaction.reply({ content: 'Es gibt noch keine Gruppen.', flags: MessageFlags.Ephemeral });
			}
			const lines = groupNames.map(g => {
				const members = groups[g].length > 0 ? groups[g].join(', ') : '*leer*';
				return `**${g}**: ${members}`;
			});
			return interaction.reply({ content: lines.join('\n'), flags: MessageFlags.Ephemeral });
		}
	},
};
