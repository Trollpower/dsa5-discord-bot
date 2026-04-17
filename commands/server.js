import { SlashCommandBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
};