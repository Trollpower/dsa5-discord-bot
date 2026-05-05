import stringSim from 'string-similarity';
import { waffenData } from '../data/index.js';
import config from '../config.json' with { type: 'json' };
const enableGMChanceImprovement = config.enableGMChanceImprovement;
import { parseWuerfel, wuerfelWerfenParsed, rollDice } from './common.js';
import { nachteile as nachteileFunctions, vorteile as vorteileFunctions } from './vorteileNachteileFunctions.js';
import { sonderfertigkeiten as sonderfertigkeitenFunctions } from './sonderfertigkeitenFunctions.js';
import logger from './logger.js';
const addFunc = [...nachteileFunctions, ...vorteileFunctions, ...sonderfertigkeitenFunctions];

export const applyPre = (props) => {
	const { event, character, interaction } = props;
	const isMeister = interaction.isMeister();

	applyEffects(addFunc.map(n => n.pre), { character, event }, isMeister);
};

export const applyPost = (props) => {
	const { event, character, interaction } = props;
	const isMeister = interaction.isMeister();

	applyEffects(addFunc.map(n => n.post), { character, event }, isMeister);
};

const getChar = (interaction, client) => {
	if (!interaction.user?.username) return;
	const activeCharacterName = interaction.user?.id
		? client.activeCharactersByUser?.get(interaction.user.id)
		: null;
	const charName = activeCharacterName ?? client.characterConfig.alias[interaction.user.username];
	if (!charName) return;
	const char = client.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
	return char;
};

const createField = (props) => {
	const {
		fieldName,
		fieldValues,
		isInline = true,
		valueFormatting = '`',
		keyFormatting = '__',
	} = props;
	return {
		name: `${keyFormatting}${fieldName}${keyFormatting}`,
		value: fieldValues.filter(kv => kv !== null).map(kv => `${kv.key}${kv.value ? ':' : ''} ${kv.value ? `${valueFormatting}${kv.value}${valueFormatting}` : ''}  
`).join(''), inline: isInline,
	};
};

const addSortedListField = (embed, list, fieldName, mapItem, isInline = true) => {
	if (!list?.length) return;
	embed.fields.push(createField({
		fieldName,
		fieldValues: list.sort((a, b) => a.name.localeCompare(b.name)).map(mapItem),
		isInline,
	}));
};

