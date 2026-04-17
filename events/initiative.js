import { Events } from 'discord.js';
import path from 'path';
import logger from '../common/logger.js';

const initiativeHandlers = {
	set: async ({ interaction, client }) => {
		if (!interaction.isMeister()) {
			return await interaction.reply({ content: 'Nur der Spielleiter kann die Initiative festsetzen' });
		}
		const characterName = interaction.options.getString('charaktername') ?? 0;
		const initiativeWert = interaction.options.getInteger('wert') ?? 0;
		const character = client.Utils.highestSimilarity(characterName, (c) => ({ name: c.name, aliases: [] }), client.characters);
		if (!character) {
			return await interaction.reply({ content: `Charakter ${characterName} nicht gefunden` });
		}
		character.initiative = initiativeWert;
		client.Persistence.persistCharacter(character);
		await interaction.reply({ content: `Initiative für ${character.displayName ?? character.name} auf ${initiativeWert} gesetzt` });
	},
	reset: async ({ interaction, client }) => {
		if (!interaction.isMeister()) {
			return await interaction.reply({ content: 'Nur der Spielleiter kann die Initiative festsetzen' });
		}
		client.characters.forEach(x => {
			x.initiative = 0;
			client.Persistence.persistCharacter(x);
		});
		await interaction.reply({ content: 'Initiative für alle zurückgesetzt' });
	},
	list: async ({ interaction, client }) => {
		const embed = {
			title: 'Initiative',
			color: 0x0099ff,
			fields: [],
		};
		client.characters
			.filter(x => x.initiative && x.initiative > 0)
			.sort((a, b) => -1 * (a.initiative - b.initiative))
			.forEach(x => {
				embed.fields.push({ name: x.displayName ?? x.name, value: `${x.initiative}`, inline: false });
			});
		await interaction.reply({ embeds: [embed] });
	},
	default: async ({ interaction, character, client }) => {
		const rollDice = client.Common.rollDice;
		const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
		const belastung = character.getBelastungsmalus();
		const mut = character.eigenschaften.MU;
		const gewandtheit = character.eigenschaften.GE;
		let iniBasiswert = Math.ceil((mut + gewandtheit) / 2);
		const kampfreflexeCount = character.sonderfertigkeiten.filter(x => x.name.toUpperCase().indexOf('KAMPFREFLEXE') >= 0).length;
		iniBasiswert += kampfreflexeCount;
		const wurf = rollDice(6);
		const klingenTaenzerWurf = character.sonderfertigkeiten.filter(x => x.name.toUpperCase().indexOf('KLINGENTÄNZER') >= 0).length > 0 ? rollDice(6) : 0;
		logger.debug('initiative.klingentaenzer-roll', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			klingenTaenzerWurf,
		}));
		const initiative = iniBasiswert + wurf + klingenTaenzerWurf + bonusMalus - belastung;
		character.initiative = initiative;
		client.Persistence.persistCharacter(character);
		const event = {
			type: 'event',
			name: 'initiative',
			iniBasiswert,
			mut,
			gewandtheit,
			wurf: wurf + klingenTaenzerWurf,
			initiative,
			bonusMalus,
			belastung,
		};

		const embed = {
			title: `Initiative für ${character.displayName ?? character.name}!`,
			color: 0x0099ff,
			fields: [
				{ name: 'Initiative', value: `${event.initiative}`, inline: true },
				{ name: 'Wurf', value: `${wurf}`, inline: true },
				{ name: 'INI-Basiswert', value: `${event.iniBasiswert} = (MU${mut} + GE${gewandtheit}) / 2${kampfreflexeCount > 0 ? ` + Kampfreflexe ${kampfreflexeCount}` : ''}`, inline: true },
				{ name: 'Belastung', value: `${event.belastung}`, inline: true },
			],
		};
		if (bonusMalus != 0) {embed.fields.push({ name: 'Bonus', value: `${event.bonusMalus}`, inline: true });}
		if (klingenTaenzerWurf > 0) {
			event.infos = event.infos ?? [];
			embed.fields.push({ name: 'Klingentänzer Wurf', value: `${klingenTaenzerWurf}`, inline: true });
		}
		const kampfreflexe = character.sonderfertigkeiten.filter(x => x.name.toUpperCase().indexOf('KAMPFREFLEXE') >= 0);
		if (kampfreflexe.length > 0) {
			// if there are any "Verbessertes Ausweichen", render these in the embed
			embed.fields.push(client.Utils.createField(
				{
					fieldName: 'Kampfreflexe',
					fieldValues: kampfreflexe.sort((a, b) => a.name.localeCompare(b.name)).map(talent => ({ key: talent.name })),
					isInline: true,
				},
			));
		}
		await interaction.reply({ embeds: [embed] });
		return [event];
	},
};

function handleSubcommand({ interaction, character, client }) {
	const subcommand = interaction.options.getSubcommand?.() ?? 'default';
	if (initiativeHandlers[subcommand]) {
		return initiativeHandlers[subcommand]({ interaction, character, client });
	}
	return initiativeHandlers.default({ interaction, character, client });
}

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			return handleSubcommand({ interaction, character, client });
		}
	},
	async executeSchip(interaction, eventData, character, client) {
		const data = { ...eventData };
		data.wurf = client.Common.rollDice(6);
		data.initiative = data.iniBasiswert + data.wurf + data.bonusMalus;

		character.initiative = data.initiative;
		client.Persistence.persistCharacter(character);

		const embed = {
			fields: [],
		};

		embed.title = `Schicksalspunkt für Initiative von ${character.displayName ?? character.name}!`;
		embed.color = 0x0099ff;
		embed.fields.push({ name: 'Initiative', value: `${data.initiative}`, inline: true });
		embed.fields.push({ name: 'Wurf', value: `${data.wurf}`, inline: true });
		embed.fields.push({ name: 'INI-Basiswert', value: `${data.iniBasiswert}`, inline: true });

		if (data.bonusMalus != 0) {embed.fields.push({ name: 'Bonus', value: `${data.bonus}`, inline: true });}

		await interaction.reply({ embeds: [embed] });

		return [data];
	},
};