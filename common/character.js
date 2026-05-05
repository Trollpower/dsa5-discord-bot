import { ruestungenData } from '../data/index.js';

const ensureQuickProbeFavoritesDefaults = (character) => {
	const raw = Array.isArray(character.quickProbeFavorites)
		? character.quickProbeFavorites
		: [];
	const normalized = [null, null, null];
	for (let index = 0; index < Math.min(3, raw.length); index++) {
		const entry = raw[index];
		if (entry?.type === 'ksf' && entry?.subcommand) {
			normalized[index] = {
				type: 'ksf',
				subcommand: entry.subcommand,
				stufe: entry.stufe || undefined,
				basismanoever: entry.basismanoever || undefined,
				label: typeof entry.label === 'string' && entry.label.trim().length > 0
					? entry.label.trim()
					: undefined,
				bonusMalus: entry.bonusMalus || undefined,
			};
		}
		else if (entry?.type === 'angriff' && entry?.waffenName) {
			normalized[index] = {
				type: 'angriff',
				waffenName: entry.waffenName,
				label: typeof entry.label === 'string' && entry.label.trim().length > 0
					? entry.label.trim()
					: undefined,
				bonusMalus: entry.bonusMalus || undefined,
			};
		}
		else if (entry?.category && entry?.name) {
			normalized[index] = {
				category: entry.category,
				name: entry.name,
				label: typeof entry.label === 'string' && entry.label.trim().length > 0
					? entry.label.trim()
					: undefined,
				bonusMalus: entry.bonusMalus || undefined,
			};
		}
	}
	character.quickProbeFavorites = normalized;
};

class Character {
	constructor(json) {
		Object.assign(this, json);
		this.wesenszug = this.wesenszug || '';
		ensureQuickProbeFavoritesDefaults(this);
	}

	getBelastungsmalus() {
		const ruestungsName = (!this.angelegteRuestung || this.angelegteRuestung.length === 0) ? 'Normale Kleidung/Felle/Nackt' : this.angelegteRuestung;
		const ruestung = ruestungenData.find(x => x.name === ruestungsName);

		const sfs = this.sonderfertigkeiten.map(x => x.name);
		let bg = 0;
		if (sfs.includes('Belastungsgewöhnung I')) {bg = 1;}
		if (sfs.includes('Belastungsgewöhnung II')) {bg = 2;}

		const be = ((ruestung.be ?? 0) - bg);
		return be < 0 ? 0 : be;
	}

	getRuestungsschutz() {
		const ruestungsName = (!this.angelegteRuestung || this.angelegteRuestung.length === 0) ? 'Normale Kleidung/Felle/Nackt' : this.angelegteRuestung;
		const ruestung = ruestungenData.find(x => x.name === ruestungsName);
		return ruestung.rs ?? 0;
	}

	besteLeiteigenschaft(waffe) {
		let res = { eig: '', val: 0, bonus: 0 };
		if (!waffe.leit) {return res;}

		const les = waffe.leit.split('/');
		les.forEach(le => {
			if (this.eigenschaften[le] > res.val) {
				res = { eig: le, val: this.eigenschaften[le] };
			}
		});
		res.bonus = 0;
		if (res.val) {
			res.bonus = res.val - waffe.schwelle;
			if (res.bonus < 0) {res.bonus = 0;}
		}

		return res;
	}
}

export { Character };