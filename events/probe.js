import { fertigkeitenData, zauberData, liturgienData, ritualeData, zaubermelodienData, elfenliederData } from '../data/index.js';
import { Events, MessageFlags } from 'discord.js';
import path from 'path';
import { rollDice, getQS } from '../common/common.js';
import { applyPre, applyPost, mapAtIndices } from '../common/utils.js';
import logger from '../common/logger.js';
// import { applyPre, applyPost } from "../common/vorteileNachteileFunctions.js";

export const QUICK_PROBE_CUSTOM_ID_PREFIX = 'probe:quick:';
const allProbeFertigkeiten = [
	...fertigkeitenData,
	...liturgienData,
	...ritualeData,
	...zaubermelodienData,
	...elfenliederData,
	...zauberData,
];

const resolveFertigkeitByCategoryAndName = ({ category, name }) => allProbeFertigkeiten
	.find(fertigkeit => fertigkeit.kategorie === category && fertigkeit.name === name);

const decodeQuickProbePayload = (payload) => {
	const rawPayload = payload ?? '';
	const separatorIndexRaw = rawPayload.indexOf(':');
	const normalizedPayload = separatorIndexRaw >= 0
		? rawPayload.slice(separatorIndexRaw + 1)
		: rawPayload;
	const decoded = decodeURIComponent(normalizedPayload);
	const parts = decoded.split('|');
	if (parts.length < 2 || !parts[0] || !parts[1]) {
		return null;
	}

	return {
		category: parts[0],
		name: parts[1],
		bonusMalus: parts[2] != null ? Number(parts[2]) : 0,
	};
};

export const resolveFertigkeit = (fertigkeitsName, client) => client.Utils.highestSimilarity(
	fertigkeitsName,
	(fert) => ({ name: fert.name, aliases: fert.alias }),
	[...fertigkeitenData, ...liturgienData, ...ritualeData, ...zaubermelodienData, ...elfenliederData, ...zauberData],
);

export const executeProbeAndBuildResponse = async ({ fertigkeit, character, bonusMalus, interaction, client }) => {
	const event = talentProbe({ character, fertigkeit, bonusMalus, interaction });
	const icon = event.kritischBestanden === true ? '⭐'
		: event.kritischFehlschlag === true ? '💩'
			: event.bestanden === true ? '🏆'
				: '💥';
	const sucText = event.kritischBestanden === true ? '__kritisch bestanden__'
		: event.kritischFehlschlag === true ? '__verpatzt__'
			: event.bestanden === true ? 'bestanden'
				: 'nicht bestanden';
	const embed = {
		title: `${icon} ${character.displayName ?? character.name} hat Probe auf **${fertigkeit.name}** ${sucText}`,
		color: event.bestanden || event.kritischBestanden ? 0x33cc33 : 0xff3300,
		fields: [],
	};
	if (event.cheated === true) {
		embed.title = `__${embed.title}__`;
	}

	embed.fields = embed.fields.concat(renderEigenschaften({ event, client }));
	embed.fields.push({ name: 'Fertigkeitswert', value: event.talent.fertigkeitswert, inline: true });
	embed.fields.push({ name: 'Fertigkeitspunkte', value: event.fw, inline: true });
	if (event.bestanden) {embed.fields.push({ name: 'QS', value: client.Common.getQS(event.fw), inline: true });}
	if (event.infos) {
		embed.fields.push(client.Utils.createField(
			{
				fieldName: 'Infos',
				fieldValues: event.infos.map(info => ({ key: `**${info.id}**`, value: `\`\`\`${info.text}\`\`\`` })),
				isInline: false,
				valueFormatting: '',
				keyFormatting: '__',
			}));
	}

	return { event, embed };
};

