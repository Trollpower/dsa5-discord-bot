import fs from 'node:fs';
import { Events, MessageFlags } from 'discord.js';
import path from 'path';
import { Character } from '../common/character.js';
import { persistCharacter } from '../common/persistence.js';
import { highestSimilarity } from '../common/search.js';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const charName = interaction.options.getString('character-name');
			const reloadFromDisc = interaction.options.getBoolean('reload-from-disc') ?? false;
			if (reloadFromDisc && !charName) {
				const charsPath = path.resolve('chars');
				const charsFiles = fs.readdirSync(charsPath).filter(file => file.endsWith('.json') && file !== 'config.json');

				for (const file of charsFiles) {
					const filePath = path.join(charsPath, file);
					const char = JSON.parse(fs.readFileSync(filePath, 'utf8'));
					char.angelegteWaffen = char.angelegteWaffen ?? [];
					client.characters.set(char.name, new Character(char));
				}
				await interaction.reply({ content: `${charsFiles.length} Charaktere wurden neu von der Platte eingelesen`, flags: MessageFlags.Ephemeral });
			}
			else if (reloadFromDisc) {
				const charsPath = path.resolve('chars');
				const charsFiles = fs.readdirSync(charsPath).filter(file => file.endsWith('.json') && file !== 'config.json');
				const charFile = highestSimilarity(charName, (file) => ({ name: path.basename(file, '.json'), aliases: [] }), charsFiles);
				const filePath = path.join(charsPath, charFile);
				const char = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				char.angelegteWaffen = char.angelegteWaffen ?? [];
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
				const char = highestSimilarity(charName, selectedChar => ({ name: selectedChar.name, aliases: [] }), client.characters);
				persistCharacter(char);
				await interaction.reply({ content: `${char.name} wurde gespeichert`, flags: MessageFlags.Ephemeral });
			}

			return [];
		}
	},
};