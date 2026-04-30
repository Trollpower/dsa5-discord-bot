import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFOptionList, PDFRadioGroup, PDFTextField } from 'pdf-lib';

import { Character } from '../common/character.js';
import {
	elfenliederData,
	fertigkeitenData,
	liturgienData,
	nachteileData,
	ritualeData,
	ruestungenData,
	segnungenData,
	sonderfertigkeitenData,
	vorteileData,
	waffenData,
	zauberData,
	zaubermelodienData,
	zeremonienData,
} from '../data/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const defaultPdfPath = path.join(projectRoot, 'tools', 'Charakterbogen.pdf');
const defaultCharacterPath = path.join(projectRoot, 'chars', 'lasse.json');

const KT_ORDER = ['Armbrüste', 'Bögen', 'Dolche', 'Fechtwaffen', 'Hiebwaffen', 'Kettenwaffen', 'Lanzen', 'Raufen', 'Schilde', 'Schwerter', 'Stangenwaffen', 'Wurfwaffen', 'Zweihandhiebwaffen', 'Zweihandschwerter'];
const KT_PA_MAPPING = [
	{ fieldSuffix: 3, technique: 'Dolche' },
	{ fieldSuffix: 4, technique: 'Fechtwaffen' },
	{ fieldSuffix: 5, technique: 'Hiebwaffen' },
	{ fieldSuffix: 7, technique: 'Lanzen' },
	{ fieldSuffix: 8, technique: 'Raufen' },
	{ fieldSuffix: 9, technique: 'Schilde' },
	{ fieldSuffix: 10, technique: 'Schwerter' },
	{ fieldSuffix: 11, technique: 'Stangenwaffen' },
	{ fieldSuffix: 13, technique: 'Zweihandhiebwaffen' },
	{ fieldSuffix: 14, technique: 'Zweihandschwerter' },
];
const RANGED_TECHNIQUES = new Set(['Armbrüste', 'Bögen', 'Wurfwaffen']);

const normalizeText = (value) => String(value ?? '')
	.normalize('NFD')
	.replace(/\p{Diacritic}/gu, '')
	.toLowerCase()
	.replace(/[()]/g, ' ')
	.replace(/\s+/g, ' ')
	.trim();

const TALENT_FIELD_MAPPING = new Map([
	['Fliegen', 'Talent_FW_1'],
	['Gaukeleien', 'Talent_FW_2'],
	['Klettern', 'Talent_FW_3'],
	['Körperbeherrschung', 'Talent_FW_4'],
	['Kraftakt', 'Talent_FW_5'],
	['Reiten', 'Talent_FW_6'],
	['Schwimmen', 'Talent_FW_7'],
	['Selbstbeherrschung', 'Talent_FW_8'],
	['Singen', 'Talent_FW_9'],
	['Sinnesschärfe', 'Talent_FW_10'],
	['Tanzen', 'Talent_FW_11'],
	['Taschendiebstahl', 'Talent_FW_12'],
	['Verbergen', 'Talent_FW_13'],
	['Zechen', 'Talent_FW_14'],
	['Bekehren & Überzeugen', 'Talent_FW_15'],
	['Betören', 'Talent_FW_16'],
	['Einschüchtern', 'Talent_FW_17'],
	['Etikette', 'Talent_FW_18'],
	['Gassenwissen', 'Talent_FW_19'],
	['Menschenkenntnis', 'Talent_FW_20'],
	['Überreden', 'Talent_FW_21'],
	['Verkleiden', 'Talent_FW_22'],
	['Willenskraft', 'Talent_FW_23'],
	['Fährtensuchen', 'Talent_FW_24'],
	['Fesseln', 'Talent_FW_25'],
	['Fischen & Angeln', 'Talent_FW_26'],
	['Orientierung', 'Talent_FW_27'],
	['Pflanzenkunde', 'Talent_FW_28'],
	['Tierkunde', 'Talent_FW_29'],
	['Wildnisleben', 'Talent_FW_30'],
	['Brett- & Glücksspiel', 'Talent_FW_31'],
	['Geographie', 'Talent_FW_32'],
	['Geschichtswissen', 'Talent_FW_33'],
	['Götter & Kulte', 'Talent_FW_34'],
	['Kriegskunst', 'Talent_FW_35'],
	['Magiekunde', 'Talent_FW_36'],
	['Mechanik', 'Talent_FW_37'],
	['Rechnen', 'Talent_FW_38'],
	['Rechtskunde', 'Talent_FW_39'],
	['Sagen & Legenden', 'Talent_FW_40'],
	['Sphärenkunde', 'Talent_FW_41'],
	['Sternkunde', 'Talent_FW_42'],
	['Alchimie', 'Talent_FW_43'],
	['Boote & Schiffe', 'Talent_FW_44'],
	['Fahrzeuge', 'Talent_FW_45'],
	['Handel', 'Talent_FW_46'],
	['Heilkunde Gift', 'Talent_FW_47'],
	['Heilkunde Krankheiten', 'Talent_FW_48'],
	['Heilkunde Seele', 'Talent_FW_49'],
	['Heilkunde Wunden', 'Talent_FW_50'],
	['Holzbearbeitung', 'Talent_FW_51'],
	['Lebensmittelbearbeitung', 'Talent_FW_52'],
	['Lederbearbeitung', 'Talent_FW_53'],
	['Malen & Zeichnen', 'Talent_FW_54'],
	['Metallbearbeitung', 'Talent_FW_55'],
	['Musizieren', 'Talent_FW_56'],
	['Schlösserknacken', 'Talent_FW_57'],
	['Steinbearbeitung', 'Talent_FW_58'],
	['Stoffbearbeitung', 'Talent_FW_59'],
].map(([talentName, fieldName]) => [normalizeText(talentName), fieldName]));

