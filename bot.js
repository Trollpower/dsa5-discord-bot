import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { Client, GatewayIntentBits, Partials, Collection, BaseInteraction } from 'discord.js';
import config from './config.json' with { type: 'json' };
import { EventManager, CharacterManager } from './managers/managers.js';
import { Utils, Persistence, Common } from './common/index.js';
import logger from './common/logger.js';
import { createEventHistoryProvider } from './common/eventHistoryProvider.js';

// Create credentials object from environment variables
const credentials = {
	clientId: process.env.CLIENT_ID,
	guildIds: process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean) : [],
	token: process.env.DISCORD_TOKEN,
};

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		logger.error('startup.env.missing', { envVar, message: 'Please check your .env file' });
		process.exit(1);
	}
}

(async () => {
	const DirPath = __dirname;
	const DiscordClient = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
		partials: [Partials.Channel],
	});

	BaseInteraction.prototype.isMeister = function() {
		const { meister } = config;
		const isMeister = meister.some(x => x.toLowerCase() === this.user.username.toLowerCase())
			|| DiscordClient.temporaryMeisters?.has(this.user.id);
		return isMeister === true;
	};

	DiscordClient.histories = {};
	DiscordClient.lastQuickFollowups = {};
	DiscordClient.limitCommandUses = new Collection();
	DiscordClient.expireAfter = new Collection();
	DiscordClient.messageCommands = new Collection();
	DiscordClient.messageCommands_Aliases = new Collection();
	DiscordClient.events = new Collection();
	DiscordClient.commands = new Collection();
	DiscordClient.slashCommands = new Collection();
	DiscordClient.contextMenus = new Collection();
	DiscordClient.selectMenus = new Collection();
	DiscordClient.buttonCommands = new Collection();
	DiscordClient.modalForms = new Collection();
	DiscordClient.Utils = Utils;
	DiscordClient.Persistence = Persistence;
	DiscordClient.Common = Common;
	DiscordClient.characterConfig = config;
	DiscordClient.activeCharactersByUser = new Collection();
	DiscordClient.temporaryMeisters = new Set();
	DiscordClient.eventHistoryProvider = createEventHistoryProvider(config);
	// Make credentials available to other parts.
	DiscordClient.credentials = credentials;
	DiscordClient.characters = new Collection();

	try {
		await EventManager(DiscordClient, DirPath);
		await CharacterManager(DiscordClient, DirPath);
		await DiscordClient.login(credentials.token);
		logger.info('startup.success', { message: 'DSA-Bot successfully started', color: 'green' });
	}
	catch (error) {
		logger.error('startup.failed', { error });
		if (error.code === 'TokenInvalid') {
			logger.error('startup.token.invalid', { message: 'Invalid Discord token. Please check your DISCORD_TOKEN in .env file' });
		}
		process.exit(1);
	}
})();