import { AttachmentBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Events, MessageFlags } from 'discord.js';
import path from 'path';
import { waffenData, ruestungenData, fertigkeitenData, liturgienData, ritualeData, zaubermelodienData, elfenliederData, zauberData, segnungenData, hexenfluecheData } from '../data/index.js';
import Utils from '../common/utils.js';
import { getQS } from '../common/common.js';
import { fillCharacterbogen } from '../tools/fill-characterbogen.js';

const ALL_PROBE_OPTIONS = [
	...fertigkeitenData,
	...liturgienData,
	...ritualeData,
	...zaubermelodienData,
	...elfenliederData,
	...zauberData,
	...segnungenData,
	...hexenfluecheData,
];

const resolveProbeOption = (name, client) => client.Utils.highestSimilarity(
	name,
	(fert) => ({ name: fert.name, aliases: fert.alias }),
	ALL_PROBE_OPTIONS,
);

const resolveProbeOptionValue = (value, client) => {
	if (!value) {
		return null;
	}

	if (value.includes('|')) {
		const [category, ...nameParts] = value.split('|');
		const name = nameParts.join('|');
		const exact = ALL_PROBE_OPTIONS.find(option => option.kategorie === category && option.name === name);
		if (exact) {
			return exact;
		}
	}

	return resolveProbeOption(value, client);
};

const isSelectableProbeForCharacter = (character, fertigkeit) => {
	if (!fertigkeit) return false;
	if (fertigkeit.kategorie === 'talente') return true;
	return (character[fertigkeit.kategorie] ?? []).some(entry => entry.name === fertigkeit.name);
};

const KSF_LABEL_MAP = {
	wuchtschlag: 'Wuchtschlag',
	finte: 'Finte',
	sturmangriff: 'Sturmangriff',
	'todesstoß': 'Todesstoß',
	'vorstoß': 'Vorstoß',
	entwaffnen: 'Entwaffnen',
	zufallbringen: 'Zu Fall bringen',
};

const KSF_HAS_STUFE = new Set(['wuchtschlag', 'finte']);
const KSF_HAS_BASISMANOEVER = new Set(['sturmangriff', 'todesstoß', 'vorstoß', 'entwaffnen', 'zufallbringen']);

const numToRoman = { 1: 'I', 2: 'II', 3: 'III' };

const formatFavoriteSlot = (entry, idx) => {
	if (!entry) {
		return `${idx + 1}. (leer)`;
	}
	const bm = entry.bonusMalus && entry.bonusMalus !== 0
		? ` (${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus})`
		: '';
	if (entry.type === 'ksf') {
		const displayLabel = entry.label || KSF_LABEL_MAP[entry.subcommand] || entry.subcommand;
		const bmPart = entry.basismanoever ? ` + ${entry.basismanoever}` : '';
		return `${idx + 1}. 🗡️ ${displayLabel}${bmPart}${bm}`;
	}
	if (entry.type === 'angriff') {
		const displayLabel = entry.label || entry.waffenName;
		return `${idx + 1}. ⚔️ ${displayLabel}${bm}`;
	}
	if (entry.label && entry.label !== entry.name) {
		return `${idx + 1}. ${entry.label}${bm} -> ${entry.name}`;
	}
	return `${idx + 1}. ${entry.name}${bm}`;
};

const getFavoriteSlotIndex = (subcommand) => {
	const match = /^favorit([1-3])$/.exec(subcommand ?? '');
	if (!match) {
		return null;
	}
	return Number(match[1]) - 1;
};

