import { Character } from './common/character.js';
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import configJson from './config.json' with { type: 'json' };
import { EventEmitter } from 'node:events';
import { persistCharacter, retrieveCharacter } from './common/persistence.js';
import logger from './common/logger.js';

const token = configJson.token;
const emitter = new EventEmitter();
emitter.setMaxListeners(0);

// Hilfsfunktion für __dirname in ES Modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
client.histories = {};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const commandModule = await import(filePath);
	const command = commandModule.default || commandModule;
	client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const eventModule = await import(filePath);
	const event = eventModule.default || eventModule;

	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, async (...args) => {
			logger.debug('legacy.event.execute', { eventName: event.name });
			const char = getChar(...args);
			const events = await log(event.execute, event, args, char, client);
			if (events && ((events instanceof Array) || events?.type === 'event')) {
				client.histories[char.name] = client.histories[char.name] ?? [];
				client.histories[char.name].push(...events);
			}
		});
	}
}

async function log(func, event, args, character, discordClient) {
	const result = await func(...args, character, discordClient);
	return result;
}

client.characters = new Collection();
client.characterConfig = (await import(path.join(__dirname, 'chars', 'config.json'), { assert: { type: 'json' } })).default;
const charsPath = path.join(__dirname, 'chars');
const charsFiles = fs.readdirSync(charsPath).filter(file => file.endsWith('.json') && file !== 'config.json');

for (const file of charsFiles) {
	const filePath = path.join(charsPath, file);
	const characterModule = await import(filePath, { assert: { type: 'json' } });
	const character = characterModule.default || characterModule;
	client.characters.set(character.name, new Character(character));
	retrieveCharacter(character.name).then(persistenceChar => {
		if (persistenceChar) {
			persistenceChar.angelegteWaffen = persistenceChar.angelegteWaffen ?? [];
			client.characters.set(persistenceChar.name, new Character(persistenceChar));
		}
		else {
			character.angelegteWaffen = character.angelegteWaffen ?? [];
			persistCharacter(character);
		}
	});
}

// Login to Discord with your client's token
client.login(token);

const getChar = (interaction) => {
	const charname = client.characterConfig.alias[interaction.user.username].toLowerCase();
	const char = client.characters.find(c => c.name.toLowerCase() === charname);
	return char;
};