const stripRankSuffix = (value) => normalizeText(value)
	.replace(/\b[ivxlcdm]+(?:-[ivxlcdm]+)?\b/g, ' ')
	.replace(/\b\d+(?:-\d+)?\b/g, ' ')
	.replace(/\s+/g, ' ')
	.trim();

const asText = (value) => {
	if (value === null || value === undefined) return '';
	return String(value);
};

const sanitizeFileName = (value) => String(value ?? 'character')
	.replace(/[<>:"/\\|?*]/g, '-')
	.replace(/\s+/g, ' ')
	.trim();

const unique = (values) => [...new Set(values.filter(Boolean))];

const toSignedText = (value) => {
	if (value === null || value === undefined || value === '') return '';
	const numeric = Number(value);
	if (!Number.isFinite(numeric)) return String(value);
	if (numeric > 0) return `+${numeric}`;
	return `${numeric}`;
};

const formatNamedEntry = (entry) => {
	if (!entry?.name) return '';
	return entry.category ? `${entry.name} (${entry.category})` : entry.name;
};

const joinNamedEntries = (entries) => {
	if (!Array.isArray(entries) || entries.length === 0) return '';
	return entries.map(formatNamedEntry).filter(Boolean).join('\n');
};

const splitCharacterName = (character) => {
	const displayName = (character.displayName ?? character.name ?? '').trim();
	if (!displayName) {
		return { firstName: '', familyName: '' };
	}

	const parts = displayName.split(/\s+/);
	if (parts.length === 1) {
		return { firstName: parts[0], familyName: '' };
	}

	return {
		firstName: parts[0],
		familyName: parts.slice(1).join(' '),
	};
};

const getAdelStatus = (character) => {
	const adelVorteile = (character.vorteile ?? [])
		.map(vorteil => vorteil?.name)
		.filter(name => typeof name === 'string' && name.startsWith('Adel'))
		.sort((left, right) => right.localeCompare(left, 'de'));

	return adelVorteile[0] ?? '';
};

const getKampfreflexeCount = (character) => (character.sonderfertigkeiten ?? [])
	.filter(sf => sf?.name?.toUpperCase().includes('KAMPFREFLEXE'))
	.length;

const getVerbessertesAusweichenCount = (character) => (character.sonderfertigkeiten ?? [])
	.filter(sf => sf?.name?.startsWith('Verbessertes Ausweichen'))
	.length;

const getCharacterByName = (entries, name, valueKey = 'name') => (entries ?? []).find((entry) => normalizeText(entry?.[valueKey]) === normalizeText(name));

const findRuleEntry = (entries, name) => {
	const normalizedName = normalizeText(name);
	const strippedName = stripRankSuffix(name);

	return entries.find((entry) => {
		const entryName = normalizeText(entry?.name);
		const aliases = Array.isArray(entry?.alias) ? entry.alias.map(normalizeText) : [];
		if (entryName === normalizedName || aliases.includes(normalizedName)) return true;
		if (stripRankSuffix(entryName) === strippedName || aliases.some(alias => stripRankSuffix(alias) === strippedName)) return true;
		if (entryName.includes('...')) {
			const prefix = entryName.split('...')[0].trim();
			if (normalizedName.startsWith(prefix)) return true;
		}
		return false;
	});
};

const cleanApText = (entry, characterEntryName) => {
	const raw = entry?.apWert;
	if (!raw) return '';
	const compact = String(raw)
		.replace(/Abenteuerpunkte?/gi, '')
		.replace(/\s+/g, ' ')
		.replace(/^:\s*/, '')
		.trim();
	if (!compact) return '';

	const stageMatch = String(characterEntryName ?? '').match(/\b([IVXLCDM]+|\d+)$/i);
	if (stageMatch) {
		const stage = stageMatch[1];
		const stageRegex = new RegExp(`Stufe\\s*${stage}\\s*:\\s*([^;]+)`, 'i');
		const specific = compact.match(stageRegex);
		if (specific?.[1]) {
			return specific[1].trim();
		}
	}

	if (/pro stufe/i.test(compact)) {
		const numeric = compact.match(/-?\d+/);
		return numeric?.[0] ?? compact;
	}

	return compact;
};

const getEntryNote = (entry) => entry?.category ?? '';

const getSortedCharacterWeapons = (character) => {
	const equipped = character.angelegteWaffen ?? [];
	const all = character.waffen ?? [];
	return unique([...equipped, ...all]);
};

const getWeaponByName = (weaponName) => getCharacterByName(waffenData, weaponName);
const getArmorByName = (armorName) => getCharacterByName(ruestungenData, armorName);

const parseDamageFormula = (formula, bonus = 0) => {
	const source = String(formula ?? '').trim();
	const match = source.match(/^(?<roll>\d+W\d+)?(?<base>[+-]\d+)?$/i);
	if (!match) {
		return {
			roll: source,
			base: '',
			total: source,
		};
	}

	const roll = match.groups?.roll ?? '';
	const base = Number(match.groups?.base ?? 0);
	const totalBase = base + bonus;
	const total = `${roll}${totalBase === 0 ? '' : toSignedText(totalBase)}` || source;
	return {
		roll,
		base: totalBase === 0 ? '' : `${totalBase}`,
		total,
	};
};

const computeAttackValue = (character, kampftechnik, weaponMod = 0) => {
	if (!kampftechnik) return '';
	const belastung = character.getBelastungsmalus();
	const at = Math.floor(((character.eigenschaften?.MU ?? 0) - 8) / 3) + (kampftechnik.ktw > 6 ? kampftechnik.ktw : 6);
	return at + weaponMod - belastung;
};

const computeTechniqueAttackValue = (character, kampftechnik) => {
	if (!kampftechnik) return '';
	return Math.floor(((character.eigenschaften?.MU ?? 0) - 8) / 3) + (kampftechnik.ktw > 6 ? kampftechnik.ktw : 6);
};

const computeParryValue = (character, kampftechnik, weapon, weaponMod = 0) => {
	if (!kampftechnik || !weapon) return '';
	const le = character.besteLeiteigenschaft(weapon);
	const mod = Math.floor(((le.val ?? 0) - 8) / 3);
	const base = mod + (kampftechnik.ktw > 6 ? Math.ceil(kampftechnik.ktw / 2) : 3);
	return base + weaponMod - character.getBelastungsmalus();
};

const computeTechniqueParryValue = (character, kampftechnik, weapon) => {
	if (!kampftechnik || !weapon) return '';
	const le = character.besteLeiteigenschaft(weapon);
	const mod = Math.floor(((le.val ?? 0) - 8) / 3);
	return mod + (kampftechnik.ktw > 6 ? Math.ceil(kampftechnik.ktw / 2) : 3);
};

const classifyWeapon = (weapon) => {
	if (!weapon) return 'other';
	if (weapon.technik === 'Schilde' || weapon.gattung === 'Schilde') return 'shield';
	if (RANGED_TECHNIQUES.has(weapon.technik)) return 'ranged';
	return 'melee';
};

const classifySpecialAbility = (entry) => {
	const group = normalizeText(entry?.gruppe);
	if (group.includes('kampf')) return 'kampf';
	if (group.includes('mag')) return 'mag';
	if (group.includes('karm')) return 'karm';
	return 'allg';
};

const setFieldValue = (fieldValues, fieldName, value) => {
	if (value === null || value === undefined || value === '') return;
	fieldValues.set(fieldName, value);
};

const fillSequentialValues = ({ fieldValues, prefix, values, formatter = (value) => value }) => {
	values.forEach((value, index) => {
		setFieldValue(fieldValues, `${prefix}${index + 1}`, formatter(value, index));
	});
};

const fillTalentPage = ({ character, fieldValues }) => {
	for (const talent of character.talente ?? []) {
		const fieldName = TALENT_FIELD_MAPPING.get(normalizeText(talent?.name));
		if (!fieldName) continue;
		setFieldValue(fieldValues, fieldName, talent.fertigkeitswert);
	}

	const sprachen = character.sprachen ?? [];
	const schriften = character.schriften ?? [];
	sprachen.slice(0, 7).forEach((entry, index) => {
		const name = typeof entry === 'string' ? entry : entry?.name;
		const wert = typeof entry === 'string' ? '' : (entry?.stufe ?? entry?.wert ?? entry?.fertigkeitswert ?? '');
		setFieldValue(fieldValues, `Sprache_${index + 1}`, name);
		setFieldValue(fieldValues, `Sprache_Wert_${index + 1}`, wert);
	});
	schriften.slice(0, 5).forEach((entry, index) => {
		const name = typeof entry === 'string' ? entry : entry?.name;
		setFieldValue(fieldValues, `Schrift_${index + 1}`, name);
	});
};

const fillCombatTechniquePage = ({ character, fieldValues }) => {
	for (const [index, techniqueName] of KT_ORDER.entries()) {
		const kampftechnik = getCharacterByName(character.kampftechniken, techniqueName);
		if (!kampftechnik) continue;
		setFieldValue(fieldValues, `KT_FW_${index + 1}`, kampftechnik.ktw);
		setFieldValue(fieldValues, `KT_AT_${index + 1}`, computeTechniqueAttackValue(character, kampftechnik));
	}

	for (const { fieldSuffix, technique } of KT_PA_MAPPING) {
		const kampftechnik = getCharacterByName(character.kampftechniken, technique);
		if (!kampftechnik) continue;
		const referenceWeapon = waffenData.find(weapon => weapon.technik === technique);
		if (!referenceWeapon) continue;
		setFieldValue(fieldValues, `KT_PA_${fieldSuffix}`, computeTechniqueParryValue(character, kampftechnik, referenceWeapon));
	}
};

const fillMeleeAndRangedWeapons = ({ character, fieldValues }) => {
	const allWeapons = getSortedCharacterWeapons(character)
		.map(getWeaponByName)
		.filter(Boolean);
	const meleeWeapons = allWeapons.filter(weapon => classifyWeapon(weapon) === 'melee').slice(0, 4);
	const rangedWeapons = allWeapons.filter(weapon => classifyWeapon(weapon) === 'ranged').slice(0, 4);
	const shields = allWeapons.filter(weapon => classifyWeapon(weapon) === 'shield').slice(0, 4);

	meleeWeapons.forEach((weapon, index) => {
		const row = index + 1;
		const kampftechnik = getCharacterByName(character.kampftechniken, weapon.technik);
		const le = character.besteLeiteigenschaft(weapon);
		const damage = parseDamageFormula(weapon.tp, le.bonus ?? 0);
		setFieldValue(fieldValues, `Nahwaffe_Name_${row}`, weapon.name);
		setFieldValue(fieldValues, `Nah_Kampftechnik_Name_${row}`, weapon.technik);
		setFieldValue(fieldValues, `Nah_Schadensbonus_${row}`, le.bonus);
		setFieldValue(fieldValues, `Nah_Schadensschwelle_${row}`, weapon.schwelle);
		setFieldValue(fieldValues, `Nah_TP_Wurf_${row}`, damage.roll);
		setFieldValue(fieldValues, `Nah_TP_Basis_${row}`, damage.base);
		setFieldValue(fieldValues, `Nah_TP_${row}`, damage.total);
		setFieldValue(fieldValues, `Nah_AT_Mod_${row}`, weapon.at);
		setFieldValue(fieldValues, `Nah_PA_Mod_${row}`, weapon.pa);
		setFieldValue(fieldValues, `Nah_Reichweite_${row}`, weapon.rw);
		setFieldValue(fieldValues, `Nah_AT_${row}`, computeAttackValue(character, kampftechnik, Number.parseInt(weapon.at ?? '0', 10)));
		setFieldValue(fieldValues, `Nah_PA_${row}`, computeParryValue(character, kampftechnik, weapon, Number.parseInt(weapon.pa ?? '0', 10)));
		setFieldValue(fieldValues, `Nah_Gewicht_${row}`, weapon.gewicht);
	});

	rangedWeapons.forEach((weapon, index) => {
		const row = index + 1;
		const kampftechnik = getCharacterByName(character.kampftechniken, weapon.technik);
		const le = character.besteLeiteigenschaft(weapon);
		const damage = parseDamageFormula(weapon.tp, le.bonus ?? 0);
		setFieldValue(fieldValues, `Fernwaffe_Name_${row}`, weapon.name);
		setFieldValue(fieldValues, `Fern_Kampftechnik_Name_${row}`, weapon.technik);
		setFieldValue(fieldValues, `Fern_TP_${row}`, damage.total);
		setFieldValue(fieldValues, `Fern_FK_${row}`, computeAttackValue(character, kampftechnik, Number.parseInt(weapon.at ?? '0', 10)));
		setFieldValue(fieldValues, `Fern_Ladezeit_${row}`, weapon.lz);
		setFieldValue(fieldValues, `Fern_Munition_${row}`, weapon.munition);
		setFieldValue(fieldValues, `Fern_Reichweite_${row}`, weapon.rw);
		setFieldValue(fieldValues, `Fern_Gewicht_${row}`, weapon.gewicht);
	});

	shields.forEach((weapon, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `Schild_Name_${row}`, weapon.name);
		setFieldValue(fieldValues, `Schild_Mod_${row}`, weapon['at/pa-mod'] ?? `${weapon.at ?? ''}/${weapon.pa ?? ''}`);
		setFieldValue(fieldValues, `Schild_Gewicht_${row}`, weapon.gewicht);
	});
};

const fillArmorPage = ({ character, fieldValues }) => {
	const armorNames = unique([character.angelegteRuestung, ...(character.ruestungen ?? [])]).slice(0, 4);
	armorNames.forEach((armorName, index) => {
		const armor = getArmorByName(armorName);
		if (!armor) return;
		const row = index + 1;
		setFieldValue(fieldValues, `Ruestung_Name_${row}`, armor.name);
		setFieldValue(fieldValues, `Ruestung_RS_${row}`, armor.rs);
		setFieldValue(fieldValues, `Ruestung_BE_${row}`, armor.be);
		setFieldValue(fieldValues, `Ruestung_Gewicht_${row}`, armor.gewicht);
	});
	setFieldValue(fieldValues, 'Belastung_1', character.getBelastungsmalus());
};

const fillPossessionsPage = ({ character, fieldValues }) => {
	const items = [];
	for (const weaponName of getSortedCharacterWeapons(character)) {
		const weapon = getWeaponByName(weaponName);
		items.push({
			name: weaponName,
			ort: (character.angelegteWaffen ?? []).includes(weaponName) ? 'angelegt' : 'Inventar',
			gewicht: weapon?.gewicht ?? '',
		});
	}
	for (const armorName of unique([character.angelegteRuestung, ...(character.ruestungen ?? [])])) {
		const armor = getArmorByName(armorName);
		items.push({
			name: armorName,
			ort: character.angelegteRuestung === armorName ? 'getragen' : 'Inventar',
			gewicht: armor?.gewicht ?? '',
		});
	}

	items.slice(0, 66).forEach((item, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `Besitz_Name_${row}`, item.name);
		setFieldValue(fieldValues, `Besitz_Ort_${row}`, item.ort);
		setFieldValue(fieldValues, `Besitz_Gewicht_${row}`, item.gewicht);
	});
};

