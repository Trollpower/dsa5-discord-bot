import { fertigkeitenData, zauberData, liturgienData, ritualeData, zaubermelodienData, elfenliederData } from '../data/index.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, MessageFlags } from 'discord.js';
import config from '../config.json' with { type: 'json' };
import { KSF_QUICK_CUSTOM_ID_PREFIX } from './ksf.js';
import { ANGRIFF_QUICK_CUSTOM_ID_PREFIX } from './angriff.js';
import { PARADE_QUICK_CUSTOM_ID_PREFIX } from './parade.js';
import { AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX } from './ausweichen.js';
import { QUICK_PROBE_CUSTOM_ID_PREFIX } from './probe.js';

const PROBE_COUNTER_CATEGORIES = [
	'talente',
	'zauber',
	'liturgien',
	'rituale',
	'zaubermelodien',
	'elfenlieder',
	'segnungen',
	'hexenflueche',
];
const RECENT_ROW_COUNT = 5;
const FAVORITES_ROW_COUNT = 3;
const TOP_EXECUTIONS_ROW_COUNT = 5;
const MAX_BUTTONS_PER_ROW = 5;

const isQuickButtonsEnabled = () => config.probeQuickButtonsEnabled !== false;

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

const getQuickProbeCandidates = (character) => {
	const candidates = [];
	for (const category of PROBE_COUNTER_CATEGORIES) {
		const entries = character?.[category];
		if (!Array.isArray(entries)) {
			continue;
		}

		for (const entry of entries) {
			if (!entry?.name) {
				continue;
			}
			if (!resolveFertigkeitByCategoryAndName({ category, name: entry.name })) {
				continue;
			}

			candidates.push({
				category,
				name: entry.name,
			});
		}
	}

	return candidates;
};

const isSameProbe = (a, b) => a?.category === b?.category && a?.name === b?.name;

const isSameProbeWithBonusMalus = (a, b) =>
	a?.category === b?.category && a?.name === b?.name && (a?.bonusMalus ?? 0) === (b?.bonusMalus ?? 0);

const addUniqueProbe = (target, candidate, source) => {
	if (!candidate) return;
	const isDuplicate = source === 'last'
		? target.some(entry => isSameProbeWithBonusMalus(entry, candidate))
		: target.some(entry => isSameProbe(entry, candidate));
	if (isDuplicate) return;
	target.push({ ...candidate, source });
};

const getTopQuickProbes = (character, recentProbes, topProbes) => {
	const candidates = getQuickProbeCandidates(character);
	const ranked = (topProbes ?? [])
		.flatMap(tp => {
			const existing = candidates.find(c => isSameProbe(c, tp));
			if (!existing) return [];
			return [existing];
		})
		.slice(0, TOP_EXECUTIONS_ROW_COUNT);

	const favoriteRaw = Array.isArray(character?.quickProbeFavorites)
		? character.quickProbeFavorites
		: [];
	const probeFavorites = favoriteRaw
		.map(favorite => {
			if (favorite?.type === 'ksf') return null;
			if (!favorite?.name || !favorite?.category) {
				return null;
			}
			const existing = candidates.find(candidate => isSameProbe(candidate, favorite));
			if (existing) {
				return {
					...existing,
					label: favorite.label,
					bonusMalus: favorite.bonusMalus ?? 0,
				};
			}
			if (!resolveFertigkeitByCategoryAndName(favorite)) {
				return null;
			}
			return { category: favorite.category, name: favorite.name, label: favorite.label, bonusMalus: favorite.bonusMalus ?? 0 };
		})
		.filter(Boolean)
		.slice(0, FAVORITES_ROW_COUNT);
	const ksfFavorites = favoriteRaw
		.filter(fav => fav?.type === 'ksf' && fav?.subcommand)
		.slice(0, FAVORITES_ROW_COUNT);

	const recent = [];
	for (const entry of (recentProbes ?? [])) {
		if (!entry?.name || !entry?.category) continue;
		const existing = candidates.find(candidate => isSameProbe(candidate, entry));
		const normalized = existing ?? (
			resolveFertigkeitByCategoryAndName(entry)
				? { category: entry.category, name: entry.name }
				: null
		);
		if (!normalized) continue;
		if (recent.some(item => isSameProbe(item, normalized) && (item.bonusMalus ?? 0) === (entry.bonusMalus ?? 0))) continue;
		recent.push({ ...normalized, bonusMalus: entry.bonusMalus ?? 0 });
		if (recent.length >= RECENT_ROW_COUNT) break;
	}

	const selectedRecent = [];
	const selectedFavorites = [];
	const selectedTop = ranked
		.slice(0, TOP_EXECUTIONS_ROW_COUNT)
		.map(candidate => ({ ...candidate, source: 'ranked' }));

	for (const recentEntry of recent) {
		addUniqueProbe(selectedRecent, recentEntry, 'last');
	}

	for (const favorite of probeFavorites) {
		addUniqueProbe(selectedFavorites, favorite, 'favorite');
		if (selectedFavorites.length >= FAVORITES_ROW_COUNT) {
			break;
		}
	}

	return {
		recent: selectedRecent,
		favorites: selectedFavorites,
		ksfFavorites,
		top: selectedTop,
	};
};

