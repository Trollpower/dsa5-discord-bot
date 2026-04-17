import { rollDice } from './common.js';
import logger from './logger.js';
export const nachteile = [
	{
		name: 'Wilde Magie',
		pre: [
			{
				isApplyable: (props) => {
					const { character, event } = props;
					return (character.nachteile ?? []).find(x => x.name === 'Wilde Magie'
                        && ['zauber', 'rituale'].indexOf(event.fertigkeit.kategorie) > -1);
				},
				apply: (props) => {
					const { event } = props;
					event.failAt = 19;
					event.infos = event.infos ?? [];
					const info = { id: 'Wilde Magie', text: 'Die Schwelle für Zauberpatzer wurde auf 19 reduziert' };
					event.infos.push(info);
					return { ...event };
				},
			},
		],
		post: [],
	},
	{
		name: 'Persönlichkeitsschwäche',
		pre: [
			{
				isApplyable: (props) => {
					const { event,
						character: { nachteile: characterNachteile = [] },
					} = props;
					return characterNachteile.find(cn => cn.category === 'Unheimlich'
                        && [
                        	'Bekehren & Überzeugen',
                        	'Betören',
                        	'Etikette',
                        	'Gassenwissen',
                        	'Menschenkenntnis',
                        	'Überreden',
                        	'Verkleiden',
                        ].indexOf(event.talent.name) > -1);
				},
				apply: (props) => {
					const { event, applicable } = props;
					event.bonusMalus = (event.bonusMalus ?? 0) - 1;
					event.infos = event.infos ?? [];
					const info = { id: `Persönlichkeitsschwäche (${applicable?.category})`, text: `Für die Probe auf ${event.talent.name} wurde ein Malus von -1 angerechnet` };
					event.infos.push(info);
					return { ...event };
				},
			},
		],
		post: [],
	},
	{
		name: 'Persönlichkeitsschwäche',
		pre: [
			{
				isApplyable: (props) => {
					const {
						event,
						character: { nachteile: characterNachteile = [] },
					} = props;
					return characterNachteile.find(cn => cn.category === 'Arroganz'
                        && [
                        	'Bekehren & Überzeugen',
                        	'Betören',
                        	'Etikette',
                        	'Gassenwissen',
                        	'Menschenkenntnis',
                        	'Überreden',
                        	'Verkleiden',
                        	'Handel',
                        ].indexOf(event.talent.name) > -1);
				},
				apply: (props) => {
					const { event, applicable } = props;
					event.bonusMalus = (event.bonusMalus ?? 0) - 1;
					event.infos = event.infos ?? [];
					const info = { id: `Persönlichkeitsschwäche (${applicable.category})`, text: `Für die Probe auf ${event.talent.name} wurde ein Malus von -1 angerechnet` };
					event.infos.push(info);
					return { ...event };
				},
			},
		],
		post: [],
	},
	{
		name: 'Persönlichkeitsschwäche',
		pre: [
			{
				isApplyable: (props) => {
					const {
						event,
						character: { nachteile: characterNachteile = [] },
					} = props;
					return characterNachteile.find(cn => cn.category === 'Verwöhnt'
                        && [
                        	'Bekehren & Überzeugen',
                        	'Betören',
                        	'Einschüchtern',
                        	'Etikette',
                        	'Gassenwissen',
                        	'Menschenkenntnis',
                        	'Überreden',
                        	'Verkleiden',
                        	'Willenskraft',
                        ].indexOf(event.talent.name) > -1);
				},
				apply: (props) => {
					const { event, applicable } = props;
					event.bonusMalus = (event.bonusMalus ?? 0) - 1;
					event.infos = event.infos ?? [];
					const info = { id: `Persönlichkeitsschwäche (${applicable?.category})`, text: `Für die Probe auf ${event.talent.name} wurde ein Malus von -1 angerechnet` };
					event.infos.push(info);
					return { ...event };
				},
			},
		],
		post: [],
	},
	{
		name: 'Stigma',
		pre: [
			{
				isApplyable: (props) => {
					const { event,
						character: {
							nachteile: characterNachteile = [],
						},
					} = props;
					return characterNachteile.find(characterNachteil =>
						characterNachteil.name === 'Stigma'
                        && [
                        	'Bekehren & Überzeugen',
                        	'Betören',
                        	'Etikette',
                        	'Gassenwissen',
                        	'Menschenkenntnis',
                        	'Überreden',
                        	'Verkleiden',
                        	'Handel',
                        ].indexOf(event.talent.name) > -1);
				},
				apply: (props) => {
					const { event, applicable } = props;
					event.bonusMalus = (event.bonusMalus ?? 0) - 1;
					event.infos = event.infos ?? [];
					const info = { id: `Stigma (${applicable?.category})`, text: `Für die Probe auf ${event.talent.name} wurde ein Malus von -1 angerechnet` };
					event.infos.push(info);
					return { ...event };
				},
			},
		],
		post: [],
	},
];

