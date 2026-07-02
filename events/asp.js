import { InteractionType, Events } from 'discord.js';
import path from 'path';
import { wuerfelWerfen } from '../common/common.js';
import { persistCharacter } from '../common/persistence.js';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand() && interaction.type !== InteractionType.ApplicationCommandAutocomplete) return;
		if (!character.asp) {
			return await interaction.reply({ content: 'Du hast keine AsP' });
		}
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			let wieviel = interaction.options.getString('wieviel') ?? 0;
			wieviel = wieviel.trim();
			let result = 0;
			if (isNaN(wieviel)) {
				const wuerfelResult = wuerfelWerfen(wieviel);
				if (isNaN(wuerfelResult?.value)) {
					return await interaction.reply({ content: `${wieviel} konnte nicht als Würfel oder fester Wert verarbeitet werden` });
				}
				else {
					result = wuerfelResult.value;
				}
			}
			else {

				result = parseInt(wieviel);
			}

			if (interaction.options.getSubcommand() === 'plus') {
				character.asp.aktuell += result;
				if (character.asp.aktuell > character.asp.max) {character.asp.aktuell = character.asp.max;}
				persistCharacter(character);
				return await interaction.reply({ content: `${result} AsP hinzugefügt, jetzt ${character.asp.aktuell}` });

			}
			else if (interaction.options.getSubcommand() === 'minus') {
				character.asp.aktuell -= result;
				persistCharacter(character);
				return await interaction.reply({ content: `${result} AsP abgezogen, jetzt ${character.asp.aktuell}` });
			}
		}
	},
};