const fillAdvantagesAndDisadvantages = ({ character, fieldValues }) => {
	(character.vorteile ?? []).slice(0, 22).forEach((entry, index) => {
		setFieldValue(fieldValues, `Vorteil_${index + 1}`, formatNamedEntry(entry));
	});

	(character.nachteile ?? []).slice(0, 22).forEach((entry, index) => {
		const ruleEntry = findRuleEntry(nachteileData, entry.name);
		const row = index + 1;
		setFieldValue(fieldValues, `Nachteil_${row}`, formatNamedEntry(entry));
		setFieldValue(fieldValues, `Nachteil_AP_${row}`, cleanApText(ruleEntry, entry.name));
		setFieldValue(fieldValues, `Nachteil_Er_${row}`, getEntryNote(entry));
	});

	(character.sprachen ?? []).slice(0, 22).forEach((entry, index) => {
		const row = index + 1;
		const value = typeof entry === 'string' ? { name: entry } : entry;
		setFieldValue(fieldValues, `Sprachen_${row}`, value?.name);
		setFieldValue(fieldValues, `Sprachen_Stufe_${row}`, value?.stufe ?? value?.wert ?? value?.fertigkeitswert ?? '');
	});

	(character.schriften ?? []).slice(0, 22).forEach((entry, index) => {
		const row = index + 1;
		const value = typeof entry === 'string' ? { name: entry } : entry;
		setFieldValue(fieldValues, `Schriften_${row}`, value?.name);
		setFieldValue(fieldValues, `Schriften_Spalte_${row}`, value?.spalte ?? value?.wert ?? '');
	});
};

