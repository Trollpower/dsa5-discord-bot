import fs from 'node:fs';
import path from 'node:path';
import { Character } from '../common/character.js';

export default async function CharacterManager(DiscordClient, RootPath) {
	const charsPath = path.join(RootPath, 'chars');
	const charsFiles = fs.readdirSync(charsPath)
		.filter(file => file.endsWith('.json') && file !== 'config.json');

	for (const file of charsFiles) {
		const character = DiscordClient.Persistence.retrieveCharacter(file).then(persistenceChar => {
			if (persistenceChar) {
				persistenceChar.angelegteWaffen = persistenceChar.angelegteWaffen ?? [];
				DiscordClient.characters.set(persistenceChar.name, new Character(persistenceChar));
			}
			else {
				character.angelegteWaffen = character.angelegteWaffen ?? [];
				DiscordClient.Persistence.persistCharacter(character);
			}
		});
	}
}