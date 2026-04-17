import { InteractionType, Events } from 'discord.js';
import path from 'path';

const createEmbed = (event, character) => {
	const result = {
		fields: [],
	};

	const kritischBestanden = event.roll === 1 && event.rollBestaetigung <= event.eigenschaftsWert;
	const kritischFehlschlag = event.roll === 20 && event.rollBestaetigung > event.eigenschaftsWert;

	result.title = `__${event.eigenschaftName}__-Probe von '${character.displayName ?? character.name}'`;
	result.color = event.roll <= event.eigenschaftsWert ? 0x33cc33 : 0xff3300;
	result.fields.push({ name: 'Ergebnis', value: `${kritischBestanden ? '⭐ Kritischer Erfolg' : event.roll <= event.eigenschaftsWert ? '🏆 Bestanden' : kritischFehlschlag ? '💩 Patzer' : '💥 Nicht Bestanden'}`, inline: true });
	result.fields.push({ name: 'Gewürfelt', value: `${event.roll}`, inline: true });
	result.fields.push({ name: 'eff. Eigenschaft', value: `${event.eigenschaftsWert}`, inline: true });
	result.fields.push({ name: 'Eigenschaft', value: event.eigenschaft, inline: true });
	result.fields.push({ name: 'Bonus/Malus', value: `${event.bonusMalus}`, inline: true });

	return { embeds: [result] };
};

const eigenschaftHandlers = {
	mut: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.MU,
		eigenschaftName: 'Mut',
		eigenschaftsWert: character.eigenschaften.MU + bonusMalus,
	}),
	klugheit: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.KL,
		eigenschaftName: 'Klugheit',
		eigenschaftsWert: character.eigenschaften.KL + bonusMalus,
	}),
	intuition: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.IN,
		eigenschaftName: 'Intuition',
		eigenschaftsWert: character.eigenschaften.IN + bonusMalus,
	}),
	charisma: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.CH,
		eigenschaftName: 'Charisma',
		eigenschaftsWert: character.eigenschaften.CH + bonusMalus,
	}),
	fingerfertigkeit: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.FF,
		eigenschaftName: 'Fingerfertigkeit',
		eigenschaftsWert: character.eigenschaften.FF + bonusMalus,
	}),
	gewandheit: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.GE,
		eigenschaftName: 'Gewandheit',
		eigenschaftsWert: character.eigenschaften.GE + bonusMalus,
	}),
	konstitution: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.KO,
		eigenschaftName: 'Konstitution',
		eigenschaftsWert: character.eigenschaften.KO + bonusMalus,
	}),
	körperkraft: ({ character, bonusMalus }) => ({
		eigenschaft: character.eigenschaften.KK,
		eigenschaftName: 'Körperkraft',
		eigenschaftsWert: character.eigenschaften.KK + bonusMalus,
	}),
};

function handleSubcommandEigenschaft({ interaction, character, bonusMalus }) {
	const subcommand = interaction.options.getSubcommand?.();
	if (eigenschaftHandlers[subcommand]) {
		return eigenschaftHandlers[subcommand]({ character, bonusMalus });
	}
	return null;
}

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand() && interaction.type !== InteractionType.ApplicationCommandAutocomplete) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
			const roll = client.Common.rollDice(20);
			const rollBestaetigung = client.Common.rollDice(20);
			const eigenschaftData = handleSubcommandEigenschaft({ interaction, character, bonusMalus });
			const event = {
				type: 'event',
				name: 'eigenschaft',
				roll: roll,
				rollBestaetigung: rollBestaetigung,
				bonusMalus: bonusMalus,
				...eigenschaftData,
			};
			const embed = createEmbed(event, character);
			embed.content = 'Eigenschaftsprobe';
			await interaction.reply(embed);
			return [event];
		}
	},
	async executeSchip(interaction, eventData, character, client) {
		const data = { ...eventData };
		data.roll = client.Common.rollDice(20);
		data.rollBestaetigung = client.Common.rollDice(20);
		const embed = createEmbed(data, character);
		embed.content = 'Schicksalspunkt für Eigenschaftsprobe';
		await interaction.reply(embed);
		return [data];
	},
};