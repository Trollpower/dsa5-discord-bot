import { Events } from 'discord.js';
import { waffenData } from '../data/index.js';
import config from '../config.json' with { type: 'json' };
const enableGMChanceImprovement = config.enableGMChanceImprovement;
import path from 'path';
import { rollDice } from '../common/common.js';
import { createField } from '../common/embeds.js';
import { highestSimilarity } from '../common/search.js';
import logger from '../common/logger.js';

const PARADE_QUICK_CUSTOM_ID_PREFIX = 'parade:quick:';

export { PARADE_QUICK_CUSTOM_ID_PREFIX };

const executeQuickParade = async ({ waffenName, bonusMalus, interaction, character, client }) => {
	const data = parade(character, waffenName, bonusMalus, interaction);
	const embed = createResultEmbedd(character, data, client);
	await interaction.reply({ content: 'Parade mit ' + waffenName, embeds: [embed] });
	return [data];
};

function handleSubcommandParade({ interaction, character, client }) {
	const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
	const waffenName = interaction.options.getString('charwaffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
	return executeQuickParade({ waffenName, bonusMalus, interaction, character, client });
}

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	customIds: [PARADE_QUICK_CUSTOM_ID_PREFIX],
	async execute(interaction, character, client) {
		if (interaction.isButton() && interaction.customId.startsWith(PARADE_QUICK_CUSTOM_ID_PREFIX)) {
			const payload = interaction.customId.slice(PARADE_QUICK_CUSTOM_ID_PREFIX.length);
			// format: sectionKey:waffenName or sectionKey:waffenName:bonusMalus
			const parts = payload.split(':');
			const waffenName = decodeURIComponent(parts[1]);
			const bonusMalus = parts[2] ? parseInt(parts[2]) : 0;
			return executeQuickParade({ waffenName, bonusMalus, interaction, character, client });
		}

		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			return handleSubcommandParade({ interaction, character, client });
		}
	},
	async executeSchip(interaction, eventData, character, client) {
		const data = { ...eventData };
		const paRoll = rollDice(20);
		const paRollBestaetigt = rollDice(20);
		data.roll = paRoll;
		data.rollBestaetigt = paRollBestaetigt;
		const result = {
			fields: [],
		};

		if (data.roll === 1 && data.rollBestaetigt <= data.kampffertigkeit.paBrutto) {
			result.title = `Kritische Parade mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
			result.color = 0x33cc33;
		}
		else if (data.roll === 20 && data.rollBestaetigt > data.kampffertigkeit.paBrutto) {
			result.title = `Patzer bei der Parade mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
			result.color = 0xff3300;
		}
		else {
			result.title = `${(data.roll <= data.kampffertigkeit.paBrutto ? 'Pariert' : 'Nicht pariert')} mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
			result.color = data.roll <= data.kampffertigkeit.paBrutto ? 0x33cc33 : 0xff3300;
			result.fields.push({ name: 'Paradewert', value: `${data.kampffertigkeit.paBrutto} (${data.kampffertigkeit.pa})`, inline: true });
			result.fields.push({ name: 'Würfelwurf', value: data.roll, inline: true });
		}
		await interaction.reply({ content: 'Schicksalspunkt für Parade mit ' + data.waffe.name, embeds: [result] });
		return [data];
	},
};

const parade = (character, waffenName, bonusMalus, interaction) => {
	const waffe = highestSimilarity(waffenName, weapon => ({ name: weapon.name, aliases: [] }), waffenData);
	let kampffertigkeit = character.kampftechniken.find(k => k.name.toLowerCase() === waffe.technik.toLowerCase());
	if (!kampffertigkeit) {
		kampffertigkeit = {
			name: waffe.technik,
			ktw: 6,
		};
	}

	const belastung = character.getBelastungsmalus();
	const le = character.besteLeiteigenschaft(waffe);
	const mod = Math.floor((le.val - 8) / 3);
	kampffertigkeit.pa = ((mod)) + (kampffertigkeit.ktw > 6 ? Math.ceil(kampffertigkeit.ktw / 2) : 3);
	let waffePa = parseInt(waffe.pa);
	if (waffe.technik === 'Schilde') {waffePa = waffePa * 2;}
	kampffertigkeit.paBrutto = kampffertigkeit.pa + bonusMalus + waffePa - belastung;
	let paRoll = rollDice(20);
	let paRollBestaetigt = rollDice(20);
	let gmChanceImproved = false;

	if (enableGMChanceImprovement && interaction?.isMeister()) {
		const rand = Math.random();
		const randRange = (Math.floor(rand * 100) + 1);
		const improveMeisterChance = randRange <= (character?.cheating?.general ?? 30);
		const improveMeisterCrit = randRange <= (character?.cheating?.crit ?? 10);
		logger.debug('combat.parry.cheat-candidate', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			randRange,
			improveParry: improveMeisterChance === true,
			improveCrit: improveMeisterCrit === true,
			original: { paRoll, paRollBestaetigt, paBrutto: kampffertigkeit?.paBrutto },
			cheatingOptions: character.cheating,
		}));
		if (improveMeisterCrit === true) {paRoll = 1;}
		else if (improveMeisterChance === true) {
			paRoll = paRoll <= 5 ? paRoll : paRoll - 3;
			paRollBestaetigt = paRollBestaetigt <= 2 ? paRollBestaetigt : paRollBestaetigt - 2;
		}
		gmChanceImproved = (improveMeisterChance || improveMeisterCrit);
		logger.debug('combat.parry.cheat-applied', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			adjusted: { paRoll, paRollBestaetigt, paBrutto: kampffertigkeit?.paBrutto },
			cheated: gmChanceImproved,
		}));
	}
	const event = {
		type: 'event',
		name: 'parade',
		waffe,
		kampffertigkeit,
		roll: paRoll,
		rollBestaetigt: paRollBestaetigt,
		bonusMalus,
		le,
		belastung,
		cheated: gmChanceImproved,
	};
	return event;
};

const createResultEmbedd = (character, data, client, waffe = { ...data }) => {
	const result = {
		fields: [],
	};

	if (data.roll === 1 && data.rollBestaetigt <= data.kampffertigkeit.paBrutto) {
		result.title = `⭐ Kritische Parade mit ${waffe.name} durch ${character.displayName ?? character.name}`;
		result.color = 0x33cc33;
		result.fields.push({ name: 'Bestätigungswurf', value: data.rollBestaetigt, inline: true });
	}
	else if (data.roll === 20 && data.rollBestaetigt > data.kampffertigkeit.paBrutto) {
		result.title = `💩 Patzer bei der Parade mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
		result.color = 0xff3300;
	}
	else {
		result.title = `${(data.roll <= data.kampffertigkeit.paBrutto ? '🏆 Pariert' : '💥 Nicht pariert')} mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
		result.color = data.roll <= data.kampffertigkeit.paBrutto ? 0x33cc33 : 0xff3300;
	}
	let waffePa = parseInt(waffe.pa);
	if (waffe.technik === 'Schilde') {waffePa = waffePa * 2;}
	const paradeWertField = createField(
		{
			fieldName: `Paradewert ${data.kampffertigkeit.paBrutto}`,
			fieldValues: [
				{ key: 'Grundwert', value: `${Math.ceil(data.kampffertigkeit.ktw / 2)}` },
				{ key: `Leiteigenschaft ${data.le.eig} ${character.eigenschaften[data.le.eig]}`, value: `${Math.floor((data.le.val - 8) / 3)}` },
				{ key: 'Bonus/Malus', value: `${data.bonusMalus}` },
				{ key: 'Waffe', value: `${waffePa}` },
				{ key: 'Belastung', value: `${data.belastung}` },
			],
		},
	);

	result.fields.push(paradeWertField);
	result.fields.push({ name: 'Würfelwurf', value: data.roll, inline: true });
	if (data.cheated === true) {
		result.title = `__${result.title}__`;
	}
	return result;
};