const fillSpecialAbilities = ({ character, fieldValues }) => {
	const grouped = {
		allg: [],
		kampf: [],
		mag: [],
		karm: [],
	};

	for (const entry of character.sonderfertigkeiten ?? []) {
		const ruleEntry = findRuleEntry(sonderfertigkeitenData, entry.name);
		const group = classifySpecialAbility(ruleEntry);
		grouped[group].push({ entry, ruleEntry });
	}

	grouped.allg.slice(0, 46).forEach(({ entry, ruleEntry }, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `SF_allg_${row}`, formatNamedEntry(entry));
		setFieldValue(fieldValues, `SF_allg_AP_${row}`, cleanApText(ruleEntry, entry.name));
		setFieldValue(fieldValues, `SF_allg_Er_${row}`, getEntryNote(entry));
	});

	grouped.kampf.slice(0, 46).forEach(({ entry, ruleEntry }, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `SF_Kampf_${row}`, formatNamedEntry(entry));
		setFieldValue(fieldValues, `SF_Kampf_AP_${row}`, cleanApText(ruleEntry, entry.name));
		setFieldValue(fieldValues, `SF_Kampf_Er_${row}`, getEntryNote(entry));
	});

	grouped.mag.slice(0, 22).forEach(({ entry, ruleEntry }, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `SF_mag_${row}`, formatNamedEntry(entry));
		setFieldValue(fieldValues, `SF_mag_AP_${row}`, cleanApText(ruleEntry, entry.name));
		setFieldValue(fieldValues, `SF_mag_Er_${row}`, getEntryNote(entry));
	});

	grouped.karm.slice(0, 22).forEach(({ entry, ruleEntry }, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `SF_karm_${row}`, formatNamedEntry(entry));
		setFieldValue(fieldValues, `SF_karm_AP_${row}`, cleanApText(ruleEntry, entry.name));
		setFieldValue(fieldValues, `SF_karm_Er_${row}`, getEntryNote(entry));
	});
};

