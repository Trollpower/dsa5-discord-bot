export const name = 'interactionCreate';
import { MessageFlags } from 'discord.js';
import logger from '../common/logger.js';

const matchesInteractionEvent = (event, interaction) => {
	const commandMatch = event.type === 'interactionCreate'
		&& (event.name === interaction.commandName || event.name === '*');
	const customIdMatch = Boolean(
		event.customIds
		&& interaction.customId
		&& event.customIds.some(customId => interaction.customId.startsWith(customId)),
	);

	return commandMatch || customIdMatch;
};

const appendEventHistory = async ({ DiscordClient, interaction, character, events, traceId, fallbackEventName }) => {
	if (events == null) {
		return;
	}
	logger.debug('interaction.handler.event-history.append.start', {
		traceId,
		character: character?.displayName ?? character?.name,
		payloadType: Array.isArray(events) ? 'array' : typeof events,
		payloadLength: Array.isArray(events) ? events.length : undefined,
		eventName: Array.isArray(events) ? fallbackEventName : events?.name ?? fallbackEventName,
	});

	if (character?.name) {
		DiscordClient.histories[character.name] = DiscordClient.histories[character.name] ?? [];
		DiscordClient.histories[character.name].push(events);
	}
	try {
		await DiscordClient.eventHistoryProvider?.appendEvents({
			events,
			interaction,
			characterName: character?.name ?? null,
			traceId,
			fallbackEventName,
		});
	}
	catch (error) {
		logger.error('interaction.handler.event-history.persist.error', {
			traceId,
			character: character?.name,
			fallbackEventName,
			error,
		});
	}
};

export async function execute(interaction, DiscordClient) {
	const traceId = logger.ensureInteractionTraceId(interaction);
	logger.debug('interaction.handler.start', {
		traceId,
		commandName: interaction.commandName,
		customId: interaction.customId,
		interactionType: interaction.type,
		user: interaction.user?.username,
	});
	const eventsCollection = DiscordClient.events;
	// console.log(`command: ${interaction.commandName}`, eventsCollection);
	for (const props of eventsCollection.values()) {
		const event = props.default;
		// console.log(`eventsCollection event: ${event.name}, ${event.type}, ${interaction.commandName}`)
		if (!matchesInteractionEvent(event, interaction)) {
			continue;
		}

		try {
			// console.log(`${event.name}`);
			const char = DiscordClient.Utils.getChar(interaction, DiscordClient);
			logger.debug('interaction.handler.event.execute', {
				traceId,
				eventName: event.name,
				character: char?.displayName ?? char?.name,
			});
			const events = await event.execute(interaction, char, DiscordClient);
			logger.info('interaction.handler.event.executed', {
				traceId,
				eventName: event.name,
				character: char?.displayName ?? char?.name,
				execAppendEventHistory: events != null,
				fertigkeit: Array.isArray(events)
					? (events[0]?.fertigkeit?.name ?? undefined)
					: (events?.fertigkeit?.name ?? undefined),
			});
			if (events != null) {
				await appendEventHistory({
					DiscordClient,
					interaction,
					character: char,
					events,
					traceId,
					fallbackEventName: event.name,
				});
			}
		}
		catch (error) {
			logger.error('interaction.handler.event.error', {
				traceId,
				eventName: event.name,
				error,
			});
			try {
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: `Fehler in ${event.name}`, flags: MessageFlags.Ephemeral });
				}
				else {
					await interaction.reply({ content: `Fehler in ${event.name}`, flags: MessageFlags.Ephemeral });
				}
			}
			catch (replyError) {
				logger.error('interaction.handler.error-reply.failed', { traceId, eventName: event.name, error: replyError });
			}
		}
	}
	logger.debug('interaction.handler.end', { traceId, commandName: interaction.commandName, customId: interaction.customId });
}