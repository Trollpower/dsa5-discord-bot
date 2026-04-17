import { Events } from 'discord.js';
import path from 'path';

const normalizeLastEvent = (candidate) => {
	if (!candidate) {
		return null;
	}
	if (Array.isArray(candidate)) {
		return candidate[0] ?? null;
	}
	if (candidate.payload !== undefined) {
		return Array.isArray(candidate.payload)
			? candidate.payload[0] ?? null
			: candidate.payload;
	}
	return candidate;
};

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const lastRecord = client.eventHistoryProvider?.readLastEvent({
				characterName: character.name,
				ignoreEventNames: ['schip'],
			});
			const event = normalizeLastEvent(lastRecord)
				?? normalizeLastEvent(client.histories[character.name]?.slice(-1)[0]);
			if (!event) {return interaction.reply({ content: 'Kein Event vorhanden, Schicksalspunkt gespart.' });}
			// console.log(client.events);
			const eventHandler = client.events.map(x => x.default).find(c => c.name.toLowerCase() === event.name);
			if (eventHandler && typeof (eventHandler.executeSchip) === 'function') {
				const data = await eventHandler.executeSchip(interaction, event, character, client);
				return data;
			}
			else {
				interaction.reply({ content: `Schicksalspunktfunktion für ${event.name} noch nicht implementiert` });
			}

			interaction.reply({ content: 'Schicksalspunkt nicht eingesetzt' });
		}
	},
};