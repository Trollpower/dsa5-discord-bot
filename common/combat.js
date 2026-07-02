import { waffenData } from '../data/index.js';
import config from '../config.json' with { type: 'json' };
import { parseWuerfel, wuerfelWerfenParsed, rollDice } from './common.js';
import { createField } from './embeds.js';
import { highestSimilarity } from './search.js';
import logger from './logger.js';

const enableGMChanceImprovement = config.enableGMChanceImprovement;

const attack = ({ character, waffenName, bonusMalusAngriff, bonusMalusSchaden = 0, interaction }) => {
	const waffe = highestSimilarity(waffenName, weapon => ({ name: weapon.name, aliases: [] }), waffenData);
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

	return {
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
};

const createResultEmbedFromAttack = ({ character, data }) => {
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

	const attackeWertField = createField(
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

	const schadenWertField = createField(
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
};

const basismanoever = () => {
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
};

export { attack, createResultEmbedFromAttack, basismanoever };