export const vorteile = [
	{
		// Applies to potentially all fertigkeiten (e.g. Sinnesschärfe, Magiekunde).
		name: 'Begabung',
		pre: [],
		post: [
			{
				isApplyable: (props) => {
					const {
						event,
						character: {
							vorteile: characterVorteile = [],
						} } = props;

					return characterVorteile.find(characterVorteil =>
						characterVorteil.name === 'Begabung'
                        && characterVorteil.category === event.talent.name);
				},
				apply: (props) => {
					const { event } = props;
					const oldEvent = JSON.parse(JSON.stringify(event));

					// collect deviations
					const abweichungen = event.data.map((wurf, index) => Math.max(0, wurf.wurf - event.data[index].wertbrutto));

					// calculate potentials for improvements
					const potentiale = event.data.map((wurf, index) => {
						const eigenschaft = event.data[index].wertbrutto;
						const maxVerbesserung = abweichungen[index];
						const erfolgswahrscheinlichkeit = Math.min(1, eigenschaft / 20);
						return maxVerbesserung * erfolgswahrscheinlichkeit;
					});

					// determine highest potential index for reroll
					const optimalerIndex = potentiale.indexOf(Math.max(...potentiale));
					event.fw = event.talent.fertigkeitswert;
					if (Math.max(...potentiale) > 0) {
						const newWurf = rollDice(20);
						event.data[optimalerIndex].wurf = Math.min(newWurf, event.data[optimalerIndex].wurf);

						// recalculate the new final fertigkeitswert
						event.data.filter(o => o.wurf > o.wertbrutto).forEach(o => {
							const delta = o.wurf - o.wertbrutto;
							event.fw -= delta;
						});
						event.infos = event.infos ?? [];
						logger.debug('advantages.begabung.reroll', {
							character: props.character?.displayName ?? props.character?.name,
							optimalerIndex,
							data: event.data[optimalerIndex],
						});
						const zusatz = (event.fw > oldEvent.fw) ? `Fertigkeitspunkte von ${oldEvent.fw} auf ${event.fw} verbessert.` : 'Keine Verbesserung der Fertigkeitspunkte.';
						const info = { id: 'Begabung', text: `Neuer Wurf ${newWurf} für ${optimalerIndex + 1}. Eigenschaft ${event.data[optimalerIndex].name} ${event.data[optimalerIndex].wertbrutto} (vorher ${oldEvent.data[optimalerIndex].wurf}). ${zusatz}` };
						event.infos.push(info);
					}
					else {
						event.infos = event.infos ?? [];
						const info = { id: 'Begabung', text: 'Begabung hätte die Fertigkeitspunkte nicht verbesern können.' };
						event.infos.push(info);
					}

					event.bestanden = event.fw >= 0;
					event.kritischBestanden = event.data.filter(x => x.wurf === 1).length >= 2;
					event.kritischFehlschlag = event.data.filter(x => x.wurf === 20).length >= 2;
					return { ...event };
				},
			},
		],
	},
	{
		name: 'SchummelProbeCrit',
		pre: [],
		post: [
			{
				isApplyable: (props) => {
					const { event, character, isMeister = false } = props;
					const rand = Math.random();
					const randRange = (Math.floor(rand * 100) + 1);
					const critChance = (character?.cheating?.crit ?? 10);
					if (isMeister) {
						logger.debug('cheat.probe-crit.chance', {
							character: character.displayName ?? character.name,
							randRange,
							critChance,
							isMeister,
						});
					}
					// Apply cheat only for Meister at configured probability and only once per event.
					return isMeister && randRange <= critChance && event.cheated !== true;
				},
				apply: (props) => {
					const { event, character } = props;
					logger.debug('cheat.probe-crit.apply.before', {
						character: character.displayName ?? character.name,
						data: event.data,
					});
					event.fw = event.talent.fertigkeitswert;
					const shuffled = [...event.data].sort(() => 0.5 - Math.random());
					const randomItems = shuffled.slice(0, 2);
					randomItems[0].wurf = 1;
					randomItems[1].wurf = 1;
					logger.debug('cheat.probe-crit.apply.after', {
						character: character.displayName ?? character.name,
						data: event.data,
					});
					event.cheated = true;
					event.bestanden = event.fw >= 0;
					event.kritischBestanden = event.data.filter(x => x.wurf === 1).length >= 2;
					event.kritischFehlschlag = event.data.filter(x => x.wurf === 20).length >= 2;
					return { ...event };
				},
			},
		],
	},
	{
		name: 'SchummelProbeImprove',
		pre: [],
		post: [
			{
				isApplyable: (props) => {
					const { event, character, isMeister = false } = props;
					const rand = Math.random();
					const randRange = (Math.floor(rand * 100) + 1);
					const improveCHance = (character?.cheating?.general ?? 30);
					if (isMeister) {
						logger.debug('cheat.probe-improve.chance', {
							character: character.displayName ?? character.name,
							randRange,
							improveCHance,
							isMeister,
						});
					}
					// Apply cheat only for Meister at configured probability and only once per event.
					return isMeister && randRange <= improveCHance && event.cheated !== true;
				},
				apply: (props) => {
					const { event, character } = props;
					logger.debug('cheat.probe-improve.apply.before', {
						character: character.displayName ?? character.name,
						data: event.data,
					});
					event.fw = event.talent.fertigkeitswert;
					event.data.forEach(item => {
						const fallBack = (item.wertbrutto ?? item.wurf);
						const value = item.wurf > fallBack ? fallBack : item.wurf;

						const shuffled = [1, 2, 3].sort(() => 0.5 - Math.random());
						const randomBonus = shuffled.slice(0, 1);
						item.wurf = value <= randomBonus ? value : value - randomBonus;
						if (item.wurf > item.wertbrutto) {
							const delta = item.wurf - item.wertbrutto;
							event.fw -= delta;
						}
					});
					logger.debug('cheat.probe-improve.apply.after', {
						character: character.displayName ?? character.name,
						data: event.data,
					});
					event.cheated = true;
					event.bestanden = event.fw >= 0;
					event.kritischBestanden = event.data.filter(x => x.wurf === 1).length >= 2;
					event.kritischFehlschlag = event.data.filter(x => x.wurf === 20).length >= 2;
					return { ...event };
				},
			},
		],
	},
];