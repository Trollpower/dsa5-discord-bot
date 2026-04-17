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
	guildId_testserver: process.env.GUILD_ID_TESTSERVER,
	guildId_pinky: process.env.GUILD_ID_PINKY,
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
rest.put(Routes.applicationGuildCommands(credentials.clientId, credentials.guildId_testserver), { body: commands })
	.then(() => console.log('Successfully registered application commands at Testserver.'))
	.catch(console.error);
rest.put(Routes.applicationGuildCommands(credentials.clientId, credentials.guildId_pinky), { body: commands })
	.then(() => console.log('Successfully registered application commands at Pinky & Brain.'))
	.catch(console.error);
// rest.put(Routes.applicationGuildCommands(credentials.clientId, credentials.guildId_testserver), { body: [] })
// 	.then(() => console.log('Successfully deleted application commands at Testserver.'))
// 	.catch(console.error);
// rest.put(Routes.applicationGuildCommands(credentials.clientId, credentials.guildId_pinky), { body: [] })
// 	.then(() => console.log('Successfully deleted application commands at Pinky & Brain.'))
// 	.catch(console.error);
// rest.put(Routes.applicationCommands(credentials.clientId), { body: [] })
// 	.then(() => console.log('Successfully deleted all application commands.'))
// 	.catch(console.error);