const fillBlessingsAndTricks = ({ character, fieldValues }) => {
	(character.segnungen ?? []).slice(0, 22).forEach((entry, index) => {
		setFieldValue(fieldValues, `Segnung_${index + 1}`, formatNamedEntry(entry));
	});

	(character.tricks ?? character.zaubertricks ?? []).slice(0, 22).forEach((entry, index) => {
		setFieldValue(fieldValues, `Trick_${index + 1}`, formatNamedEntry(entry));
	});
};

const buildMagicLookup = () => ({
	zauber: zauberData,
	rituale: ritualeData,
	elfenlieder: elfenliederData,
	melodien: zaubermelodienData,
	liturgien: liturgienData,
	zeremonien: zeremonienData,
	segnungen: segnungenData,
});

const enrichMagicEntry = (groupKey, entry, lookup) => {
	const list = lookup[groupKey] ?? [];
	const ruleEntry = findRuleEntry(list, entry.name);
	return {
		name: entry.name,
		fw: entry.fertigkeitswert ?? '',
		aspekt: ruleEntry?.aspekt ?? ruleEntry?.merkmal ?? '',
		probe: Array.isArray(ruleEntry?.eigenschaften) ? ruleEntry.eigenschaften.join('/') : '',
		rw: ruleEntry?.rw ?? ruleEntry?.reichweite ?? '',
		seite: ruleEntry?.publikationen ?? '',
		sf: Array.isArray(entry?.erweiterungen) ? entry.erweiterungen.join(', ') : '',
		wdauer: ruleEntry?.wirkungsdauer ?? '',
		wirkung: ruleEntry?.wirkung ?? '',
		zdauer: ruleEntry?.zauberdauer ?? ruleEntry?.liturgiedauer ?? '',
		kap: ruleEntry?.kap ?? '',
		asp: ruleEntry?.asp ?? '',
	};
};