export default {
	getChar: getChar,
	createField: createField,
	createEmbedFromCharacter: (character) => {
		// console.log(character);
		const embed = {
			color: 0x0099ff,
			title: `__**${character.displayName ?? character.name}**__`,
			...(character.wesenszug ? { description: `> ${character.wesenszug}` } : {}),
			fields: [],
		};
		embed.fields.push(createField(
			{
				fieldName: '🔢 Eigenschaften',
				fieldValues: [
					{ key: '💢 MU', value: character.eigenschaften['MU'] },
					{ key: '🧠 KL', value: character.eigenschaften['KL'] },
					{ key: '👁️‍🗨️ IN', value: character.eigenschaften['IN'] },
					{ key: '💋 CH', value: character.eigenschaften['CH'] },
					{ key: '🖐 FF', value: character.eigenschaften['FF'] },
					{ key: '🕺 GE', value: character.eigenschaften['GE'] },
					{ key: '🫀 KO', value: character.eigenschaften['KO'] },
					{ key: '💪 KK', value: character.eigenschaften['KK'] },
				],
				isInline: true,
			}));
		embed.fields.push(createField(
			{
				fieldName: '🌡 Werte',
				fieldValues: [
					{ key: '💉 LeP', value: `${character.lep.aktuell} / ${character.lep.max}` },
					character.asp ? { key: '🔮 AsP', value: `${character.asp.aktuell} / ${character.asp.max}` } : null,
					{ key: '⚕ ZK', value: `${character.zk}` },
					{ key: '🪬 SK', value: `${character.sk ?? ''}` },
					{ key: '👟 GS', value: `${character.gs}` },
				],
			},
		));

		addSortedListField(embed, character.talente, '💪 Talente', talent => ({ key: talent.name, value: talent.fertigkeitswert }));
		addSortedListField(embed, character.kampftechniken, '🤺 Kampftechniken', kt => ({ key: kt.name, value: kt.ktw }));
		addSortedListField(embed, character.sonderfertigkeiten, '🕺 Sonderfertigkeiten', sf => ({ key: sf.name }));
		addSortedListField(embed, character.zauber, '🪄 Zauber', item => ({ key: item.name, value: item.fertigkeitswert }));
		addSortedListField(embed, character.elfenlieder, '🧝 Elfenlieder', item => ({ key: item.name, value: item.fertigkeitswert }));
		addSortedListField(embed, character.liturgien, '😇 Liturgien', item => ({ key: item.name, value: item.fertigkeitswert }));
		addSortedListField(embed, character.rituale, '🔯 Rituale', item => ({ key: item.name, value: item.fertigkeitswert }));
		addSortedListField(embed, character.nachteile, '🤢 Nachteile', item => ({ key: `${item.name}${item.category != undefined ? ` (${item.category})` : ''}` }));
		addSortedListField(embed, character.vorteile, '🤩 Vorteile', item => ({ key: `${item.name}${item.category != undefined ? ` (${item.category})` : ''}` }));

		if (character.waffen?.length > 0) {
			const { angelegteWaffen = [] } = character;
			embed.fields.push(createField(
				{
					fieldName: '🗡 Waffen',
					fieldValues: character.waffen.sort((a, b) => a.localeCompare(b)).map(item => ({ key: item, value: angelegteWaffen.includes(item) ? 'X' : null })),
					isInline: true,
				},
			));
		}
		if (character.ruestungen?.length > 0) {
			const { angelegteRuestung = '' } = character;
			embed.fields.push(createField(
				{
					fieldName: '🕴 Rüstungen',
					fieldValues: character.ruestungen.sort((a, b) => a.localeCompare(b)).map(item => ({ key: item, value: item === angelegteRuestung ? 'X' : null })),
					isInline: true,
				},
			));
		}
		return [embed];
	},
	attack({ character, waffenName, bonusMalusAngriff, bonusMalusSchaden = 0, interaction }) {
		const waffe = this.highestSimilarity(waffenName, weapon => ({ name: weapon.name, aliases: [] }), waffenData);
		let kampffertigkeit = { ...character.kampftechniken.find(k => k.name.toLowerCase() === waffe.technik.toLowerCase()) };

		if (!kampffertigkeit) {
			kampffertigkeit = {
				name: waffe.technik,
				ktw: 6,
			};
		}

		const belastung = character.getBelastungsmalus();
		kampffertigkeit.at = Math.floor((character.eigenschaften.MU - 8) / 3) + (kampffertigkeit.ktw > 6 ? kampffertigkeit.ktw : 6);
		kampffertigkeit.atBrutto = kampffertigkeit.at + bonusMalusAngriff + parseInt(waffe.at ?? '0') - belastung;
		const schadensbonus = character.besteLeiteigenschaft(waffe);
		const characterName = character.displayName ?? character.name;
		logger.debug('combat.attack.lead-attribute', logger.traceMeta(interaction, { character: characterName, weapon: waffe.name, lead: schadensbonus }));
		const parsedRoll = parseWuerfel(waffe.tp);
		parsedRoll.modifier += schadensbonus.bonus + bonusMalusSchaden;
		logger.debug('combat.attack.parsed-roll', logger.traceMeta(interaction, { character: characterName, weapon: waffe.name, parsedRoll }));
		const schaden = wuerfelWerfenParsed(parsedRoll);
		logger.debug('combat.attack.damage-roll', logger.traceMeta(interaction, { character: characterName, weapon: waffe.name, damage: { value: schaden.value, rolls: schaden.rolls } }));
		let atRoll = rollDice(20);
		let atBestaetigt = rollDice(20);
		let gmChanceImproved = false;
		if (enableGMChanceImprovement && interaction?.isMeister()) {
			const rand = Math.random();
			const randRange = (Math.floor(rand * 100) + 1);
			const improveMeisterChance = randRange <= (character?.cheating?.general ?? 30);
			const improveMeisterCrit = randRange <= (character?.cheating?.crit ?? 10);
			logger.debug('combat.attack.cheat-candidate', logger.traceMeta(interaction, {
				character: characterName,
				randRange,
				improveHit: improveMeisterChance,
				improveCrit: improveMeisterCrit,
				original: { atRoll, atBestaetigt, atBrutto: kampffertigkeit?.atBrutto },
				cheatingOptions: character.cheating,
			}));
			if (improveMeisterCrit === true) {
				atRoll = 1;
			}
			else if (improveMeisterChance === true) {
				atRoll = atRoll <= 5 ? atRoll : atRoll - 3;
				atBestaetigt = atBestaetigt <= 2 ? atBestaetigt : atBestaetigt - 2;
			}
			gmChanceImproved = (improveMeisterChance || improveMeisterCrit);
			schaden.rolls.forEach(function(roll, index) {
				if (roll < parsedRoll.dice) {
					const newRoll = roll + 1;
					this[index] = newRoll;
					schaden.value = schaden.value + 1;
				}
			}, schaden.rolls);
			logger.debug('combat.attack.cheat-applied', logger.traceMeta(interaction, {
				character: characterName,
				adjusted: {
					atRoll,
					atBestaetigt,
					atBrutto: kampffertigkeit?.atBrutto,
					damageRolls: schaden.rolls,
					damageValue: schaden.value,
				},
			}));
		}

		const event = {
			type: 'event',
			name: 'angriff',
			waffe,
			kampffertigkeit,
			schaden,
			parsedRoll,
			atRoll,
			atBestaetigt,
			bonusMalusAngriff,
			bonusMalusSchaden,
			belastung,
			le: schadensbonus,
			cheated: gmChanceImproved,
		};
		return event;
	},
	createResultEmbedFromAttack({ character, data, client }) {
		const result = {
			fields: [],
		};
		const isCrit = data.atRoll === 1 && data.atBestaetigt <= data.kampffertigkeit.atBrutto;
		if (isCrit === true) {
			result.title = `⭐ Kritischer Treffer mit ${data.waffe.name} durch ${character.displayName ?? character.name}!`;
			result.color = 0x33cc33;
		}
		else if (data.atRoll === 20 && data.atBestaetigt > data.kampffertigkeit.atBrutto) {
			result.title = `💩 Patzer mit ${data.waffe.name} durch ${character.displayName ?? character.name}!`;
			result.color = 0xff00ff;
		}
		else if (data.atRoll > data.kampffertigkeit.atBrutto || data.atRoll >= 20) {
			result.title = `💥 Fehlschlag mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
			result.color = 0xff3300;
		}
		else {
			result.title = `🏆 Treffer mit ${data.waffe.name} durch ${character.displayName ?? character.name}`;
			result.color = 0x33cc33;
		}

		const attackeWertField = client.Utils.createField(
			{
				fieldName: `Angriffswert **${data.kampffertigkeit.atBrutto}**`,
				fieldValues: [
					{ key: 'KTW', value: `${data.kampffertigkeit.ktw}` },
					{ key: 'Bonus/Malus', value: `${data.bonusMalusAngriff}` },
					data.waffe.at ? { key: 'Waffe', value: `${data.waffe.at}` } : null,
					{ key: `MUT ${character.eigenschaften.MU}`, value: `${Math.floor((character.eigenschaften.MU - 8) / 3)}` },
					{ key: 'Belastung', value: `${data.belastung}` },
					{ key: 'Trefferwurf', value: `${data.atRoll}` },
				],
			},
		);
		result.fields.push(attackeWertField);

		const schadenWertField = client.Utils.createField(
			{
				fieldName: `Schaden **${isCrit === true ? data.schaden.value * 2 : data.schaden.value}**`,
				fieldValues: [
					{ key: 'Waffe', value: `${data.waffe.tp}` },
					{ key: 'Bonus/Malus', value: `${data.bonusMalusSchaden}` },
					{ key: `Leiteigenschaft ${data.le.eig} ${character.eigenschaften[data.le.eig]}`, value: `${data.le.bonus}` },
					{ key: 'Gewürfelt', value: `${data.schaden.rolls}` },
					isCrit === true ? { key: '__**Kritischer Treffer**__', value: '' } : null,
				],
			},
		);
		result.fields.push(schadenWertField);

		if (data.waffe.hinweis) {
			result.fields.push({ name: 'Hinweis', value: data.waffe.hinweis });
		}

		if (data.cheated === true) {
			result.title = `__${result.title}__`;
		}
		return result;
	},
	basismanoever() {
		return [
			{ name: 'Finte I', value: 'finte+1', sfName: 'Finte I-III', at: 1, tp: 0 },
			{ name: 'Finte II', value: 'finte+2', sfName: 'Finte I-III', at: 2, tp: 0 },
			{ name: 'Finte III', value: 'finte+3', sfName: 'Finte I-III', at: 3, tp: 0 },
			{ name: 'Wuchtschlag I', value: 'wuchtschlag+1', sfName: 'Wuchtschlag I-III', at: 2, tp: 2 },
			{ name: 'Wuchtschlag II', value: 'wuchtschlag+2', sfName: 'Wuchtschlag I-III', at: 4, tp: 4 },
			{ name: 'Wuchtschlag III', value: 'wuchtschlag+3', sfName: 'Wuchtschlag I-III', at: 6, tp: 6 },
			{ name: 'Präziser Schuss/Wurf I', value: 'präziserschuss+1', sfName: 'Präziser Schuss/Wurf I-III', at: 2, tp: 2 },
			{ name: 'Präziser Schuss/Wurf II', value: 'präziserschuss+2', sfName: 'Präziser Schuss/Wurf I-III', at: 4, tp: 4 },
			{ name: 'Präziser Schuss/Wurf III', value: 'präziserschuss+3', sfName: 'Präziser Schuss/Wurf I-III', at: 6, tp: 6 },
			{ name: 'Präziser Stich I', value: 'präziserstich+1', sfName: 'Präziser Stich I-III', at: 1, tp: 0 },
			{ name: 'Präziser Stich II', value: 'präziserstich+2', sfName: 'Präziser Stich I-III', at: 1, tp: 0 },
			{ name: 'Präziser SStich III', value: 'präziserstich+3', sfName: 'Präziser Stich I-III', at: 1, tp: 0 },
		];
	},

	highestSimilarity(inputString, comparePropertyAccessor, sourceArray) {
		const normalizedInput = String(inputString ?? '').toLowerCase();
		if (!normalizedInput) return;

		// Suche nach exaktem Name-Match.
		const exactMatch = sourceArray.find(f => comparePropertyAccessor(f).name.toLowerCase() === normalizedInput);
		if (exactMatch) {
			return exactMatch;
		}

		// Suche nach Name-Prefix-Match.
		const prefixMatch = sourceArray.find(f => comparePropertyAccessor(f).name.toLowerCase().startsWith(normalizedInput));
		if (prefixMatch) {
			return prefixMatch;
		}

		// Suche nach Alias-Prefix-Match (case-insensitive).
		const aliasMatch = sourceArray.find(f => (comparePropertyAccessor(f).aliases ?? []).some(alias => alias.toLowerCase().startsWith(normalizedInput)));
		if (aliasMatch) {
			return aliasMatch;
		}

		// Suche nach similarity.
		return sourceArray.find(f => check(comparePropertyAccessor(f).name, normalizedInput));
	},

	highestSimilarities(inputString, comparePropertyAccessor, sourceArray) {
		// Suche nach similarity
		const element = sourceArray.filter(f => check(comparePropertyAccessor(f).name, inputString.toLowerCase()));
		return element;
	},

};

const applyEffects = (effects, props, isMeister) => {
	effects.forEach(effect =>
		effect.some(e => {
			const applicable = e.isApplyable({ ...props, isMeister });
			if (applicable) {
				e.apply({ ...props, isMeister, applicable });
			}
		}),
	);
};

export const mapAtIndices = (array, indices, mapFunction) => {
	return indices
		.filter(index => index >= 0 && index < array.length)
		.map(index => mapFunction(array[index], index));
};

const check = (sourceValue, targetValue) => {
	const indx = sourceValue.toLowerCase().indexOf(targetValue.toLowerCase()) >= 0;
	const prob = stringSim.compareTwoStrings(sourceValue.toLowerCase(), targetValue.toLowerCase()) >= 0.7;
	return indx || prob;
};