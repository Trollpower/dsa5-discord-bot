import path from 'node:path';
import fs from 'node:fs';
import logger from './logger.js';

export async function persistCharacter(character) {
	logger.debug('character.persist', { character: character?.displayName ?? character?.name });
	fs.writeFileSync(path.join(path.resolve('chars'), `${character.name.toLowerCase()}.json`), JSON.stringify(character, null, 4), 'utf8');
}

export async function retrieveCharacter(filename) {
	const data = fs.readFileSync(path.join(path.resolve('chars'), `${filename}`));
	return JSON.parse(data);
}