const encodeQuickProbePayload = ({ category, name, bonusMalus }) => {
	const bm = bonusMalus != null && bonusMalus !== 0 ? `|${bonusMalus}` : '';
	return encodeURIComponent(`${category}|${name}${bm}`);
};

const encodeKsfPayload = ({ subcommand, stufe, basismanoever }) => {
	let payload = subcommand;
	if (stufe != null) payload += `:${stufe}`;
	if (basismanoever) payload += `|${encodeURIComponent(basismanoever)}`;
	return payload;
};

const encodeAngriffPayload = ({ waffenName, bonusMalus }) => {
	const encoded = encodeURIComponent(waffenName);
	return bonusMalus && bonusMalus !== 0 ? `${encoded}:${bonusMalus}` : encoded;
};

const encodeParadePayload = ({ waffenName, bonusMalus }) => {
	const encoded = encodeURIComponent(waffenName);
	return bonusMalus && bonusMalus !== 0 ? `${encoded}:${bonusMalus}` : encoded;
};

const encodeAusweichenPayload = ({ bonusMalus }) => {
	return bonusMalus && bonusMalus !== 0 ? `${bonusMalus}` : '';
};

const probeEmojiByCategory = (category) => {
	switch (category) {
		case 'zauber': return '🪄';
		case 'elfenlieder': return '🧝';
		case 'liturgien': return '😇';
		case 'rituale': return '🔯';
		default: return '💪';
	}
};

