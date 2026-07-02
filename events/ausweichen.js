import { Events } from 'discord.js';
import path from 'path';
import config from '../config.json' with { type: 'json' };
const enableGMChanceImprovement = config.enableGMChanceImprovement;
import { rollDice } from '../common/common.js';
import { createField } from '../common/embeds.js';
import logger from '../common/logger.js';

const AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX = 'ausweichen:quick:';

export { AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX };

const executeAusweichen = async ({ bonusMalus, interaction, character, client }) => {
	let event = {
		type: 'event',
		name: 'ausweichen',
	};

	const verbessertesAusweichen = [...new Set(character.sonderfertigkeiten.filter(sf => sf.name.startsWith('Verbessertes Ausweichen')))];
	const meisterlicherKlingenTaenzer = character.sonderfertigkeiten.find(sf => sf.name.startsWith('Meisterlicher Klingentänzer'));
	let iniBasiswert = Math.ceil((character.eigenschaften.MU + character.eigenschaften.GE) / 2);
	iniBasiswert += verbessertesAusweichen.length;

	const belastung = character.getBelastungsmalus();
	const ausweichenwert = Math.round(character.eigenschaften.GE / 2);
	let ausweichen = ausweichenwert + bonusMalus - belastung + (character.getRuestungsschutz() > 0 ? 0 : verbessertesAusweichen.length);
	let ausweichenBonusDurchMeisterlicherKlingenTaenzer = 0;
	const meisterlicherKlingenTaenzerWurf = character.initiative - iniBasiswert;
	if (meisterlicherKlingenTaenzer) {
		logger.debug('combat.evade.master-blade-dancer.active', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			initiative: character.initiative,
			iniBasiswert,
			wurf: meisterlicherKlingenTaenzerWurf,
		}));
		if (meisterlicherKlingenTaenzerWurf >= 11) {
			ausweichenBonusDurchMeisterlicherKlingenTaenzer = 3;
		}
		else if (meisterlicherKlingenTaenzerWurf >= 7) {
			ausweichenBonusDurchMeisterlicherKlingenTaenzer = 2;
		}
		else if (meisterlicherKlingenTaenzerWurf >= 3) {
			ausweichenBonusDurchMeisterlicherKlingenTaenzer = 1;
		}
		ausweichen += ausweichenBonusDurchMeisterlicherKlingenTaenzer;
		event.infos = event.infos ?? [];
		const info = {
			id: 'Meisterlicher Klingentänzer',
			text: `Meisterlicher Klingentänzer gewährte ${ausweichenBonusDurchMeisterlicherKlingenTaenzer} Verteidigung durch Initiativewurf von ${meisterlicherKlingenTaenzerWurf}`,
		};
		event.infos.push(info);
	}
	let roll = rollDice(20);
	const critBestaetigt = rollDice(20);
	let gmChanceImproved = false;
	if (interaction?.isMeister()) {
		logger.debug('combat.evade.cheat-state.initial', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			enableGMChanceImprovement,
			ausweichen,
			ausweichenwert,
			roll,
			bonusMalus,
			belastung,
			meisterlicherKlingenTaenzerWurf,
			ausweichenBonusDurchMeisterlicherKlingenTaenzer,
		}));
		const rand = Math.random();
		const randRange = (Math.floor(rand * 100) + 1);
		const improveMeisterChance = randRange <= (character?.cheating?.general ?? 30);
		const improveMeisterCrit = randRange <= (character?.cheating?.crit ?? 10);
		logger.debug('combat.evade.cheat-candidate', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			cheatingOption: character.cheating,
			ausweichen,
			ausweichenwert,
			origRoll: roll,
			rand,
			randRange,
			improveMeisterChance,
			improveMeisterCrit,
		}));
		if (improveMeisterCrit === true) {
			roll = 1;
		}
		else if (improveMeisterChance === true) {
			roll = roll <= 5 ? roll : roll - 3;
		}
		gmChanceImproved = (improveMeisterChance || improveMeisterCrit);
		logger.debug('combat.evade.cheat-applied', logger.traceMeta(interaction, {
			character: character.displayName ?? character.name,
			cheatingOption: character.cheating,
			ausweichen,
			ausweichenwert,
			roll,
			rand,
			randRange,
			improveMeisterChance,
			improveMeisterCrit,
			cheated: gmChanceImproved,
		}));
	}

	event = { ...event,
		type: 'event',
		name: 'ausweichen',
		ausweichenwert,
		ausweichen,
		roll,
		bonusMalus,
		belastung,
		critBestaetigt,
		cheated: gmChanceImproved,
	};

	const result = {
		fields: [],
	};
	result.title = `'${character.displayName ?? character.name}' ist ${(event.roll <= event.ausweichen ? 'ausgewichen' : '***NICHT*** ausgewichen')}`;

	if (event.cheated === true) {
		result.title = `__${result.title}__`;
	}
	const isCrit = event.roll === 1 && event.critBestaetigt <= event.ausweichen;
	logger.debug('combat.evade.result', logger.traceMeta(interaction, {
		character: character.displayName ?? character.name,
		roll: event.roll,
		critBestaetigt: event.critBestaetigt,
		isCrit,
		ausweichen: event.ausweichen,
	}));
	if (isCrit === true) {
		result.title = `⭐ ${result.title} `;
		result.color = 0x33cc33;
	}
	result.color = event.roll <= event.ausweichen ? 0x33cc33 : 0xff3300;
	result.fields.push({ name: 'AU', value: `${event.ausweichenwert}`, inline: true });
	result.fields.push({ name: 'eff. AU', value: `${event.ausweichen}`, inline: true });
	result.fields.push({ name: 'Würfelwurf', value: event.roll, inline: true });
	result.fields.push({ name: 'Belastung', value: `${event.belastung}`, inline: true });

	if (verbessertesAusweichen.length > 0) {
		result.fields.push(createField(
			{
				fieldName: 'Verbesertes Ausweichen',
				fieldValues: verbessertesAusweichen.sort((a, b) => a.name.localeCompare(b.name)).map(talent => ({ key: talent.name })),
				isInline: true,
			},
		));
	}

	if (ausweichenBonusDurchMeisterlicherKlingenTaenzer > 0) {
		result.fields.push(createField(
			{
				fieldName: 'Meisterlicher Klingentänzer Bonus',
				fieldValues: [{ key: ausweichenBonusDurchMeisterlicherKlingenTaenzer }],
				isInline: true,
			},
		));
	}

	await interaction.reply({ content: 'Ausweichen', embeds: [result] });
	return [event];
};

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	customIds: [AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX],
	async execute(interaction, character, client) {
		if (interaction.isButton() && interaction.customId.startsWith(AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX)) {
			const payload = interaction.customId.slice(AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX.length);
			// format: sectionKey or sectionKey:bonusMalus
			const parts = payload.split(':');
			const bonusMalus = parts[1] ? parseInt(parts[1]) : 0;
			return executeAusweichen({ bonusMalus, interaction, character, client });
		}

		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
			return executeAusweichen({ bonusMalus, interaction, character, client });
		}
	},
	async executeSchip(interaction, eventData, character, client) {
		const data = { ...eventData };
		data.roll = rollDice(20);

		const result = {
			fields: [],
		};
		result.title = `'${character.displayName ?? character.name}' ist ${(data.roll <= data.ausweichen ? 'ausgewichen' : 'NICHT ausgewichen')}`;
		result.color = data.roll <= data.ausweichen ? 0x33cc33 : 0xff3300;
		result.fields.push({ name: 'AU', value: `${data.ausweichenwert}`, inline: true });
		result.fields.push({ name: 'eff. AU', value: `${data.ausweichen}`, inline: true });
		result.fields.push({ name: 'Würfelwurf', value: data.roll, inline: true });

		await interaction.reply({ content: 'Schicksalspunkt für Ausweichen', embeds: [result] });
		return [data];
	},
};