export default {
	type: Events.InteractionCreate,
	customIds: [QUICK_PROBE_CUSTOM_ID_PREFIX],
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (interaction.isButton() && interaction.customId.startsWith(QUICK_PROBE_CUSTOM_ID_PREFIX)) {
			const payload = interaction.customId.slice(QUICK_PROBE_CUSTOM_ID_PREFIX.length);
			const quickProbe = decodeQuickProbePayload(payload);
			if (!quickProbe) {
				return await interaction.reply({ content: 'Unbekannte Schnell-Probe.', flags: MessageFlags.Ephemeral });
			}
			const fertigkeit = resolveFertigkeitByCategoryAndName(quickProbe);
			if (!fertigkeit) {
				return await interaction.reply({ content: `Schnell-Probe '${quickProbe.name}' ist nicht mehr verfügbar.`, flags: MessageFlags.Ephemeral });
			}
			const bonusMalus = quickProbe.bonusMalus ?? 0;
			const { event, embed } = await executeProbeAndBuildResponse({ fertigkeit, character, bonusMalus, interaction, client });
			await interaction.reply({ embeds: [embed] });
			client.Persistence.persistCharacter(character).catch(err => logger.error('probe.persist.failed', { error: err }));
			return [event];
		}

		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
			const fertigkeitsName = interaction.options.getString('fertigkeitsname') ?? null;

			if (!fertigkeitsName) {
				return await interaction.reply({
					content: 'Bitte gib eine Fertigkeit an.',
					flags: MessageFlags.Ephemeral,
				});
			}

			const fertigkeit = resolveFertigkeit(fertigkeitsName, client);
			if (!fertigkeit) {
				const embed = {
					title: `Fertigkeit ***${fertigkeitsName}*** wurde nicht gefunden`,
					color: 0xff0000,
				};
				return await interaction.reply({ embeds: [embed] });
			}

			if (fertigkeit.kategorie !== 'talente') {
				const characterTalent = (character[fertigkeit.kategorie] ?? []).find(f => f.name === fertigkeit.name);
				if (!characterTalent) {
					const embed = {
						title: ` ***${fertigkeit.name}*** ist kein Talent und muss daher aktiviert sein.`,
						color: 0xff0000,
					};
					return await interaction.reply({ embeds: [embed] });
				}
			}

			const { event, embed } = await executeProbeAndBuildResponse({ fertigkeit, character, bonusMalus, interaction, client });
			await interaction.reply({ embeds: [embed] });
			client.Persistence.persistCharacter(character).catch(err => logger.error('probe.persist.failed', { error: err }));
			return [event];
		}
	},
	async executeSchip(interaction, eventData, character, client) {
		const maske = interaction.options.getString('maske') ?? '111';
		const data = { ...eventData };
		const origRolls = data.data;
		for (let index = 0; index < 3; index++) {
			if (maske[index] === '1') {
				data.data[index].wurf = rollDice(20);
			}
		}
		recalculateProbeResult(data);

		applyPost({ event: data, character, interaction });

		// reapply orig values that should not have been rerolled
		// when an effect took place (for example cheating through applyPost), certain
		// values should be unchanged according to the given schip-mask
		for (let index = 0; index < 3; index++) {
			if (maske[index] === '0') {
				data.data[index].wurf = origRolls[index].wurf;
			}
		}
		recalculateProbeResult(data);

		const sucText = data.kritischBestanden ? '__kritisch bestanden__' : data.kritischFehlschlag ? '__verpatzt__' : data.bestanden ? 'bestanden' : 'nicht bestanden';
		const rerollIndices = maske.split('').map((x, idx) => x === '1' ? idx : -1).filter(x => x >= 0);
		const schipAttribs = mapAtIndices(data.data, rerollIndices, (d) => d.name).join(', ');
		const schipText = `Schicksalspunkt für ${schipAttribs} (Maske: ${maske})`;
		const embed = {
			title: `${character.displayName ?? character.name} hat Probe auf **${data.fertigkeit.name}** ${sucText} ${schipText}`,
			color: data.bestanden ? 0x33cc33 : 0xff3300,
			fields: [],
		};

		if (data.bonusMalus != 0) {embed.fields.push({ name: data.bonusMalus < 0 ? 'Erschwernis' : 'Erleichterung', value: data.bonusMalus });}

		// console.log(data);
		embed.fields = embed.fields.concat(renderEigenschaften({ event: data, client }));
		embed.fields.push({ name: 'Fertigkeitswert', value: data.talent.fertigkeitswert, inline: true });
		embed.fields.push({ name: 'Fertigkeitspunkte', value: data.fw, inline: true });

		if (data.bestanden) {embed.fields.push({ name: 'QS', value: getQS(data.fw), inline: true });}

		await interaction.reply({ embeds: [embed] });
		return [data];
	},
};
const renderEigenschaften = ({ event, client }) => {
	const result = [];
	event.data.forEach(eigenschaft => {
		result.push(client.Utils.createField({
			fieldName: `${eigenschaft.wurf > eigenschaft.wertbrutto ? '~~' : ''}${eigenschaft.name} ${eigenschaft.wertbrutto}${eigenschaft.wurf > eigenschaft.wertbrutto ? '~~' : ''}`, fieldValues: [
				{ key: 'Grundwert', value: `${eigenschaft.wert}` },
				{ key: 'Behinderung', value: `${event.belastung}` },
				{ key: 'Bonus/Malus', value: `${event.bonusMalus}` },
				{ key: 'Wurf', value: `${eigenschaft.wurf}` },
			],
		}));
	});
	return result;
};

