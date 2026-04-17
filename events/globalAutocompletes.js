import { InteractionType, Events } from 'discord.js';
import {
	liturgienData,
	ritualeData,
	zaubermelodienData,
	elfenliederData,
	zauberData,
	sonderfertigkeitenData,
	elixiereData,
	hexenfluecheData,
	gifteData,
	krankheitenData,
	segnungenData,
	zeremonienData,
	waffenData,
	ruestungenData,
	fertigkeitenData,
	vorteileData,
	nachteileData,
	pflanzenData,
	bestiariumData,
} from '../data/index.js';
import logger from '../common/logger.js';

export default {
	type: Events.InteractionCreate,
	name: '*',
	async execute(interaction, character, client) {
		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			const focusedOption = interaction.options.getFocused(true);
			const subcommand = interaction.commandName === 'char'
				? interaction.options.getSubcommand(false)
				: null;
			const isFavoriteSlot = ['favorit1', 'favorit2', 'favorit3'].includes(subcommand);
			const isProbeFavoriteSlot = focusedOption.name === 'fertigkeit' && isFavoriteSlot;

			if (focusedOption.name === 'basismanoever' && isFavoriteSlot) {
				const bmList = client.Utils.basismanoever()
					.filter(bm => character.sonderfertigkeiten.some(x => x.name === bm.name))
					.filter(bm => bm.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
				return await interaction.respond(
					bmList.slice(0, 25).map(choice => ({ name: choice.name, value: choice.name })),
				);
			}

			if (focusedOption.name === 'angriff' && isFavoriteSlot) {
				const waffen = (character.angelegteWaffen ?? [])
					.filter(w => w.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
				return await interaction.respond(
					waffen.slice(0, 25).map(w => ({ name: w, value: w })),
				);
			}

			let options = [];
			switch (focusedOption.name) {
			case 'liturgiename':
				options = liturgienData;
				break;
			case 'ritualname':
				options = ritualeData;
				break;
			case 'zaubermelodiename':
				options = zaubermelodienData;
				break;
			case 'elfenliedname':
				options = elfenliederData;
				break;
			case 'zaubername':
				options = zauberData;
				break;
			case 'vorteilname':
				options = vorteileData;
				break;
			case 'nachteilname':
				options = nachteileData;
				break;
			case 'sonderfertigkeitname':
				options = sonderfertigkeitenData;
				break;
			case 'elixiername':
				options = elixiereData;
				break;
			case 'hexenfluchname':
				options = hexenfluecheData;
				break;
			case 'giftname':
				options = gifteData;
				break;
			case 'krankheitname':
				options = krankheitenData;
				break;
			case 'segnungname':
				options = segnungenData;
				break;
			case 'zeremoniename':
				options = zeremonienData;
				break;
			case 'waffenname':
				options = waffenData;
				break;
			case 'ruestungname':
				options = ruestungenData;
				break;
			case 'fertigkeitsname':
			case 'fertigkeit':
				options = [
					...fertigkeitenData,
					...liturgienData,
					...ritualeData,
					...zaubermelodienData,
					...elfenliederData,
					...zauberData,
					...segnungenData,
					...zeremonienData,
					...hexenfluecheData];
				break;
			case 'charactername':
				options = client.characters.map(c => ({ name: c.name }));
				break;
			case 'charwaffenname':
				options = waffenData.filter(waffe => character.angelegteWaffen.includes(waffe.name));
				break;
			case 'pflanzenname':
				options = pflanzenData;
				break;
			case 'detailname':
				options = [
					...elfenliederData,
					...elixiereData,
					...fertigkeitenData,
					...gifteData,
					...hexenfluecheData,
					...krankheitenData,
					...liturgienData,
					...nachteileData,
					...pflanzenData,
					...ruestungenData,
					...ritualeData,
					...segnungenData,
					...sonderfertigkeitenData,
					...vorteileData,
					...waffenData,
					...zaubermelodienData,
					...zauberData,
					...zeremonienData,
					...bestiariumData];
			}

			if (options.length > 0) {
				const filtered = client.Utils.highestSimilarities(focusedOption.value, (option) => ({ name: option.name, aliases: [] }), options);
				if (filtered.length > 25) {return;}
				logger.debug('autocomplete.respond', logger.traceMeta(interaction, {
					option: focusedOption.name,
					query: focusedOption.value,
					resultCount: filtered.length,
				}));
				const choices = filtered.map(choice => ({
					name: `${choice.name} (${choice.quelle})`,
					value: isProbeFavoriteSlot ? `${choice.kategorie}|${choice.name}` : choice.name,
				}));

				if (isProbeFavoriteSlot) {
					const slotIndex = Number(String(subcommand).replace('favorit', '')) - 1;
					const assigned = character?.quickProbeFavorites?.[slotIndex];
					if (assigned?.name && assigned?.category) {
						const assignedValue = `${assigned.category}|${assigned.name}`;
						if (!choices.some(choice => choice.value === assignedValue)) {
							choices.unshift({
								name: `[Aktuell] ${assigned.label || assigned.name}`,
								value: assignedValue,
							});
						}
					}
				}

				return await interaction.respond(choices.slice(0, 25));
			}
		}
	},
};