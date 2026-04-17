import { InteractionType, Events } from 'discord.js';
import logger from '../common/logger.js';

const getTypeName = (type) => InteractionType[type] ?? 'Unknown';

const mapOptionValue = (value) => {
	if (typeof value === 'bigint') return value.toString();
	return value;
};

export default {
	type: Events.InteractionCreate,
	name: '*',
	async execute(interaction) {
		if (!logger.isLevelEnabled('debug')) return;

		const typeName = getTypeName(interaction.type);
		const baseMeta = logger.traceMeta(interaction, {
			user: interaction.user?.username,
			type: typeName,
			command: interaction.commandName,
		});

		logger.debug('interaction.trace', baseMeta);
		switch (interaction.type) {
		case InteractionType.Ping:
			logger.debug('interaction.ping', baseMeta);
			break;
		case InteractionType.ApplicationCommand:
			logger.debug('interaction.command', {
				...baseMeta,
				subcommand: interaction.options?._subcommand,
				options: (interaction.options?._hoistedOptions ?? []).map(o => ({
					name: o.name,
					value: mapOptionValue(o.value),
				})),
			});
			break;
		case InteractionType.MessageComponent:
			logger.debug('interaction.component', baseMeta);
			break;
		case InteractionType.ApplicationCommandAutocomplete:
		{
			const focusedOption = interaction.options.getFocused(true);
			logger.debug('interaction.autocomplete', {
				...baseMeta,
				option: focusedOption.name,
				value: mapOptionValue(focusedOption.value),
			});
			break;
		}
		case InteractionType.ModalSubmit:
			logger.debug('interaction.modal', baseMeta);
			break;
		default:
			logger.debug('interaction.other', baseMeta);
			break;
		}
	},
};