const fillMagicPages = ({ character, fieldValues }) => {
	const lookup = buildMagicLookup();
	const magicEntries = [
		...(character.zauber ?? []).map(entry => ({ ...enrichMagicEntry('zauber', entry, lookup), kind: 'zauber' })),
		...(character.rituale ?? []).map(entry => ({ ...enrichMagicEntry('rituale', entry, lookup), kind: 'zauber' })),
		...(character.elfenlieder ?? []).map(entry => ({ ...enrichMagicEntry('elfenlieder', entry, lookup), kind: 'zauber' })),
		...(character.melodien ?? character.zaubermelodien ?? []).map(entry => ({ ...enrichMagicEntry('melodien', entry, lookup), kind: 'zauber' })),
		...(character.liturgien ?? []).map(entry => ({ ...enrichMagicEntry('liturgien', entry, lookup), kind: 'liturgie' })),
		...(character.zeremonien ?? []).map(entry => ({ ...enrichMagicEntry('zeremonien', entry, lookup), kind: 'liturgie' })),
	];

	magicEntries.slice(0, 21).forEach((entry, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `ZauberLiturgie_${row}`, entry.name);
		setFieldValue(fieldValues, `ZL_FW_${row}`, entry.fw);
		setFieldValue(fieldValues, `ZL_Probe_${row}`, entry.probe);
		setFieldValue(fieldValues, `ZL_RW_${row}`, entry.rw);
		setFieldValue(fieldValues, `ZL_Seite_${row}`, entry.seite);
		setFieldValue(fieldValues, `ZL_SF_${row}`, entry.sf);
		setFieldValue(fieldValues, `ZL_WDauer_${row}`, entry.wdauer);
		setFieldValue(fieldValues, `ZL_Wirkung_${row}`, entry.wirkung);
		setFieldValue(fieldValues, `ZL_MerkAsp_${row}`, entry.aspekt);
		setFieldValue(fieldValues, `ZL_AsKaP_${row}`, entry.kind === 'liturgie' ? entry.kap : entry.asp);
	});

	magicEntries.filter(entry => entry.kind === 'zauber').slice(0, 21).forEach((entry, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `Zauber_${row}`, entry.name);
		setFieldValue(fieldValues, `Z_FW_${row}`, entry.fw);
		setFieldValue(fieldValues, `Z_Merkmal_${row}`, entry.aspekt);
		setFieldValue(fieldValues, `Z_AsP_${row}`, entry.asp);
		setFieldValue(fieldValues, `Z_Probe_${row}`, entry.probe);
		setFieldValue(fieldValues, `Z_RW_${row}`, entry.rw);
		setFieldValue(fieldValues, `Z_Seite_${row}`, entry.seite);
		setFieldValue(fieldValues, `Z_SF_${row}`, entry.sf);
		setFieldValue(fieldValues, `Z_WDauer_${row}`, entry.wdauer);
		setFieldValue(fieldValues, `Z_Wirkung_${row}`, entry.wirkung);
		setFieldValue(fieldValues, `Z_ZDauer_${row}`, entry.zdauer);
	});

	magicEntries.filter(entry => entry.kind === 'liturgie').slice(0, 21).forEach((entry, index) => {
		const row = index + 1;
		setFieldValue(fieldValues, `Liturgie_${row}`, entry.name);
		setFieldValue(fieldValues, `L_FW_${row}`, entry.fw);
		setFieldValue(fieldValues, `L_Aspekt_${row}`, entry.aspekt);
		setFieldValue(fieldValues, `L_KaP_${row}`, entry.kap);
		setFieldValue(fieldValues, `L_Probe_${row}`, entry.probe);
		setFieldValue(fieldValues, `L_RW_${row}`, entry.rw);
		setFieldValue(fieldValues, `L_Seite_${row}`, entry.seite);
		setFieldValue(fieldValues, `L_SF_${row}`, entry.sf);
		setFieldValue(fieldValues, `L_WDauer_${row}`, entry.wdauer);
		setFieldValue(fieldValues, `L_Wirkung_${row}`, entry.wirkung);
		setFieldValue(fieldValues, `L_LDauer_${row}`, entry.zdauer);
	});
};