const recalculateProbeResult = (data) => {
	data.fw = data.talent.fertigkeitswert;
	for (const wurfData of data.data) {
		if (wurfData.wurf > wurfData.wertbrutto) {
			const delta = wurfData.wurf - wurfData.wertbrutto;
			data.fw -= delta;
		}
	}

	data.bestanden = data.fw >= 0;
	data.kritischBestanden = data.data.filter(x => x.wurf === 1).length >= 2;
	data.kritischFehlschlag = data.data.filter(x => x.wurf === 20).length >= 2;
};

const talentProbe = ({ character, fertigkeit, bonusMalus = 0, interaction }) => {
	const event = {
		type: 'event',
		name: 'probe',
		data: [],
		bestanden: false,
		fertigkeit: fertigkeit,
		fw: 0,
		kritAt: 1,
		failAt: 20,
		kritischBestanden: false,
		kritischFehlschlag: false,
		bonusMalus: bonusMalus,
		talent: {},
		belastung: 0,
		cheated: false,
	};

	let talent = (character[fertigkeit.kategorie] ?? []).find(f => f.name === fertigkeit.name);
	if (!talent) {
		talent = { name: fertigkeit.name, fertigkeitswert: 0 };
	}
	talent = { ...talent };

	event.talent = talent;
	event.data = [];
	event.fw = talent.fertigkeitswert;

	const belastung = character.getBelastungsmalus();
	const behinderung = fertigkeit.beh === 'ja';

	applyPre({ event, character, interaction });

	fertigkeit.eigenschaften.forEach(eigenschaft => {
		const brutto = character.eigenschaften[eigenschaft] + event.bonusMalus - (behinderung ? -belastung : 0);
		const o = { name: eigenschaft, wert: character.eigenschaften[eigenschaft], wertbrutto: brutto > 20 ? 20 : brutto, wurf: rollDice(20) };
		if (o.wurf > o.wertbrutto) {
			const delta = o.wurf - o.wertbrutto;
			event.fw = event.fw - delta;
		}
		event.data.push(o);
	});

	const bestanden = event.fw >= 0;
	const kritischBestanden = event.data.filter(x => x.wurf <= event.kritAt).length >= 2;
	const kritischFehlschlag = event.data.filter(x => x.wurf >= event.failAt).length >= 2;

	// complete the event data
	event.bestanden = bestanden && !kritischFehlschlag;
	event.kritischBestanden = kritischBestanden;
	event.kritischFehlschlag = kritischFehlschlag;
	event.belastung = behinderung ? belastung : 0;

	applyPost({ character, event, interaction });
	return event;
};