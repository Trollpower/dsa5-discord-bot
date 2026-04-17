import { InteractionType, Events } from 'discord.js';
import path from 'path';

const lepHandlers = {
	plus: async ({ interaction, character, persistCharacter, result }) => {
		character.lep.aktuell += result;
		if (character.lep.aktuell > character.lep.max) {character.lep.aktuell = character.lep.max;}
		persistCharacter(character);
		return interaction.reply({ content: `${result} LeP hinzugefügt, jetzt ${character.lep.aktuell}` });
	},
	minus: async ({ interaction, character, persistCharacter, result }) => {
		character.lep.aktuell -= result;
		persistCharacter(character);
		return interaction.reply({ content: `${result} LeP abgezogen, jetzt ${character.lep.aktuell}` });
	},
	setzen: async ({ interaction, character, persistCharacter }) => {
		const wert = interaction.options.getInteger('wert');
		if (typeof wert === 'number' && wert >= 0 && wert <= character.lep.max) {
			character.lep.aktuell = wert;
		}
		persistCharacter(character);
		return interaction.reply({ content: `Du hast nun ${character.lep.aktuell} LeP` });
	},
	tp: async ({ interaction, character, persistCharacter, result }) => {
		let tp = result - character.getRuestungsschutz();
		if (tp < 0) tp = 0;
		character.lep.aktuell -= tp;
		persistCharacter(character);
		return interaction.reply({ content: `${tp} LeP abgezogen (TP: ${result} - RS${character.getRuestungsschutz()}), jetzt ${character.lep.aktuell}` });
	},
};

function handleSubcommand({ interaction, character, client, persistCharacter, result }) {
	const subcommand = interaction.options.getSubcommand();
	if (lepHandlers[subcommand]) {
		return lepHandlers[subcommand]({ interaction, character, client, persistCharacter, result });
	}
}

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand() && !interaction.type === InteractionType.ApplicationCommandAutocomplete) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const wuerfelWerfen = client.Common.wuerfelWerfen;
			const persistCharacter = client.Persistence.persistCharacter;
			const wieviel = interaction.options.getString('wieviel')?.trim() ?? '0';
			let result = 0;
			if (wieviel && isNaN(wieviel)) {
				const wuerfelResult = wuerfelWerfen(wieviel);
				if (isNaN(wuerfelResult?.value)) {
					return await interaction.reply({ content: `${wieviel} konnte nicht als Würfel oder fester Wert verarbeitet werden` });
				}
				result = wuerfelResult.value;
			}
			else {
				result = parseInt(wieviel) || 0;
			}
			return handleSubcommand({ interaction, character, client, persistCharacter, result });
		}
	},
};