const waffenHandlers = {
	hinzufuegen: async ({ interaction, character, client, persistCharacter }) => {
		const waffenname = interaction.options.getString('waffenname');
		const waffe = client.Utils.highestSimilarity(waffenname, weapon => ({ name: weapon.name, aliases: [] }), waffenData);
		if (!waffe) return interaction.reply({ content: `Waffe ***${waffenname}*** wurde nicht gefunden` });
		if (character.waffen.includes(waffe.name)) return interaction.reply({ content: `Du hast die Waffe ***${waffe.name}*** bereits im Inventar` });
		character.waffen.push(waffe.name);
		persistCharacter(character);
		return interaction.reply({ content: `Du hast die Waffe ***${waffe.name}*** irgendwo in deinem Inventar verstaut` });
	},
	ziehen: async ({ interaction, character }) => {
		const row = new ActionRowBuilder();
		character.waffen.filter(w => !character.angelegteWaffen?.includes(w)).forEach(waffenName => {
			row.addComponents(new ButtonBuilder().setCustomId('waffe+' + waffenName).setLabel(waffenName).setStyle(ButtonStyle.Primary));
		});
		if (row.components.length <= 0) return interaction.reply({ content: 'Du kannst keine Waffen mehr, die noch anlegen kannst.', flags: MessageFlags.Ephemeral });
		return interaction.reply({ content: 'Wähle Waffe zum ziehen', components: [row], fetchReply: true, flags: MessageFlags.Ephemeral });
	},
	ablegen: async ({ interaction, character }) => {
		const row = new ActionRowBuilder();
		character.angelegteWaffen.forEach(waffenName => {
			row.addComponents(new ButtonBuilder().setCustomId('waffe-' + waffenName).setLabel(waffenName).setStyle(ButtonStyle.Primary));
		});
		return interaction.reply({ content: 'Wähle Waffe zum wegstecken', components: [row], fetchReply: true, flags: MessageFlags.Ephemeral });
	},
	entfernen: async ({ interaction, character }) => {
		const row = new ActionRowBuilder();
		character.waffen.forEach(waffenName => {
			row.addComponents(new ButtonBuilder().setCustomId('waffe!' + waffenName).setLabel(waffenName).setStyle(ButtonStyle.Primary));
		});
		return interaction.reply({ content: 'Wähle Waffe zum entfernen', components: [row], fetchReply: true, flags: MessageFlags.Ephemeral });
	},
};

const ruestungHandlers = {
	hinzufuegen: async ({ interaction, character, client, persistCharacter }) => {
		const rüstungsname = interaction.options.getString('ruestungname');
		const ruestung = client.Utils.highestSimilarity(rüstungsname, armor => ({ name: armor.name, aliases: [] }), ruestungenData);
		if (!ruestung) return interaction.reply({ content: `***${rüstungsname}*** wurde nicht gefunden` });
		if (character.ruestungen?.includes(ruestung.name)) return interaction.reply({ content: `Du hast die ***${ruestung.name}*** bereits im Inventar` });
		character.ruestungen = character.ruestungen ?? [];
		character.ruestungen.push(ruestung.name);
		persistCharacter(character);
		return interaction.reply({ content: `Du hast die ***${ruestung.name}*** irgendwo in deinem Inventar verstaut` });
	},
	anlegen: async ({ interaction, character }) => {
		if (character.angelegteRuestung?.length > 0) return interaction.reply({ content: `Es ist bereits eine ***${character.angelegteRuestung}*** angelegt.` });
		const row = new ActionRowBuilder();
		character.ruestungen = character.ruestungen ?? [];
		character.ruestungen.filter(w => !character.angelegteRuestung || !character.angelegteRuestung.includes(w)).forEach(ruestungsname => {
			row.addComponents(new ButtonBuilder().setCustomId('rüstung:' + ruestungsname).setLabel(ruestungsname).setStyle(ButtonStyle.Primary));
		});
		return interaction.reply({ content: 'Wähle Rüstung zum anlegen', components: [row], fetchReply: true, flags: MessageFlags.Ephemeral });
	},
	ablegen: async ({ interaction, character, persistCharacter }) => {
		const ruestungsname = character.angelegteRuestung;
		character.angelegteRuestung = '';
		persistCharacter(character);
		return interaction.reply({ content: `Du hast die ***${ruestungsname}*** abgelegt`, fetchReply: true, flags: MessageFlags.Ephemeral });
	},
	entfernen: async ({ interaction, character }) => {
		character.ruestungen = character.ruestungen ?? [];
		if (character.ruestungen.length <= 0) return interaction.reply({ content: 'Du besitzt keine Rüstungen zum entfernen.', flags: MessageFlags.Ephemeral });
		const row = new ActionRowBuilder();
		character.ruestungen.forEach(ruestungsname => {
			row.addComponents(new ButtonBuilder().setCustomId('rüstung!' + ruestungsname).setLabel(ruestungsname).setStyle(ButtonStyle.Primary));
		});
		return interaction.reply({ content: 'Wähle Rüstung zum entfernen', components: [row], fetchReply: true, flags: MessageFlags.Ephemeral });
	},
};