const buildFieldValues = (character) => {
	const fieldValues = new Map();
	const { firstName, familyName } = splitCharacterName(character);
	const belastung = character.getBelastungsmalus();
	const ruestungsschutz = character.getRuestungsschutz();
	const ausweichenBasiswert = Math.round((character.eigenschaften?.GE ?? 0) / 2);
	const verbessertesAusweichen = getVerbessertesAusweichenCount(character);
	const ausweichen = ausweichenBasiswert - belastung + (ruestungsschutz > 0 ? 0 : verbessertesAusweichen);
	const initiativeBasiswert = Math.ceil(((character.eigenschaften?.MU ?? 0) + (character.eigenschaften?.GE ?? 0)) / 2) + getKampfreflexeCount(character);

	for (const eigenschaft of ['MU', 'KL', 'IN', 'CH', 'FF', 'GE', 'KO', 'KK']) {
		setFieldValue(fieldValues, `${eigenschaft}_1`, character.eigenschaften?.[eigenschaft]);
	}

	setFieldValue(fieldValues, 'Held_Name', firstName);
	setFieldValue(fieldValues, 'Held_Familie', familyName);
	setFieldValue(fieldValues, 'Held_Sozialstatus', getAdelStatus(character));
	setFieldValue(fieldValues, 'Held_Vorteile', joinNamedEntries(character.vorteile));
	setFieldValue(fieldValues, 'Held_Nachteile', joinNamedEntries(character.nachteile));
	setFieldValue(fieldValues, 'Held_SF_allgemein', joinNamedEntries(character.sonderfertigkeiten));
	setFieldValue(fieldValues, 'GW_LE', character.lep?.max);
	setFieldValue(fieldValues, 'GW_SK', character.sk);
	setFieldValue(fieldValues, 'GW_ZK', character.zk);
	setFieldValue(fieldValues, 'GW_GS', character.gs);
	setFieldValue(fieldValues, 'LE_Wert_1', character.lep?.aktuell);
	setFieldValue(fieldValues, 'LE_Max_1', character.lep?.max);
	setFieldValue(fieldValues, 'AE_Wert_1', character.asp?.aktuell);
	setFieldValue(fieldValues, 'AE_Max_1', character.asp?.max);
	setFieldValue(fieldValues, 'KE_Wert_1', character.kap?.aktuell);
	setFieldValue(fieldValues, 'KE_Max_1', character.kap?.max);
	setFieldValue(fieldValues, 'SK_Wert_1', character.sk);
	setFieldValue(fieldValues, 'SK_Max_1', character.sk);
	setFieldValue(fieldValues, 'ZK_Wert_1', character.zk);
	setFieldValue(fieldValues, 'ZK_Max_1', character.zk);
	setFieldValue(fieldValues, 'AW_Wert_1', ausweichen);
	setFieldValue(fieldValues, 'AW_Max_1', ausweichen);
	setFieldValue(fieldValues, 'INI_Wert_1', character.initiative);
	setFieldValue(fieldValues, 'INI_Max_1', character.initiative);
	setFieldValue(fieldValues, 'GS_Wert_1', character.gs);
	setFieldValue(fieldValues, 'GS_Max_1', character.gs);
	setFieldValue(fieldValues, 'LE_BM_1', belastung > 0 ? -belastung : '');
	setFieldValue(fieldValues, 'AW_BM_1', belastung > 0 ? -belastung : '');
	setFieldValue(fieldValues, 'INI_BM_1', character.initiative ? character.initiative - initiativeBasiswert + belastung : '');
	setFieldValue(fieldValues, 'GS_BM_1', belastung > 0 ? -belastung : '');
	setFieldValue(fieldValues, 'SchiP_Wert_1', character.schip?.wert ?? character.schip?.max);
	setFieldValue(fieldValues, 'SchiP_Max_1', character.schip?.max ?? character.schip?.wert);
	setFieldValue(fieldValues, 'SchiP_Aktuell_1', character.schip?.aktuell);

	fillTalentPage({ character, fieldValues });
	fillCombatTechniquePage({ character, fieldValues });
	fillMeleeAndRangedWeapons({ character, fieldValues });
	fillArmorPage({ character, fieldValues });
	fillMagicPages({ character, fieldValues });
	fillPossessionsPage({ character, fieldValues });
	fillAdvantagesAndDisadvantages({ character, fieldValues });
	fillSpecialAbilities({ character, fieldValues });
	fillBlessingsAndTricks({ character, fieldValues });

	return fieldValues;
};

