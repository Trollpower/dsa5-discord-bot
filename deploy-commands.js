import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials from environment variables
const credentials = {
	clientId: process.env.CLIENT_ID,
	guildIds: process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean) : [],
	token: process.env.DISCORD_TOKEN,
};

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	console.log(file);
	const filePath = path.join(commandsPath, file);
	const commandModule = await import(pathToFileURL(filePath).href);
	const command = commandModule.default ?? commandModule;
	console.log('adding command ', command.data.name);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(credentials.token);

if (credentials.guildIds.length === 0) {
	console.error('No guild IDs configured. Set GUILD_IDS in your .env file (comma-separated).');
	process.exit(1);
}

for (const guildId of credentials.guildIds) {
	rest.put(Routes.applicationGuildCommands(credentials.clientId, guildId), { body: commands })
		.then(() => console.log(`Successfully registered application commands at guild ${guildId}.`))
		.catch(console.error);
}