const genericHandlers = {
	edit: async ({ interaction }) => {
		const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder().setCustomId('waffe').setLabel('Waffe').setStyle(ButtonStyle.Primary),
				new ButtonBuilder().setCustomId('rüstung').setLabel('Rüstung').setStyle(ButtonStyle.Primary),
			);
		return interaction.reply({ content: 'Waffe oder Rüstung', components: [row], fetchReply: true, flags: MessageFlags.Ephemeral });
	},
	info: async ({ interaction, character }) => {
		const result = Utils.createEmbedFromCharacter(character);
		return interaction.reply({ embeds: result, flags: MessageFlags.Ephemeral });
	},
	export: async ({ interaction, character }) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const result = await fillCharacterbogen({ characterInput: character });
		const displayName = character.displayName ?? character.name ?? 'character';
		const attachment = new AttachmentBuilder(result.outputPath, {
			name: `${displayName}-Charakterbogen.pdf`,
		});
		const skippedText = result.skipped.length > 0
			? ` Übersprungene Felder: ${result.skipped.length}.`
			: '';
		return interaction.editReply({
			content: `PDF-Export für ${character.displayName ?? character.name} erstellt. Gesetzte Felder: ${result.appliedCount}.${skippedText}`,
			files: [attachment],
		});
	},
	favorit: async ({ interaction, character, client, persistCharacter, slotIndex }) => {
		const fertigkeitValue = interaction.options.getString('fertigkeit');
		const ksfValue = interaction.options.getString('ksf');
		const label = interaction.options.getString('name')?.trim();
		const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;

		const angriffValue = interaction.options.getString('angriff')?.trim() || null;
		const givenCount = [fertigkeitValue, ksfValue, angriffValue].filter(Boolean).length;
		if (givenCount === 0) {
			return interaction.reply({ content: 'Bitte gib eine Fertigkeit, eine KSF oder einen Angriff an.', flags: MessageFlags.Ephemeral });
		}
		if (givenCount > 1) {
			return interaction.reply({ content: 'Bitte gib nur **eine** Option an (Fertigkeit, KSF oder Angriff).', flags: MessageFlags.Ephemeral });
		}

		character.quickProbeFavorites = Array.isArray(character.quickProbeFavorites)
			? [...character.quickProbeFavorites.slice(0, 3)]
			: [null, null, null];
		while (character.quickProbeFavorites.length < 3) {
			character.quickProbeFavorites.push(null);
		}

		let newSlot;

		if (ksfValue) {
			const subcommand = ksfValue;
			const baseName = KSF_LABEL_MAP[subcommand];
			if (!baseName) {
				return interaction.reply({ content: `KSF '${subcommand}' ist unbekannt.`, flags: MessageFlags.Ephemeral });
			}
			const stufe = interaction.options.getInteger('stufe') ?? null;
			if (KSF_HAS_STUFE.has(subcommand) && !stufe) {
				return interaction.reply({ content: `${baseName} benötigt eine Stufe (1-3).`, flags: MessageFlags.Ephemeral });
			}
			if (!KSF_HAS_STUFE.has(subcommand) && stufe) {
				return interaction.reply({ content: `${baseName} hat keine Stufen.`, flags: MessageFlags.Ephemeral });
			}
			const basismanoever = interaction.options.getString('basismanoever')?.trim() || null;
			if (basismanoever && !KSF_HAS_BASISMANOEVER.has(subcommand)) {
				return interaction.reply({ content: `${baseName} kann nicht mit einem Basismanöver kombiniert werden.`, flags: MessageFlags.Ephemeral });
			}
			const defaultLabel = stufe ? `${baseName} ${numToRoman[stufe]}` : baseName;
			newSlot = {
				type: 'ksf',
				subcommand,
				stufe: stufe || undefined,
				basismanoever: basismanoever || undefined,
				label: label || defaultLabel,
				bonusMalus: bonusMalus || undefined,
			};
		}
		else if (angriffValue) {
			const waffenName = client.Utils.highestSimilarity(angriffValue, (weaponName) => ({ name: weaponName, aliases: [] }), character.angelegteWaffen);
			if (!waffenName) {
				return interaction.reply({ content: `Du hast keine angelegte Waffe '${angriffValue}'.`, flags: MessageFlags.Ephemeral });
			}
			newSlot = {
				type: 'angriff',
				waffenName,
				label: label || undefined,
				bonusMalus: bonusMalus || undefined,
			};
		}
		else {
			const fertigkeit = resolveProbeOptionValue(fertigkeitValue, client);
			if (!fertigkeit) {
				return interaction.reply({ content: `Probe '${fertigkeitValue}' wurde nicht gefunden.`, flags: MessageFlags.Ephemeral });
			}
			if (!isSelectableProbeForCharacter(character, fertigkeit)) {
				return interaction.reply({ content: `Probe '${fertigkeit.name}' ist für deinen Charakter nicht verfügbar/aktiv.`, flags: MessageFlags.Ephemeral });
			}
			newSlot = {
				category: fertigkeit.kategorie,
				name: fertigkeit.name,
				label: label || undefined,
				bonusMalus: bonusMalus || undefined,
			};
		}

		const currentSlots = [...character.quickProbeFavorites];
		currentSlots[slotIndex] = newSlot;

		const slotKey = (slot) => slot.type === 'ksf'
			? `ksf|${slot.subcommand}|${slot.stufe ?? ''}|${slot.basismanoever ?? ''}`
			: slot.type === 'angriff'
				? `angriff|${slot.waffenName}`
				: `${slot.category}|${slot.name}`;

		// Clear old duplicates of the new slot at other positions first
		const newKey = slotKey(newSlot);
		for (let index = 0; index < currentSlots.length; index++) {
			if (index !== slotIndex && currentSlots[index] && slotKey(currentSlots[index]) === newKey) {
				currentSlots[index] = null;
			}
		}

		const seen = new Set();
		const normalized = [null, null, null];
		for (let index = 0; index < currentSlots.length; index++) {
			const slot = currentSlots[index];
			if (!slot) {
				continue;
			}
			const key = slotKey(slot);
			if (seen.has(key)) {
				normalized[index] = null;
				continue;
			}
			seen.add(key);
			normalized[index] = slot;
		}

		character.quickProbeFavorites = normalized;
		persistCharacter(character);

		const labels = character.quickProbeFavorites
			.map((x, idx) => formatFavoriteSlot(x, idx))
			.join(' | ');
		return interaction.reply({ content: `Favorit ${slotIndex + 1} gespeichert. Aktuelle Buttonleiste: ${labels}`, flags: MessageFlags.Ephemeral });
	},
	proben: async ({ interaction, character, client }) => {
		const history = client.eventHistoryProvider?.readProbeHistory({
			characterName: character.name,
			count: 50,
		}) ?? [];
		if (history.length === 0) {
			return interaction.reply({ content: 'Keine Proben gefunden.', flags: MessageFlags.Ephemeral });
		}
		const lines = history.map(entry => {
			const icon = entry.kritischBestanden ? '⭐' : entry.kritischFehlschlag ? '💩' : entry.bestanden ? '✅' : '❌';
			const bm = entry.bonusMalus !== 0 ? ` \`${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus}\`` : '';
			const qs = entry.bestanden && entry.fw != null
				? ` · QS **${getQS(entry.fw)}** (FP ${entry.fw})`
				: entry.fw != null ? ` · FP ${entry.fw}` : '';
			const date = entry.ts ? new Date(entry.ts).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '';
			return `${icon} **${entry.name}**${bm}${qs} · *${date}*`;
		});
		const title = `Proben von ${character.displayName ?? character.name} (letzte ${history.length})`;
		const CHUNK = 4000;
		const embeds = [];
		let current = '';
		for (const line of lines) {
			const next = current ? `${current}\n${line}` : line;
			if (next.length > CHUNK) {
				embeds.push({ title: embeds.length === 0 ? title : null, description: current, color: 0x3498DB });
				current = line;
			}
			else {
				current = next;
			}
		}
		if (current) embeds.push({ title: embeds.length === 0 ? title : null, description: current, color: 0x3498DB });
		await interaction.reply({ embeds: embeds.slice(0, 10), flags: MessageFlags.Ephemeral });
	},
};

function handleSubcommand({ interaction, character, client, persistCharacter }) {
	const subcommand = interaction.options.getSubcommand();
	const subcommandGroup = interaction.options.getSubcommandGroup(false);
	if (subcommandGroup === 'waffe' && waffenHandlers[subcommand]) {
		return waffenHandlers[subcommand]({ interaction, character, client, persistCharacter });
	}
	if (subcommandGroup === 'rüstung' && ruestungHandlers[subcommand]) {
		return ruestungHandlers[subcommand]({ interaction, character, client, persistCharacter });
	}
	const favoriteSlotIndex = getFavoriteSlotIndex(subcommand);
	if (favoriteSlotIndex !== null) {
		return genericHandlers.favorit({ interaction, character, client, persistCharacter, slotIndex: favoriteSlotIndex });
	}
	if (genericHandlers[subcommand]) {
		return genericHandlers[subcommand]({ interaction, character, client, persistCharacter });
	}
}

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const persistCharacter = client.Persistence.persistCharacter;
			return handleSubcommand({ interaction, character, client, persistCharacter });
		}
	},
};