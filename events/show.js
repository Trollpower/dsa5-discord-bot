import { EmbedBuilder, Events } from 'discord.js';
import path from 'path';
import {
	fertigkeitenData,
	liturgienData,
	ritualeData,
	zaubermelodienData,
	elfenliederData,
	zauberData,
	segnungenData,
	zeremonienData,
	hexenfluecheData,
	waffenData,
	ruestungenData,
	pflanzenData,
	krankheitenData,
	elixiereData,
	sonderfertigkeitenData,
	gifteData,
	vorteileData,
	nachteileData,
	bestiariumData,
} from '../data/index.js';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction, character, client) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === path.basename(import.meta.url, '.js')) {
			const highestSimilarity = client.Utils.highestSimilarity;
			const embed = new EmbedBuilder().setColor('#0099ff');
			const ephemeral = true;
			const detailName = interaction.options.getString('detailname') ?? 0;
			const options = [
				...fertigkeitenData,
				...liturgienData,
				...ritualeData,
				...zaubermelodienData,
				...elfenliederData,
				...zauberData,
				...segnungenData,
				...zeremonienData,
				...hexenfluecheData,
				...waffenData,
				...ruestungenData,
				...pflanzenData,
				...krankheitenData,
				...elixiereData,
				...sonderfertigkeitenData,
				...gifteData,
				...vorteileData,
				...nachteileData,
				...bestiariumData];
			const detail = highestSimilarity(detailName, (d) => ({ name: d.name, aliases: [] }), options);
			if (!detail) {
				return await interaction.reply({ content: `Details zu ***${detailName}*** nicht gefunden`, ephemeral: ephemeral });
			}
			const source = detail.quelle.toLowerCase();
			if (source === 'vorteile') {
				embed.setTitle(detail.name).setDescription(detail.regel)
					.addFields(
						{ name: 'Vorraussetzung', value: detail.voraussetzungen.length <= 0 ? '-' : detail.voraussetzungen, inline: true },
						{ name: 'AP-Wert', value: detail.apWert.length <= 0 ? '-' : detail.apWert, inline: true },
					);
			}
			else if (source === 'nachteile') {
				embed.setTitle(detail.name).setDescription(detail.regel)
					.addFields(
						{ name: 'Vorraussetzung', value: detail.voraussetzungen.length <= 0 ? '-' : detail.voraussetzungen, inline: true },
						{ name: 'AP-Wert', value: detail.apWert.length <= 0 ? '-' : detail.apWert, inline: true },
					);
			}
			else if (source === 'sonderfertigkeiten') {
				embed.setTitle(detail.name).setDescription(detail.regel)
					.addFields(
						{ name: 'Vorraussetzung', value: detail.voraussetzungen.length <= 0 ? '-' : detail.voraussetzungen, inline: true },
						{ name: 'AP-Wert', value: detail.apWert.length <= 0 ? '-' : detail.apWert, inline: true },
						{ name: 'Gruppe', value: detail.gruppe, inline: true },
					);
			}
			else if (source === 'fertigkeiten') {
				embed.setTitle(`${detail.name} (${detail.art})`)
					.addFields(
						{ name: 'Probe', value: detail.eigenschaften.map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: true },
						{ name: 'Steigerung', value: detail.steigerung, inline: true },
						{ name: 'Anwendungsgebiet', value: detail.anwendungsgebiet, inline: true },
						{ name: 'Qualität', value: detail.qualitaet, inline: true },
						{ name: 'Misslungene Probe', value: detail.misslungeneProbe, inline: true },
						{ name: 'Kritischer Erfolg', value: detail.kritischerErfolg, inline: true },
						{ name: 'Patzer', value: detail.patzer, inline: true },
						{ name: 'Link', value: `[${detail.name}](https://ulisses-regelwiki.de/talent.html?talent=${encodeURIComponent(detail.name)})` },
						{ name: 'Publikationen', value: '\u200b' + (detail.publikationen ?? '-'), inline: true },
					);
			}
			else if (source === 'elfenlieder') {
				embed.setTitle(detail.name)
					.addFields(
						{ name: 'Wirkung', value: detail.wirkung.length <= 0 ? '-' : detail.wirkung, inline: true },
						{ name: 'Probe', value: detail.eigenschaften.map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: false },
						{ name: 'Talent', value: detail.talent, inline: false },
						{ name: 'Kosten', value: detail.kosten, inline: false },
						{ name: 'Steigerung', value: detail.steigerung, inline: true },
						{ name: 'Merkmal', value: detail.merkmal, inline: true },
						{ name: 'Alias', value: '\u200b' + detail.alias.join(' | '), inline: true },
						{ name: 'Link', value: `[${detail.name}](https://ulisses-regelwiki.de/elfenliedetail.html?elfenlied=${encodeURIComponent(detail.name)})` },
					);
			}
			else if (source === 'elixiere') {
				embed.setTitle(detail.name);
				detail.qualitaetsStufen.forEach(qs => {
					embed.addFields({ name: 'QS ' + qs.qs, value: '\u200b' + qs.text, inline: true });
				});
				embed.addFields(
					{ name: 'Kosten pro QS', value: detail.kostenProIngredienzstufe.length <= 0 ? '-' : detail.kostenProIngredienzstufe, inline: false },
					{ name: 'Alias', value: '\u200b' + detail.alias.join(' | '), inline: true },
				);
			}
			else if (source === 'gifte') {
				embed.setTitle(detail.name);
				embed.addFields(
					{ name: 'Wirkung', value: detail.wirkung.length <= 0 ? '-' : detail.wirkung, inline: true },
					{ name: 'Stufe', value: '\u200b' + detail.stufe, inline: true },
					{ name: 'Art', value: '\u200b' + detail.art, inline: true },
					{ name: 'Widerstand', value: '\u200b' + detail.widerstand, inline: true },
					{ name: 'Beginn', value: '\u200b' + detail.beginn, inline: true },
					{ name: 'Dauer', value: '\u200b' + detail.dauer, inline: true },
					{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: true },
					{ name: 'Gruppe', value: '\u200b' + detail.gruppe, inline: true },
				);
			}
			else if (source === 'hexenflueche') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Probe', value: '\u200b' + detail.probe.split('/').map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: false },
						{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: false },
						{ name: 'Wirkungsdauer', value: '\u200b' + detail.wirkungsdauer, inline: true },
						{ name: 'Merkmal', value: '\u200b' + detail.merkmal, inline: true },
						{ name: 'Alias', value: '\u200b' + detail.alias.join(' | '), inline: true },
					);
			}
			else if (source === 'krankheiten') {
				embed.setTitle(detail.name).setDescription(detail.verlauf.length <= 0 ? '-' : detail.verlauf)
					.addFields(
						{ name: 'Stufe', value: '\u200b' + detail.stufe, inline: false },
						{ name: 'Widerstand', value: '\u200b' + detail.widerstand, inline: false },
						{ name: 'Schaden', value: '\u200b' + detail.schaden, inline: true },
						{ name: 'Ursachen', value: '\u200b' + detail.ursachen, inline: true },
						{ name: 'Dauer', value: '\u200b' + detail.dauer, inline: true },
						{ name: 'Gegenmittel', value: '\u200b' + detail.gegenmittel, inline: true },
					);
			}
			else if (source === 'liturgien') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Probe', value: '\u200b' + detail.probe.split('/').map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: true },
						{ name: 'Dauer', value: '\u200b' + detail.dauer, inline: true },
						{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: true },
						{ name: 'Reichweite', value: '\u200b' + detail.reichweite, inline: true },
						{ name: 'Wirkungsdauer', value: '\u200b' + detail.wirkungsdauer, inline: true },
						{ name: 'Zielkategorie', value: '\u200b' + detail.zielkategorie, inline: true },
						{ name: 'Verbreitung', value: '\u200b' + detail.verbreitung, inline: true },
						{ name: 'Steigerung', value: '\u200b' + detail.steigerung, inline: true },
					);
			}
			else if (source === 'rituale') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Probe', value: '\u200b' + detail.probe.split('/').map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: true },
						{ name: 'Kategorie', value: '\u200b' + detail.kategorie, inline: true },
						{ name: 'Dauer', value: '\u200b' + detail.dauer, inline: true },
						{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: true },
						{ name: 'Reichweite', value: '\u200b' + detail.reichweite, inline: true },
						{ name: 'Wirkungsdauer', value: '\u200b' + detail.wirkungsdauer, inline: true },
						{ name: 'Zielkategorie', value: '\u200b' + detail.zielkategorie, inline: true },
						{ name: 'Verbreitung', value: '\u200b' + detail.verbreitung, inline: true },
						{ name: 'Merkmal', value: '\u200b' + detail.merkma, inline: true },
						{ name: 'Steigerung', value: '\u200b' + detail.steigerung, inline: true },
					);
			}
			else if (source === 'segnungen') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Reichweite', value: '\u200b' + detail.reichweite, inline: true },
						{ name: 'Wirkungsdauer', value: '\u200b' + detail.wirkungsdauer, inline: true },
						{ name: 'Zielkategorie', value: '\u200b' + detail.zielkategorie, inline: true },
						{ name: 'Aspekt', value: '\u200b' + detail.aspekt, inline: true },
					);
			}
			else if (source === 'zauber') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Probe', value: '\u200b' + detail.probe.split('/').map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: true },
						{ name: 'Zauberdauer', value: '\u200b' + detail.zauberdauer, inline: true },
						{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: true },
						{ name: 'Reichweite', value: '\u200b' + detail.reichweite, inline: true },
						{ name: 'Wirkungsdauer', value: '\u200b' + detail.wirkungsdauer, inline: true },
						{ name: 'Zielkategorie', value: '\u200b' + detail.zielkategorie, inline: true },
						{ name: 'Merkmal', value: '\u200b' + detail.merkmal, inline: true },
						{ name: 'Verbreitung', value: '\u200b' + detail.verbreitung, inline: true },
						{ name: 'Steigerung', value: '\u200b' + detail.steigerung, inline: true },
						{ name: 'Alias', value: '\u200b' + detail.alias.join(' | '), inline: true },
						{ name: 'Link', value: `[${detail.name}](https://ulisses-regelwiki.de/zauber.html?zauber=${encodeURIComponent(detail.name)})` },
					);
			}
			else if (source === 'zaubermelodien') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Probe', value: '\u200b' + detail.probe.split('/').map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: true },
						{ name: 'Zauberdauer', value: '\u200b' + detail.zauberdauer, inline: true },
						{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: true },
						{ name: 'Merkmal', value: '\u200b' + detail.merkmal, inline: true },
						{ name: 'Tradition', value: '\u200b' + detail.tradition, inline: true },
						{ name: 'Steigerung', value: '\u200b' + detail.steigerung, inline: true },
						{ name: 'Talent', value: '\u200b' + detail.talent, inline: true },
						{ name: 'Kategorie', value: '\u200b' + detail.kategorie, inline: true },
						{ name: 'Alias', value: '\u200b' + detail.alias.join(' | '), inline: true },
					);
			}
			else if (source === 'zeremonien') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Probe', value: '\u200b' + detail.probe.split('/').map(x => `***${x}*** (${character.eigenschaften[x]})`).join(' | '), inline: true },
						{ name: 'Dauer', value: '\u200b' + detail.dauer, inline: true },
						{ name: 'Kosten', value: '\u200b' + detail.kosten, inline: true },
						{ name: 'Reichweite', value: '\u200b' + detail.reichweite, inline: true },
						{ name: 'Wirkungsdauer', value: '\u200b' + detail.wirkungsdauer, inline: true },
						{ name: 'Zielkategorie', value: '\u200b' + detail.zielkategorie, inline: true },
						{ name: 'Verbreitung', value: '\u200b' + detail.verbreitung, inline: true },
						{ name: 'Steigerung', value: '\u200b' + detail.steigerung, inline: true },
						{ name: 'Alias', value: '\u200b' + detail.alias.join(' | '), inline: true },
					);
			}
			else if (source === 'waffen') {
				embed.setTitle(detail.name).setDescription(detail.technik)
					.addFields(
						{ name: 'TP', value: '\u200b' + detail.tp, inline: true },
						{ name: 'L+S', value: '\u200b' + detail['l+s'], inline: true },
						{ name: 'AT-Mod', value: '\u200b' + detail.at, inline: true },
						{ name: 'PA-Mod', value: '\u200b' + detail.pa, inline: true },
						{ name: 'Reichweite', value: '\u200b' + detail.rw, inline: true },
						{ name: 'Gewicht', value: '\u200b' + detail.gewicht, inline: true },
					);
				if (detail.hinweis) {
					embed.addFields({ name: 'Hinweis', value: detail.hinweis, inline: false });
				}
			}
			else if (source === 'rüstungen') {
				embed.setTitle(detail.name)
					.addFields(
						{ name: 'RS', value: '\u200b' + detail.rs, inline: true },
						{ name: 'BE', value: '\u200b' + detail.be, inline: true },
						{ name: 'Gewicht', value: '\u200b' + detail.gewicht, inline: true },
						{ name: 'Preis', value: '\u200b' + detail.preis, inline: true },
					);
				if (detail.abzuege?.length > 0) {
					detail.abzuege.forEach(abzug => {
						embed.addFields({ name: abzug.was, value: '\u200b' + abzug.wieviel, inline: false });
					});
				}
			}
			else if (source === 'pflanzen') {
				embed.setTitle(detail.name).setDescription(detail.wirkung.length <= 0 ? '-' : detail.wirkung)
					.addFields(
						{ name: 'Pflanzentyp', value: '\u200b' + (detail.pflanzentyp ?? '-'), inline: true },
						{ name: 'Verbreitung', value: '\u200b' + (detail.verbreitung ?? '-'), inline: true },
						{ name: 'Suchschwierigkeit', value: '\u200b' + (detail.suchschwierigkeit ?? '-'), inline: true },
						{ name: 'Bestimmungsschwierigkeit', value: '\u200b' + (detail.bestimmungsschwierigkeit ?? '-'), inline: true },
						{ name: 'Anwendungen', value: '\u200b' + (detail.anwendungen ?? '-'), inline: true },
						{ name: 'Preis', value: '\u200b' + (detail.preis ?? '-'), inline: true },
						{ name: 'Rezepte', value: '\u200b' + (detail.rezepte ?? '-'), inline: true },
						{ name: 'Haltbarkeit', value: '\u200b' + (detail.haltbarkeit ?? '-'), inline: true },
						{ name: 'Url', value: '\u200b' + detail.url, inline: true },
						{ name: 'Publikationen', value: '\u200b' + (detail.publikationen ?? '-'), inline: true },
					);
			}
			else if (source === 'bestiarium') {
				embed.setTitle(detail.name).setDescription(detail.kategorie);
				const bestiaryFields = [];
				detail.typus && bestiaryFields.push({ name: '__**Typus**__', value: '\u200b' + detail.typus, inline: false });
				bestiaryFields.push(client.Utils.createField(
					{
						fieldName: '🔢__**Eigenschaften**__',
						fieldValues: [
							{ key: '💢 MU', value: detail.eigenschaften['MU'] },
							{ key: '🧠 KL', value: detail.eigenschaften['KL'] },
							{ key: '👁️‍🗨️ IN', value: detail.eigenschaften['IN'] },
							{ key: '💋 CH', value: detail.eigenschaften['CH'] },
							{ key: '🖐 FF', value: detail.eigenschaften['FF'] },
							{ key: '🕺 GE', value: detail.eigenschaften['GE'] },
							{ key: '🫀 KO', value: detail.eigenschaften['KO'] },
							{ key: '💪 KK', value: detail.eigenschaften['KK'] },
						],
						isInline: true,
					},
				));

				bestiaryFields.push(client.Utils.createField(
					{
						fieldName: '🌡__**Werte**__',
						fieldValues: [
							{ key: '💉 LeP', value: `${detail.lep}` },
							detail.asp ? { key: '🔮 AsP', value: `${detail.asp}` } : null,
							{ key: '⚕ ZK', value: `${detail.zk}` },
							{ key: '🪬 SK', value: `${detail.sk ?? ''}` },
							{ key: '👟 GS', value: `${detail.gs}` },
							{ key: 'Initiative', value: '\u200b' + detail.initiative },
							{ key: 'RS/BE', value: '\u200b' + detail.rs + '/' + detail.be },
							{ key: 'Aktionen', value: '\u200b' + detail.aktionen },
							{ key: 'Größe', value: '\u200b' + detail.groesse },
						],
					},
				));
				detail.angriffe && bestiaryFields.push({ name: '__**Angriffe**__', value: '\u200b' });
				detail.angriffe && bestiaryFields.push(...detail.angriffe.map((a) => client.Utils.createField(
					{
						fieldName: `${a.name}`,
						fieldValues: [
							a.at ? { key: 'AT', value: `${a.at}` } : null,
							a.fk ? { key: 'FK', value: `${a.fk}` } : null,
							a.pa ? { key: 'PA', value: `${a.pa}` } : null,
							a.tp ? { key: 'TP', value: `${a.tp}` } : null,
							a.rw ? { key: 'RW', value: `${a.rw}` } : null,
						],
					},
				), true));
				detail.talente && bestiaryFields.push(client.Utils.createField(
					{
						fieldName: '💪 Talente',
						fieldValues: detail.talente.sort((a, b) => a.name.localeCompare(b.name)).map(talent => ({ key: talent.name, value: talent.fertigkeitswert })),
						isInline: true,
					},
				));
				detail.vorteileNachteile && bestiaryFields.push(client.Utils.createField(
					{
						fieldName: 'Vorteile / Nachteile',
						fieldValues: detail.vorteileNachteile.sort((a, b) => a.localeCompare(b)).map(vn => ({ key: vn, value: null })),
						isInline: true,
					},
				));
				detail.sonderfertigkeiten && bestiaryFields.push(client.Utils.createField(
					{
						fieldName: 'Sonderfertigkeiten',
						fieldVaues: detail.sonderfertigkeiten.sort((a, b) => a.localeCompare(b)).map(vn => ({ key: vn, value: null })),
						isInline: true,
					},
				));
				detail.beute && bestiaryFields.push(client.Utils.createField(
					{
						fieldName: 'Beute',
						fieldValues: detail.beute.sort((a, b) => a.localeCompare(b)).map(vn => ({ key: vn, value: null })),
						isInline: false,
					},
				));
				bestiaryFields.push({ name: 'Url', value: '\u200b' + detail.url, inline: true });
				bestiaryFields.push({ name: 'Publikationen', value: '\u200b' + (detail.publikation ?? '-'), inline: true });
				embed.addFields(bestiaryFields);
				// embed.setImage(`attachment://./assets/Armatrutz.jpg`)
			}
			// await interaction.reply({ embeds: [embed], fetchReply: true, ephemeral: ephemeral, files: [`./assets/Armatrutz.jpg`] });
			await interaction.reply({ embeds: [embed], fetchReply: true, ephemeral: ephemeral });
		}
	},
};