import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

export default {
	data: new SlashCommandBuilder()
		.setName('quick')
		.setDescription('Zeigt Schnellzugriff-Buttons für Proben, KSF, Angriff, Parade und Ausweichen'),
};
