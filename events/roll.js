import { Events } from 'discord.js';
import config from '../config.json' with { type: 'json' };
const enableGMChanceImprovement = config.enableGMChanceImprovement;
import path from 'path';
import logger from '../common/logger.js';
import { parseWuerfel, wuerfelWerfen, rollDice } from '../common/common.js';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const wuerfel = interaction.options.getString('würfel') ?? 0;
			const parsedRoll = parseWuerfel(wuerfel);
			const result = wuerfelWerfen(wuerfel);
			logger.debug('roll.command.original-result', logger.traceMeta(interaction, {
				character: character.displayName ?? character.name,
				wuerfel,
				result,
			}));
			if (result.notation.endsWith('d20') && enableGMChanceImprovement && interaction?.isMeister()) {
				const rand = Math.random();
				const randRange = (Math.floor(rand * 100) + 1);
				const improveMeisterChance = randRange <= (character?.cheating?.general ?? 40);
				logger.debug('roll.command.cheat-candidate', logger.traceMeta(interaction, {
					character: character.displayName ?? character.name,
					randRange,
					improveHit: improveMeisterChance === true,
					originalResult: result,
					cheatingOptions: character.cheating,
				}));

				if (improveMeisterChance === true) {
					result.rolls.forEach(function(roll, index) {
						const isCrit = (Math.floor(Math.random() * 100) + 1) <= (character?.cheating?.crit ?? 15);
						logger.debug('roll.command.cheat-roll-adjust', logger.traceMeta(interaction, {
							character: character.displayName ?? character.name,
							originalRoll: roll,
							isCrit,
						}));
						this[index] = isCrit === true ? 1 : roll <= 5 ? roll : roll - 3;
					}, result.rolls);
					result.value = result.rolls.reduce((a, b) => a + b);
					logger.debug('roll.command.final-result', logger.traceMeta(interaction, {
						character: character.displayName ?? character.name,
						result,
					}));
				}
			}

			const event = {
				type: 'event',
				name: 'roll',
				parsedRoll,
				result,
			};

			const embed = {
				title: `Würfelergebnis von ${event.parsedRoll} durch ${character.displayName ?? character.name}!`,
				color: 0x0099ff,
				fields: [
					{ name: 'Ergebnis', value: `${event.result.value}`, inline: false },
					{ name: 'Würfelwurf', value: `${event.result.rolls.join(', ')}`, inline: false },
				],
			};

			await interaction.reply({ embeds: [embed] });

			return [event];

		}
	},
};