const applyFieldValue = (field, value) => {
	if (field instanceof PDFTextField) {
		field.setText(asText(value));
		return true;
	}

	if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
		if (!value) return false;
		const textValue = asText(value);
		const options = typeof field.getOptions === 'function' ? field.getOptions() : [];
		if (!options.includes(textValue) && typeof field.addOptions === 'function') {
			field.addOptions([textValue]);
		}
		field.select(textValue);
		return true;
	}

	if (field instanceof PDFCheckBox) {
		if (value === true || value === 'Ja' || value === 'true' || value === '1') {
			field.check();
		}
		else {
			field.uncheck();
		}
		return true;
	}

	if (field instanceof PDFRadioGroup) {
		if (!value) return false;
		field.select(asText(value));
		return true;
	}

	return false;
};

const resolveCharacterPath = async (rawArg) => {
	if (!rawArg) return defaultCharacterPath;
	const directPath = path.resolve(projectRoot, rawArg);
	try {
		await fs.access(directPath);
		return directPath;
	}
	catch {}

	const charsDir = path.join(projectRoot, 'chars');
	const expectedName = rawArg.endsWith('.json') ? rawArg : `${rawArg}.json`;
	const exactCandidate = path.join(charsDir, expectedName);
	try {
		await fs.access(exactCandidate);
		return exactCandidate;
	}
	catch {}

	const files = await fs.readdir(charsDir);
	const found = files.find(file => normalizeText(file) === normalizeText(expectedName));
	if (found) return path.join(charsDir, found);

	throw new Error(`Character file not found for argument: ${rawArg}`);
};

const resolveOutputPath = (character, rawArg) => {
	if (rawArg) return path.resolve(projectRoot, rawArg);
	const baseName = sanitizeFileName(character.displayName ?? character.name ?? 'character');
	return path.join(projectRoot, 'output', `${baseName}-Charakterbogen.pdf`);
};

const ensureCharacter = (characterInput) => {
	if (characterInput instanceof Character) {
		return characterInput;
	}
	return new Character(characterInput);
};

const fillCharacterbogen = async ({ characterInput, characterPath, pdfPath = defaultPdfPath, outputPath } = {}) => {
	let resolvedCharacterPath = characterPath ? path.resolve(projectRoot, characterPath) : null;
	let character = characterInput ? ensureCharacter(characterInput) : null;

	if (!character) {
		resolvedCharacterPath = await resolveCharacterPath(characterPath);
		const characterRaw = await fs.readFile(resolvedCharacterPath, 'utf8');
		character = new Character(JSON.parse(characterRaw));
	}

	const resolvedPdfPath = path.resolve(projectRoot, pdfPath);
	const resolvedOutputPath = resolveOutputPath(character, outputPath);
	const pdfBytes = await fs.readFile(resolvedPdfPath);
	const pdfDoc = await PDFDocument.load(pdfBytes);
	const form = pdfDoc.getForm();
	const fieldsByName = new Map(form.getFields().map(field => [field.getName(), field]));
	const fieldValues = buildFieldValues(character);
	const applied = [];
	const skipped = [];

	for (const [fieldName, value] of fieldValues.entries()) {
		const field = fieldsByName.get(fieldName);
		if (!field) {
			skipped.push({ fieldName, reason: 'missing-field' });
			continue;
		}

		if (value === null || value === undefined || value === '') {
			skipped.push({ fieldName, reason: 'empty-value' });
			continue;
		}

		if (!applyFieldValue(field, value)) {
			skipped.push({ fieldName, reason: 'unsupported-or-invalid-option', value });
			continue;
		}

		applied.push(fieldName);
	}

	await fs.mkdir(path.dirname(resolvedOutputPath), { recursive: true });
	const filledPdfBytes = await pdfDoc.save();
	await fs.writeFile(resolvedOutputPath, filledPdfBytes);

	return {
		characterPath: resolvedCharacterPath,
		pdfPath: resolvedPdfPath,
		outputPath: resolvedOutputPath,
		appliedCount: applied.length,
		applied,
		skipped,
	};
	};

const main = async () => {
	const args = process.argv.slice(2);
	const result = await fillCharacterbogen({
		characterPath: args[0],
		pdfPath: args[1] ?? defaultPdfPath,
		outputPath: args[2],
	});

	console.log(JSON.stringify({
		characterPath: result.characterPath,
		pdfPath: result.pdfPath,
		outputPath: result.outputPath,
		appliedCount: result.appliedCount,
		applied: result.applied,
		skipped: result.skipped,
	}, null, 2));
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
	main().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}

export { fillCharacterbogen };