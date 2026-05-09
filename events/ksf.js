import { InteractionType, Events, MessageFlags } from 'discord.js';
import path from 'path';
import sonderfertigkeiten from '../data/sonderfertigkeiten.json' with { type: 'json' };
import waffen from '../data/waffen.json' with { type: 'json' };
import logger from '../common/logger.js';

const KSF_QUICK_CUSTOM_ID_PREFIX = 'ksf:quick:';

const numToRoman = { 1: 'I', 2: 'II', 3: 'III' };

export { KSF_QUICK_CUSTOM_ID_PREFIX };

const executeQuickKsf = async ({ subcommand, stufe, basismanoever, character, client, interaction }) => {
	const utils = client.Utils;
	const rollDice = client.Common.rollDice;
	const waffenName = character.angelegteWaffen[0] ?? 'Waffenlos';
	const waffe = waffen.find(x => x.name === waffenName);
	const bm = basismanoever ? utils.basismanoever().find(x => x.name === basismanoever) : null;

	if (!waffe) {
		return await interaction.reply({ content: `Waffe ***${waffenName}*** nicht gefunden.`, flags: MessageFlags.Ephemeral });
	}

	let atMod = 0;
	let tpMod = 0;
	let sfName = '';
	let content = '';

	switch (subcommand) {
	case 'wuchtschlag': {
		sfName = `Wuchtschlag ${numToRoman[stufe]}`;
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `${sfName} hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		atMod = -(2 * stufe);
		tpMod = 2 * stufe;
		content = `Wuchtschlag mit ${waffenName}`;
		break;
	}
	case 'finte': {
		sfName = `Finte ${numToRoman[stufe]}`;
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `${sfName} hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		atMod = -stufe;
		tpMod = 0;
		content = `Finte mit ${waffenName}`;
		break;
	}
	case 'sturmangriff': {
		sfName = 'Sturmangriff';
		const sf = sonderfertigkeiten.find(x => x.name === sfName);
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `***${sfName}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		if (!sf.kampftechniken.includes(waffe.technik)) {
			return await interaction.reply({ content: `***${sfName}*** kann mit ${waffe.name} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
		}
		if (bm && !character.sonderfertigkeiten.some(x => x.name === bm.name)) {
			return await interaction.reply({ content: `***${bm.name}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		if (bm && bm.sfName === 'Finte I-III') {
			return await interaction.reply({ content: `***Finte*** kann mit ***${sfName}*** nicht kombiniert werden`, flags: MessageFlags.Ephemeral });
		}
		const belastung = character.getBelastungsmalus();
		atMod = -2 - (bm?.at ?? 0);
		tpMod = Math.round((character.gs - belastung) / 2) + (bm?.tp ?? 0);
		content = bm ? `***${sfName}*** mit ***${waffe.name}*** und ***${bm.name}***` : `***${sfName}*** mit ***${waffe.name}***`;
		break;
	}
	case 'todesstoß': {
		sfName = 'Todesstoß';
		const sf = sonderfertigkeiten.find(x => x.name === sfName);
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `***${sfName}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		if (!sf.kampftechniken.includes(waffe.technik)) {
			return await interaction.reply({ content: `***${sfName}*** kann mit ${waffe.name} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
		}
		if (bm && !character.sonderfertigkeiten.some(x => x.name === bm.name)) {
			return await interaction.reply({ content: `***${bm.name}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		atMod = -2 - (bm?.at ?? 0);
		tpMod = rollDice(6) + (bm?.tp ?? 0);
		content = bm ? `***${sfName}*** mit ***${waffe.name}*** und ***${bm.name}***` : `***${sfName}*** mit ***${waffe.name}***`;
		break;
	}
	case 'vorstoß': {
		sfName = 'Vorstoß';
		const sf = sonderfertigkeiten.find(x => x.name === sfName);
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `***${sfName}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		if (!sf.kampftechniken.includes(waffe.technik)) {
			return await interaction.reply({ content: `***${sfName}*** kann mit ${waffe.name} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
		}
		if (bm && !character.sonderfertigkeiten.some(x => x.name === bm.name)) {
			return await interaction.reply({ content: `***${bm.name}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		atMod = 2 - (bm?.at ?? 0);
		tpMod = 0 + (bm?.tp ?? 0);
		content = bm ? `***${sfName}*** mit ***${waffe.name}*** und ***${bm.name}***` : `***${sfName}*** mit ***${waffe.name}***`;
		break;
	}
	case 'entwaffnen': {
		sfName = 'Entwaffnen';
		const sf = sonderfertigkeiten.find(x => x.name === sfName);
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `***${sfName}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		if (!sf.kampftechniken.includes(waffe.technik)) {
			return await interaction.reply({ content: `***${sfName}*** kann mit ${waffe.name} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
		}
		if (bm && !character.sonderfertigkeiten.some(x => x.name === bm.name)) {
			return await interaction.reply({ content: `***${bm.name}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		atMod = sf.erschwernis - (bm?.at ?? 0);
		tpMod = 0 + (bm?.tp ?? 0);
		content = bm ? `***${sfName}*** mit ***${waffe.name}*** und ***${bm.name}***` : `***${sfName}*** mit ***${waffe.name}***`;
		break;
	}
	case 'zufallbringen': {
		sfName = 'Zu Fall bringen';
		const sf = sonderfertigkeiten.find(x => x.name === sfName);
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `***${sfName}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		if (!sf.kampftechniken.includes(waffe.technik)) {
			return await interaction.reply({ content: `***${sfName}*** kann mit ${waffe.name} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
		}
		if (bm && !character.sonderfertigkeiten.some(x => x.name === bm.name)) {
			return await interaction.reply({ content: `***${bm.name}*** hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		atMod = sf.erschwernis - (bm?.at ?? 0);
		tpMod = 0 + (bm?.tp ?? 0);
		content = bm ? `***${sfName}*** mit ***${waffe.name}*** und ***${bm.name}***` : `***${sfName}*** mit ***${waffe.name}***`;
		break;
	}
	case 'rundumschlag': {
		sfName = `Rundumschlag ${numToRoman[stufe]}`;
		if (!character.sonderfertigkeiten.some(d => d.name === sfName)) {
			return await interaction.reply({ content: `${sfName} hast du nicht`, flags: MessageFlags.Ephemeral });
		}
		const sf = sonderfertigkeiten.find(x => x.name === 'Rundumschlag I-II');
		if (sf?.kampftechniken && !sf.kampftechniken.includes(waffe.technik)) {
			return await interaction.reply({ content: `***${sfName}*** kann mit ${waffe.name} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
		}
		const attackCount = stufe === 1 ? 2 : 3;
		const erschwernis = [-2, -6, -10];
		const results = [];
		const embeds = [];
		for (let i = 0; i < attackCount; i++) {
			const data = utils.attack({ character, waffenName: waffe.name, bonusMalusAngriff: erschwernis[i], interaction });
			data.ksfSubcommand = 'rundumschlag'; data.ksfStufe = stufe;
			data.ksfLabel = sfName;
			const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
			embed.title = `[${i + 1}/${attackCount}] ${embed.title}`;
			embeds.push(embed);
			results.push(data);
		}
		await interaction.reply({ content: `***${sfName}*** mit ***${waffe.name}***`, embeds });
		return results;
	}
	default:
		return await interaction.reply({ content: 'Unbekannte Kampfsonderfertigkeit.', flags: MessageFlags.Ephemeral });
	}

	const data = utils.attack({ character, waffenName: waffe.name, bonusMalusAngriff: atMod, bonusMalusSchaden: tpMod, interaction });
	data.ksfSubcommand = subcommand;
	data.ksfStufe = stufe;
	data.ksfLabel = sfName;
	const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
	await interaction.reply({ content, embeds: [embed] });
	return [data];
};

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	customIds: [KSF_QUICK_CUSTOM_ID_PREFIX],
	async execute(interaction, character, client) {
		if (interaction.isButton() && interaction.customId.startsWith(KSF_QUICK_CUSTOM_ID_PREFIX)) {
			const payload = interaction.customId.slice(KSF_QUICK_CUSTOM_ID_PREFIX.length);
			// format: sectionKey:subcommand[:stufe][|basismanoever]
			const [colonPart, bmEncoded] = payload.split('|');
			const parts = colonPart.split(':');
			const subcommand = parts[1];
			const stufe = parts[2] ? parseInt(parts[2]) : null;
			const basismanoever = bmEncoded ? decodeURIComponent(bmEncoded) : null;
			return executeQuickKsf({ subcommand, stufe, basismanoever, character, client, interaction });
		}

		if (!interaction.isChatInputCommand() && !interaction.type === InteractionType.ApplicationCommandAutocomplete) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const utils = client.Utils;
			const rollDice = client.Common.rollDice;
			if (interaction.options.getSubcommand() === 'wuchtschlag') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const stufe = interaction.options.getInteger('stufe') ?? 0;
				const wuchtschlag = 'Wuchtschlag ' + (stufe === 1 ? 'I' : stufe === 2 ? 'II' : 'III');
				if (character.sonderfertigkeiten.filter(d => d.name === wuchtschlag).length > 0) {
					const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
					const data = utils.attack({ character, waffenName, bonusMalusAngriff: bonusMalus - (2 * stufe), bonusMalusSchaden: 2 * stufe, interaction });
					data.ksfSubcommand = 'wuchtschlag'; data.ksfStufe = stufe;
					data.ksfLabel = wuchtschlag;
					const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });

					await interaction.reply({ content: 'Wuchtschlag mit ' + waffenName, embeds: [embed] });
					return [data];
				}
				return await interaction.reply({ content: wuchtschlag + ' hast du nicht' });
			}
			else if (interaction.options.getSubcommand() === 'finte') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const stufe = interaction.options.getInteger('stufe') ?? 0;
				const finte = 'Finte ' + (stufe === 1 ? 'I' : stufe === 2 ? 'II' : 'III');
				if (character.sonderfertigkeiten.filter(d => d.name === finte).length > 0) {
					const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
					const data = utils.attack({ character, waffenName, bonusMalusAngriff: bonusMalus - stufe, interaction });
					data.ksfSubcommand = 'finte'; data.ksfStufe = stufe;
					data.ksfLabel = finte;
					const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });

					await interaction.reply({ content: 'Finte mit ' + waffenName, embeds: [embed] });
					return [data];
				}
				return await interaction.reply({ content: finte + ' hast du nicht' });
			}
			// Sturmangriff kann nicht mit Finte kombiniert werden
			else if (interaction.options.getSubcommand() === 'sturmangriff' && interaction.type === InteractionType.ApplicationCommandAutocomplete) {
				const focusedOption = interaction.options.getFocused(true);
				if (focusedOption.name === 'basismanoever') {
					const filtered = utils.basismanoever()
						.filter(bm => bm.name.toLowerCase().indexOf('finte') < 0)
						.filter(bm => character.sonderfertigkeiten.some(x => x.name === bm.name))
						.filter(bm => bm.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
					await interaction.respond(
						filtered.map(choice => ({ name: choice.name, value: choice.name })),
					);
				}
			}
			else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
				const focusedOption = interaction.options.getFocused(true);
				if (focusedOption.name === 'basismanoever') {
					const filtered = utils.basismanoever()
						.filter(bm => character.sonderfertigkeiten.some(x => x.name === bm.name))
						.filter(bm => bm.name.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
					await interaction.respond(
						filtered.map(choice => ({ name: choice.name, value: choice.name })),
					);
				}
			}
			else if (interaction.options.getSubcommand() === 'sturmangriff') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const basisManoever = interaction.options.getString('basismanoever');
				const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
				const waffe = waffen.find(x => x.name === waffenName);
				const belastung = character.getBelastungsmalus();
				const sf = sonderfertigkeiten.find(x => x.name === 'Sturmangriff');

				// Hat der Charakter Sturmangriff?
				if (!character.sonderfertigkeiten.find(d => d.name === sf.name)) {
					return await interaction.reply({ content: `***${sf.name}*** hast du nicht` });
				}

				// Kann Sturmangriff mit der Waffe gemacht werden?
				if (!sonderfertigkeiten.find(x => x.name === sf.name).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${sf.name}*** kann mit ${waffe.name} nicht verwendet werden` });
				}

				// Wurde ein Basismanöver angegeben und hat der Charakter das Basismanöver?
				const bm = utils.basismanoever().find(x => x.name === basisManoever);
				if (bm && character.sonderfertigkeiten.find(x => x.name === bm.name) === undefined) {
					return await interaction.reply({ content: `***${bm.name}*** hast du nicht` });
				}

				// Sturmangriff kann mit Finte nicht kombiniert werden
				if (bm && bm.sfName === 'Finte I-III') {
					return await interaction.reply({ content: `***Finte*** kann mit ***${sf.name}*** nicht kombiniert werden` });
				}

				// Kann die verwendete Waffe überhaupt mit dem Basismanöver verwendet werden?
				if (bm && !sonderfertigkeiten.find(x => x.name === bm.sfName).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${bm.name}*** kann mit ***${waffe.name}*** nicht verwendet werden` });
				}

				const data = utils.attack({ character, waffenName: waffe.name, bonusMalusAngriff: bonusMalus - 2 - (bm?.at ?? 0), bonusMalusSchaden: Math.round((character.gs - belastung) / 2) + (bm?.tp ?? 0), interaction });
				data.ksfSubcommand = 'sturmangriff'; data.ksfStufe = null;
				data.ksfLabel = sf.name;
				const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
				if (bm) {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}*** und ***${bm.name}***`, embeds: [embed] });}
				else {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}***`, embeds: [embed] });}
				return [data];
			}
			else if (interaction.options.getSubcommand() === 'todesstoß') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const basisManoever = interaction.options.getString('basismanoever');
				const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
				const waffe = waffen.find(x => x.name === waffenName);
				const sf = sonderfertigkeiten.find(x => x.name === 'Todesstoß');

				// Hat der Charakter Todesstoß?
				if (!character.sonderfertigkeiten.find(d => d.name === sf.name)) {
					return await interaction.reply({ content: `***${sf.name}*** hast du nicht` });
				}

				// Kann Todesstoß mit der Waffe gemacht werden?
				if (!sonderfertigkeiten.find(x => x.name === sf.name).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${sf.name}*** kann mit ${waffe.name} nicht verwendet werden` });
				}

				// Wurde ein Basismanöver angegeben und hat der Charakter das Basismanöver?
				const bm = utils.basismanoever().find(x => x.name === basisManoever);
				if (bm && character.sonderfertigkeiten.find(x => x.name === bm.name) === undefined) {
					return await interaction.reply({ content: `***${bm.name}*** hast du nicht` });
				}

				// Kann die verwendete Waffe überhaupt mit dem Basismanöver verwendet werden?
				if (bm && !sonderfertigkeiten.find(x => x.name === bm.sfName).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${bm.name}*** kann mit ***${waffe.name}*** nicht verwendet werden` });
				}

				const data = utils.attack({ character, waffenName: waffe.name, bonusMalusAngriff: bonusMalus - 2 - (bm?.at ?? 0), bonusMalusSchaden: rollDice(6) + (bm?.tp ?? 0), interaction });
				data.ksfSubcommand = 'todesstoß'; data.ksfStufe = null;
				data.ksfLabel = sf.name;
				const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
				if (bm) {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}*** und ***${bm.name}***`, embeds: [embed] });}
				else {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}***`, embeds: [embed] });}
				return [data];
			}
			else if (interaction.options.getSubcommand() === 'vorstoß') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const basisManoever = interaction.options.getString('basismanoever');
				const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
				const waffe = waffen.find(x => x.name === waffenName);
				const sf = sonderfertigkeiten.find(x => x.name === 'Vorstoß');

				// Hat der Charakter Vorstoß?
				if (!character.sonderfertigkeiten.find(d => d.name === sf.name)) {
					return await interaction.reply({ content: `***${sf.name}*** hast du nicht` });
				}

				// Kann Vorstoß mit der Waffe gemacht werden?
				if (!sonderfertigkeiten.find(x => x.name === sf.name).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${sf.name}*** kann mit ${waffe.name} nicht verwendet werden` });
				}

				// Wurde ein Basismanöver angegeben und hat der Charakter das Basismanöver?
				const bm = utils.basismanoever().find(x => x.name === basisManoever);
				if (bm && character.sonderfertigkeiten.find(x => x.name === bm.name) === undefined) {
					return await interaction.reply({ content: `***${bm.name}*** hast du nicht` });
				}

				// Kann die verwendete Waffe überhaupt mit dem Basismanöver verwendet werden?
				if (bm && !sonderfertigkeiten.find(x => x.name === bm.sfName).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${bm.name}*** kann mit ***${waffe.name}*** nicht verwendet werden` });
				}

				const data = utils.attack(
					{
						character,
						waffenName: waffe.name,
						bonusMalusAngriff: bonusMalus + 2 - (bm?.at ?? 0),
						bonusMalusSchaden: (bm?.tp ?? 0),
					});
				data.ksfSubcommand = 'vorstoß'; data.ksfStufe = null;
				data.ksfLabel = sf.name;
				const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
				if (bm) {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}*** und ***${bm.name}***`, embeds: [embed] });}
				else {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}***`, embeds: [embed] });}
				return [data];
			}
			else if (interaction.options.getSubcommand() === 'entwaffnen') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const basisManoever = interaction.options.getString('basismanoever');
				const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
				const waffe = waffen.find(x => x.name === waffenName);
				const sf = sonderfertigkeiten.find(x => x.name === 'Entwaffnen');
				// Hat der Charakter Entwaffnen?
				if (!character.sonderfertigkeiten.find(d => d.name === sf.name)) {
					return await interaction.reply({ content: `***${sf.name}*** hast du nicht` });
				}

				// Kann Entwaffnen mit der Waffe gemacht werden?
				if (!sonderfertigkeiten.find(x => x.name === sf.name).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${sf.name}*** kann mit ${waffe.name} nicht verwendet werden` });
				}

				// Wurde ein Basismanöver angegeben und hat der Charakter das Basismanöver?
				const bm = utils.basismanoever().find(x => x.name === basisManoever);
				if (bm && character.sonderfertigkeiten.find(x => x.name === bm.name) === undefined) {
					return await interaction.reply({ content: `***${bm.name}*** hast du nicht` });
				}

				// Kann die verwendete Waffe überhaupt mit dem Basismanöver verwendet werden?
				if (bm && !sonderfertigkeiten.find(x => x.name === bm.sfName).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${bm.name}*** kann mit ***${waffe.name}*** nicht verwendet werden` });
				}

				const data = utils.attack(
					{
						character,
						waffenName: waffe.name,
						bonusMalusAngriff: bonusMalus + sf.erschwernis - (bm?.at ?? 0),
						bonusMalusSchaden: (bm?.tp ?? 0),
					});
				data.ksfSubcommand = 'entwaffnen'; data.ksfStufe = null;
				data.ksfLabel = sf.name;
				const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
				if (bm) {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}*** und ***${bm.name}***`, embeds: [embed] });}
				else {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}***`, embeds: [embed] });}
				return [data];
			}
			else if (interaction.options.getSubcommand() === 'zufallbringen') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const basisManoever = interaction.options.getString('basismanoever');
				const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
				const waffe = waffen.find(x => x.name === waffenName);
				const sf = sonderfertigkeiten.find(x => x.name === 'Zu Fall bringen');
				logger.debug('ksf.zufallbringen.input', logger.traceMeta(interaction, {
					character: character.displayName ?? character.name,
					bonusMalus,
					basisManoever,
					waffenName,
					waffe,
					sf,
				}));
				// Hat der Charakter Entwaffnen?
				if (!character.sonderfertigkeiten.find(d => d.name === sf.name)) {
					return await interaction.reply({ content: `***${sf.name}*** hast du nicht` });
				}

				// Kann Entwaffnen mit der Waffe gemacht werden?
				if (!sonderfertigkeiten.find(x => x.name === sf.name).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${sf.name}*** kann mit ${waffe.name} nicht verwendet werden` });
				}

				// Wurde ein Basismanöver angegeben und hat der Charakter das Basismanöver?
				const bm = utils.basismanoever().find(x => x.name === basisManoever);
				if (bm && character.sonderfertigkeiten.find(x => x.name === bm.name) === undefined) {
					return await interaction.reply({ content: `***${bm.name}*** hast du nicht` });
				}

				// Kann die verwendete Waffe überhaupt mit dem Basismanöver verwendet werden?
				if (bm && !sonderfertigkeiten.find(x => x.name === bm.sfName).kampftechniken.includes(waffe.technik)) {
					return await interaction.reply({ content: `***${bm.name}*** kann mit ***${waffe.name}*** nicht verwendet werden` });
				}

				const data = utils.attack(
					{
						character,
						waffenName: waffe.name,
						bonusMalusAngriff: bonusMalus + sf.erschwernis - (bm?.at ?? 0),
						bonusMalusSchaden: (bm?.tp ?? 0),
					});
				data.ksfSubcommand = 'zufallbringen'; data.ksfStufe = null;
				data.ksfLabel = sf.name;
				const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
				if (bm) {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}*** und ***${bm.name}***`, embeds: [embed] });}
				else {await interaction.reply({ content: `***${sf.name}*** mit ***${waffe.name}***`, embeds: [embed] });}
				return [data];
			}
			else if (interaction.options.getSubcommand() === 'rundumschlag') {
				const bonusMalus = interaction.options.getInteger('bonus-malus') ?? 0;
				const stufe = interaction.options.getInteger('stufe') ?? 1;
				const rundumschlag = `Rundumschlag ${numToRoman[stufe]}`;
				if (!character.sonderfertigkeiten.some(d => d.name === rundumschlag)) {
					return await interaction.reply({ content: `${rundumschlag} hast du nicht` });
				}
				const waffenName = interaction.options.getString('waffenname') ?? character.angelegteWaffen[0] ?? 'Waffenlos';
				const sf = sonderfertigkeiten.find(x => x.name === 'Rundumschlag I-II');
				if (sf?.kampftechniken && !sf.kampftechniken.includes(waffen.find(x => x.name === waffenName)?.technik)) {
					return await interaction.reply({ content: `***${rundumschlag}*** kann mit ${waffenName} nicht verwendet werden`, flags: MessageFlags.Ephemeral });
				}

				const attackCount = stufe === 1 ? 2 : 3;
				const erschwernis = [-2, -6, -10];
				const results = [];
				const embeds = [];

				for (let i = 0; i < attackCount; i++) {
					const data = utils.attack({ character, waffenName, bonusMalusAngriff: bonusMalus + erschwernis[i], interaction });
					data.ksfSubcommand = 'rundumschlag'; data.ksfStufe = stufe;
					data.ksfLabel = rundumschlag;
					const embed = utils.createResultEmbedFromAttack({ character, data, interaction, client });
					embed.title = `[${i + 1}/${attackCount}] ${embed.title}`;
					embeds.push(embed);
					results.push(data);
				}

				await interaction.reply({ content: `***${rundumschlag}*** mit ***${waffenName}***`, embeds });
				return results;
			}
		}
	},
};