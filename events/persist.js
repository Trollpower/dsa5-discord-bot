import fs from 'node:fs';
import { Events, MessageFlags } from 'discord.js';
import path from 'path';
import { Character } from '../common/character.js';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const persistCharacter = client.Persistence.persistCharacter;
			const charName = interaction.options.getString('character-name');
			const reloadFromDisc = interaction.options.getBoolean('reload-from-disc') ?? false;
			// console.log(`Persist arguments ${persistCharacter}, ${charName}, ${reloadFromDisc}`);
			if (reloadFromDisc && !charName) {
				const charsPath = path.join(__dirname, '../chars');
				const charsFiles = fs.readdirSync(charsPath).filter(file => file.endsWith('.json') && file !== 'config.json');

				for (const file of charsFiles) {
					const filePath = path.join(charsPath, file);
					const loadedCharacter = require(filePath);
					persistCharacter(loadedCharacter);
				}
				await interaction.reply({ content: 'Alle Charaktere wurden neu von der Platte eingelesen', flags: MessageFlags.Ephemeral });
			}
			else if (reloadFromDisc) {
				const charsPath = path.join(__dirname, '../chars');
				const charsFiles = fs.readdirSync(charsPath).filter(file => file.endsWith('.json') && file !== 'config.json');
				// console.log("Persisting: ", charsFiles, charName);
				const charFile = client.Utils.highestSimilarity(charName, (char) => ({ name: char, aliases: [] }), charsFiles);
				const filePath = path.join(charsPath, charFile);
				const char = require(filePath);
				persistCharacter(char);
				client.characters.set(char.name, new Character(char));
				await interaction.reply({ content: `${char.name} wurde von der Platte neu geladen`, flags: MessageFlags.Ephemeral });
			}
			else if (!charName) {
				client.characters.forEach(c => {
					persistCharacter(c);
				});
				await interaction.reply({ content: 'Alle Charaktere wurden gespeichert', flags: MessageFlags.Ephemeral });
			}
			else {
				const char = client.Utils.highestSimilarity(charName, selectedChar => ({ name: selectedChar.name, aliases: [] }), client.characters);
				persistCharacter(char);
				await interaction.reply({ content: `${char.name} wurde gespeichert`, flags: MessageFlags.Ephemeral });
			}

			return [];
		}
	},
};