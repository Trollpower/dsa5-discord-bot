const TALENT_QUICK_BUTTON_ICONS = Object.freeze({
	'Alchimie': '⚗️',
	'Bekehren & Überzeugen': '🗣️',
	'Betören': '🌹',
	'Boote & Schiffe': '⛵',
	'Brett- & Glücksspiel': '🎲',
	'Einschüchtern': '😠',
	'Etikette': '🎩',
	'Fährtensuchen': '👣',
	'Fahrzeuge': '🛞',
	'Fesseln': '🪢',
	'Fischen & Angeln': '🎣',
	'Fliegen': '🪽',
	'Gassenwissen': '🏘️',
	'Gaukeleien': '🤹',
	'Geographie': '🗺️',
	'Geschichtswissen': '📜',
	'Götter & Kulte': '🛕',
	'Handel': '⚖️',
	'Heilkunde Gift': '☠️',
	'Heilkunde Krankheiten': '😷',
	'Heilkunde Seele': '💟',
	'Heilkunde Wunden': '🩹',
	'Holzbearbeitung': '🪵',
	'Klettern': '🧗',
	'Körperbeherrschung': '🤸',
	'Kraftakt': '💪',
	'Kriegskunst': '🛡️',
	'Lebensmittelbearbeitung': '🍞',
	'Lederbearbeitung': '🧥',
	'Magiekunde': '🔮',
	'Malen & Zeichnen': '🖌️',
	'Mechanik': '⚙️',
	'Menschenkenntnis': '👁️',
	'Metallbearbeitung': '🔨',
	'Musizieren': '🎼',
	'Orientierung': '🧭',
	'Pflanzenkunde': '🌿',
	'Rechnen': '🧮',
	'Rechtskunde': '📚',
	'Reiten': '🐎',
	'Sagen & Legenden': '📖',
	'Schlösserknacken': '🔐',
	'Schwimmen': '🏊',
	'Selbstbeherrschung': '🧘',
	'Singen': '🎤',
	'Sinnesschärfe': '👀',
	'Sphärenkunde': '🌌',
	'Steinbearbeitung': '🪨',
	'Sternkunde': '✨',
	'Stoffbearbeitung': '🪡',
	'Tanzen': '💃',
	'Taschendiebstahl': '🫳',
	'Tierkunde': '🐾',
	'Überreden': '💬',
	'Verbergen': '🫥',
	'Verkleiden': '🎭',
	'Wildnisleben': '🏕️',
	'Willenskraft': '✊',
	'Zechen': '🍺',
});

const PROBE_CATEGORY_EMOJIS = Object.freeze({
	zauber: '🪄',
	elfenlieder: '🧝',
	liturgien: '😇',
	rituale: '🔯',
	talente: '💪',
});

export const getQuickProbeEmoji = ({ category, name }) => {
	if (category === 'talente' && name && TALENT_QUICK_BUTTON_ICONS[name]) {
		return TALENT_QUICK_BUTTON_ICONS[name];
	}

	return PROBE_CATEGORY_EMOJIS[category] ?? '💪';
};

export { TALENT_QUICK_BUTTON_ICONS };