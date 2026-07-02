import { InteractionType, Events, MessageFlags } from 'discord.js';
import path from 'path';
import config from '../config.json' with { type: 'json' };
import { persistCharacter } from '../common/persistence.js';
import { persistConfig } from '../common/persistence.js';
import { resolveFertigkeit, executeProbeAndBuildResponse } from './probe.js';
import logger from '../common/logger.js';

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

		if (!interaction.isMeister()) {
			return interaction.reply({ content: 'Du bist nicht der Meister.', flags: MessageFlags.Ephemeral });
		}

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

		if (subcommand === 'probe') {
			const name = interaction.options.getString('name').trim();
			const fertigkeitsName = interaction.options.getString('fertigkeitsname');
			const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;

			if (!groups[name]) {
				return interaction.reply({ content: `Gruppe **${name}** existiert nicht.`, flags: MessageFlags.Ephemeral });
			}
			if (groups[name].length === 0) {
				return interaction.reply({ content: `Gruppe **${name}** hat keine Mitglieder.`, flags: MessageFlags.Ephemeral });
			}

			const fertigkeit = resolveFertigkeit(fertigkeitsName, client);
			if (!fertigkeit) {
				return interaction.reply({ content: `Fertigkeit **${fertigkeitsName}** wurde nicht gefunden.`, flags: MessageFlags.Ephemeral });
			}

			const embeds = [];
			const allEvents = [];
			for (const charName of groups[name]) {
				const character = client.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
				if (!character) {
					embeds.push({ embed: { title: `❌ ${charName} nicht gefunden`, color: 0xff0000 }, event: null });
					continue;
				}

				if (fertigkeit.kategorie !== 'talente') {
					const characterTalent = (character[fertigkeit.kategorie] ?? []).find(f => f.name === fertigkeit.name);
					if (!characterTalent) {
						embeds.push({ embed: { title: `❌ ${character.displayName ?? character.name}: **${fertigkeit.name}** ist nicht aktiviert`, color: 0xff0000 }, event: null });
						continue;
					}
				}

				const { event, embed } = await executeProbeAndBuildResponse({ fertigkeit, character, bonusMalus, interaction, client });
				embeds.push({ embed, event });
				allEvents.push(event);
				persistCharacter(character).catch(err => logger.error('gruppe.probe.persist.failed', { error: err, character: charName }));
			}
			const sortedEmbeds = embeds.sort((a, b) => {
				const aKrit = a.event?.kritischBestanden ? 1 : 0;
				const bKrit = b.event?.kritischBestanden ? 1 : 0;
				if (bKrit !== aKrit) return bKrit - aKrit;
				return (b.embed.fields?.find(f => f.name === "QS")?.value ?? -1) - (a.embed.fields?.find(f => f.name === "QS")?.value ?? -1);
			}).map(e => e.embed);
			await interaction.reply({ embeds: sortedEmbeds.slice(0, 10), flags: MessageFlags.Ephemeral });
			return allEvents;
		}
	},
};