const createQuickButtonRows = async (character, client) => {
	if (!isQuickButtonsEnabled()) {
		return [];
	}
	const recentMixed = client.eventHistoryProvider?.readRecentMixed?.({
		characterName: character?.name,
		count: RECENT_ROW_COUNT,
	}) ?? [];
	const recentProbes = recentMixed.filter(e => e.type === 'probe');
	const topMixed = client.eventHistoryProvider?.readTopMixed?.({
		characterName: character?.name,
	}) ?? [];
	const topProbes = topMixed.filter(e => e.type === 'probe');
	const quickProbeSections = getTopQuickProbes(character, recentProbes, topProbes);

	const hasProbeContent = quickProbeSections.recent.length > 0
		|| quickProbeSections.favorites.length > 0
		|| quickProbeSections.ksfFavorites.length > 0
		|| quickProbeSections.top.length > 0;
	const hasKsfContent = recentMixed.some(e => e.type === 'ksf') || topMixed.some(e => e.type === 'ksf');
	const hasAngriffContent = recentMixed.some(e => e.type === 'angriff') || topMixed.some(e => e.type === 'angriff');
	const hasCombatContent = recentMixed.some(e => e.type === 'parade' || e.type === 'ausweichen')
		|| topMixed.some(e => e.type === 'parade' || e.type === 'ausweichen');

	if (!hasProbeContent && !hasKsfContent && !hasAngriffContent && !hasCombatContent) {
		return [];
	}

	const rows = [];

	// Recent row: interleaved probe + ksf + angriff in original history order
	const recentRow = new ActionRowBuilder();
	for (const entry of recentMixed) {
		if (recentRow.components.length >= MAX_BUTTONS_PER_ROW) break;
		if (entry.type === 'probe') {
			const candidate = quickProbeSections.recent.find(
				r => r.category === entry.category && r.name === entry.name && (r.bonusMalus ?? 0) === (entry.bonusMalus ?? 0),
			);
			if (!candidate) continue;
			const bm = candidate.bonusMalus;
			const bmSuffix = bm && bm !== 0 ? ` (${bm > 0 ? '+' : ''}${bm})` : '';
			const label = (candidate.label || candidate.name) + bmSuffix;
			recentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`${QUICK_PROBE_CUSTOM_ID_PREFIX}recent:${encodeQuickProbePayload(candidate)}`)
					.setEmoji(probeEmojiByCategory(candidate.category))
					.setLabel(label)
					.setStyle(ButtonStyle.Success),
			);
		}
		else if (entry.type === 'ksf') {
			recentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`${KSF_QUICK_CUSTOM_ID_PREFIX}recent:${encodeKsfPayload(entry)}`)
					.setEmoji('🗡️')
					.setLabel(entry.label)
					.setStyle(ButtonStyle.Success),
			);
		}
		else if (entry.type === 'angriff') {
			const bmSuffix = entry.bonusMalus && entry.bonusMalus !== 0 ? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})` : '';
			recentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`${ANGRIFF_QUICK_CUSTOM_ID_PREFIX}recent:${encodeAngriffPayload(entry)}`)
					.setEmoji('⚔️')
					.setLabel(entry.waffenName + bmSuffix)
					.setStyle(ButtonStyle.Success),
			);
		}
		else if (entry.type === 'parade') {
			const bmSuffix = entry.bonusMalus && entry.bonusMalus !== 0 ? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})` : '';
			recentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`${PARADE_QUICK_CUSTOM_ID_PREFIX}recent:${encodeParadePayload(entry)}`)
					.setEmoji('🛡️')
					.setLabel(entry.waffenName + bmSuffix)
					.setStyle(ButtonStyle.Success),
			);
		}
		else if (entry.type === 'ausweichen') {
			const bmSuffix = entry.bonusMalus && entry.bonusMalus !== 0 ? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})` : '';
			recentRow.addComponents(
				new ButtonBuilder()
					.setCustomId(`${AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX}recent:${encodeAusweichenPayload(entry)}`)
					.setEmoji('💨')
					.setLabel('Ausweichen' + bmSuffix)
					.setStyle(ButtonStyle.Success),
			);
		}
	}
	if (recentRow.components.length > 0) {
		rows.push(recentRow);
	}

	// Favorites row (probe + ksf from character config, in original slot order)
	const allFavorites = Array.isArray(character?.quickProbeFavorites) ? character.quickProbeFavorites : [];
	const favCandidates = allFavorites.filter(Boolean);
	if (favCandidates.length > 0) {
		const favRow = new ActionRowBuilder();
		for (const fav of favCandidates) {
			if (favRow.components.length >= MAX_BUTTONS_PER_ROW) break;
			if (fav.type === 'ksf') {
				const bmSuffix = fav.bonusMalus && fav.bonusMalus !== 0 ? ` (${fav.bonusMalus > 0 ? '+' : ''}${fav.bonusMalus})` : '';
				favRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${KSF_QUICK_CUSTOM_ID_PREFIX}favorites:${encodeKsfPayload(fav)}`)
						.setEmoji('🗡️')
						.setLabel((fav.label || fav.subcommand) + bmSuffix)
						.setStyle(ButtonStyle.Primary),
				);
			}
			else if (fav.type === 'angriff') {
				const bmSuffix = fav.bonusMalus && fav.bonusMalus !== 0 ? ` (${fav.bonusMalus > 0 ? '+' : ''}${fav.bonusMalus})` : '';
				favRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${ANGRIFF_QUICK_CUSTOM_ID_PREFIX}favorites:${encodeAngriffPayload(fav)}`)
						.setEmoji('⚔️')
						.setLabel((fav.label || fav.waffenName) + bmSuffix)
						.setStyle(ButtonStyle.Primary),
				);
			}
			else if (fav.category && fav.name) {
				const resolved = quickProbeSections.favorites.find(
					f => f.category === fav.category && f.name === fav.name,
				);
				if (!resolved) continue;
				const bm = resolved.bonusMalus;
				const bmSuffix = bm && bm !== 0 ? ` (${bm > 0 ? '+' : ''}${bm})` : '';
				const label = (resolved.label || resolved.name) + bmSuffix;
				favRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${QUICK_PROBE_CUSTOM_ID_PREFIX}favorites:${encodeQuickProbePayload(resolved)}`)
						.setEmoji(probeEmojiByCategory(resolved.category))
						.setLabel(label)
						.setStyle(ButtonStyle.Primary),
				);
			}
		}
		if (favRow.components.length > 0) {
			rows.push(favRow);
		}
	}

	// Top row: probe + ksf + angriff sorted by frequency
	const topCandidates = topMixed.slice(0, TOP_EXECUTIONS_ROW_COUNT);
	if (topCandidates.length > 0) {
		const topRow = new ActionRowBuilder();
		for (const entry of topCandidates) {
			if (topRow.components.length >= MAX_BUTTONS_PER_ROW) break;
			if (entry.type === 'probe') {
				const candidate = quickProbeSections.top.find(
					r => r.category === entry.category && r.name === entry.name,
				);
				if (!candidate) continue;
				const bm = candidate.bonusMalus;
				const bmSuffix = bm && bm !== 0 ? ` (${bm > 0 ? '+' : ''}${bm})` : '';
				const label = (candidate.label || candidate.name) + bmSuffix;
				topRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${QUICK_PROBE_CUSTOM_ID_PREFIX}top:${encodeQuickProbePayload(candidate)}`)
						.setEmoji(probeEmojiByCategory(candidate.category))
						.setLabel(label)
						.setStyle(ButtonStyle.Secondary),
				);
			}
			else if (entry.type === 'ksf') {
				topRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${KSF_QUICK_CUSTOM_ID_PREFIX}top:${encodeKsfPayload(entry)}`)
						.setEmoji('🗡️')
						.setLabel(entry.label)
						.setStyle(ButtonStyle.Secondary),
				);
			}
			else if (entry.type === 'angriff') {
				const bmSuffix = entry.bonusMalus && entry.bonusMalus !== 0 ? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})` : '';
				topRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${ANGRIFF_QUICK_CUSTOM_ID_PREFIX}top:${encodeAngriffPayload(entry)}`)
						.setEmoji('⚔️')
						.setLabel(entry.waffenName + bmSuffix)
						.setStyle(ButtonStyle.Secondary),
				);
			}
			else if (entry.type === 'parade') {
				const bmSuffix = entry.bonusMalus && entry.bonusMalus !== 0 ? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})` : '';
				topRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${PARADE_QUICK_CUSTOM_ID_PREFIX}top:${encodeParadePayload(entry)}`)
						.setEmoji('🛡️')
						.setLabel(entry.waffenName + bmSuffix)
						.setStyle(ButtonStyle.Secondary),
				);
			}
			else if (entry.type === 'ausweichen') {
				const bmSuffix = entry.bonusMalus && entry.bonusMalus !== 0 ? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})` : '';
				topRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`${AUSWEICHEN_QUICK_CUSTOM_ID_PREFIX}top:${encodeAusweichenPayload(entry)}`)
						.setEmoji('💨')
						.setLabel('Ausweichen' + bmSuffix)
						.setStyle(ButtonStyle.Secondary),
				);
			}
		}
		if (topRow.components.length > 0) {
			rows.push(topRow);
		}
	}

	return rows;
};

export default {
	type: Events.InteractionCreate,
	name: 'quick',
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === 'quick') {
			const components = await createQuickButtonRows(character, client);
			return await interaction.reply({
				components: components.slice(0, 5),
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
