import { Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import path from 'path';
import { getQS } from '../common/common.js';

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	customIds: ['gm:meister:'],
	async execute(interaction, _char, client) {
		// Button handler: toggle temporary meister
		if (interaction.isButton() && interaction.customId.startsWith('gm:meister:')) {
			if (!interaction.isMeister()) {
				await interaction.reply({ content: 'Du bist nicht der Meister.', flags: MessageFlags.Ephemeral });
				return;
			}
			const userId = interaction.customId.slice('gm:meister:'.length);
			const member = await interaction.guild.members.fetch(userId).catch(() => null);
			if (!member) {
				await interaction.reply({ content: 'Benutzer nicht gefunden.', flags: MessageFlags.Ephemeral });
				return;
			}
			const wasMeister = client.temporaryMeisters.has(userId);
			if (wasMeister) {
				client.temporaryMeisters.delete(userId);
			}
			else {
				client.temporaryMeisters.add(userId);
			}

			// Rebuild all buttons with updated state
			let members;
			try {
				members = await interaction.guild.members.fetch();
			}
			catch {
				members = interaction.guild.members.cache;
			}
			const rows = [];
			let currentRow = new ActionRowBuilder();
			let count = 0;
			for (const [, m] of members) {
				if (m.user.bot) continue;
				const isTempMeister = client.temporaryMeisters.has(m.id);
				const btn = new ButtonBuilder()
					.setCustomId(`gm:meister:${m.id}`)
					.setLabel(m.displayName)
					.setStyle(isTempMeister ? ButtonStyle.Danger : ButtonStyle.Success);
				currentRow.addComponents(btn);
				count++;
				if (count % 5 === 0) {
					rows.push(currentRow);
					currentRow = new ActionRowBuilder();
				}
			}
			if (currentRow.components.length > 0) rows.push(currentRow);

			const action = wasMeister ? 'entfernt' : 'hinzugefügt';
			await interaction.update({ content: `**${member.displayName}** als temporärer Meister ${action}. Temporäre Meister verwalten (grün = hinzufügen, rot = entfernen):`, components: rows.slice(0, 5) });
			return;
		}

		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName !== path.basename(import.meta.url, '.js')) return;

		if (!interaction.isMeister()) {
			await interaction.reply({ content: 'Du bist nicht der Meister.', flags: MessageFlags.Ephemeral });
			return;
		}

		const group = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();

		if (group === 'events') {
			if (subcommand === 'count') {
				const charakter = interaction.options.getString('charakter') ?? null;
				const count = client.eventHistoryProvider?.countEvents(charakter) ?? 0;
				const suffix = charakter ? ` für **${charakter}**` : '';
				await interaction.reply({ content: `NDJSON-Log enthält **${count}** Events${suffix}.`, flags: MessageFlags.Ephemeral });
				return;
			}

			if (subcommand === 'trim') {
				const keepLast = interaction.options.getInteger('anzahl');
				const { before, after } = client.eventHistoryProvider?.trimEvents(keepLast) ?? { before: 0, after: 0 };
				const removed = before - after;
				if (removed === 0) {
					await interaction.reply({ content: `Log hat nur **${before}** Events – nichts wurde entfernt.`, flags: MessageFlags.Ephemeral });
				}
				else if (after === 0) {
					await interaction.reply({ content: `Alle **${removed}** Events entfernt. Log ist jetzt leer.`, flags: MessageFlags.Ephemeral });
				}
				else {
					await interaction.reply({ content: `**${removed}** Events entfernt. Log enthält jetzt noch **${after}** Events.`, flags: MessageFlags.Ephemeral });
				}
				return;
			}

			if (subcommand === 'list') {
				const charakter = interaction.options.getString('charakter') ?? null;
				const entries = client.eventHistoryProvider?.listEvents(charakter) ?? [];
				if (entries.length === 0) {
					const suffix = charakter ? ` für **${charakter}**` : '';
					await interaction.reply({ content: `Keine Events${suffix} gefunden.`, flags: MessageFlags.Ephemeral });
					return;
				}
				const header = charakter ? `Events für **${charakter}**:\n` : 'Alle Events:\n';
				const lines = entries.map(e => `**${e.name}**: ${e.count}`);
				const body = lines.join('\n');
				const full = header + body;
				if (full.length <= 2000) {
					await interaction.reply({ content: full, flags: MessageFlags.Ephemeral });
				}
				else {
					// Split into chunks of max 2000 chars
					await interaction.reply({ content: header + lines.slice(0, 50).join('\n'), flags: MessageFlags.Ephemeral });
					for (let i = 50; i < lines.length; i += 50) {
						await interaction.followUp({ content: lines.slice(i, i + 50).join('\n'), flags: MessageFlags.Ephemeral });
					}
				}
				return;
			}
		}

		if (group === 'char') {
			if (subcommand === 'proben') {
				const charakterName = interaction.options.getString('charactername') ?? null;
				const history = client.eventHistoryProvider?.readProbeHistory({
					characterName: charakterName,
					count: 50,
				}) ?? [];
				if (history.length === 0) {
					const suffix = charakterName ? ` für **${charakterName}**` : '';
					await interaction.reply({ content: `Keine Proben${suffix} gefunden.`, flags: MessageFlags.Ephemeral });
					return;
				}
				const showChar = !charakterName;
				const lines = history.map(entry => {
					const icon = entry.kritischBestanden ? '⭐' : entry.kritischFehlschlag ? '💩' : entry.bestanden ? '✅' : '❌';
					const bm = entry.bonusMalus !== 0 ? ` \`${entry.bonusMalus > 0 ? '+' : ''}${entry.bonusMalus}\`` : '';
					const qs = entry.bestanden && entry.fw != null
						? ` · QS **${getQS(entry.fw)}** (FP ${entry.fw})`
						: entry.fw != null ? ` · FP ${entry.fw}` : '';
					const date = entry.ts ? new Date(entry.ts).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) : '';
					const charPrefix = showChar && entry.characterName ? `[${entry.characterName}] ` : '';
					return `${charPrefix}${icon} **${entry.name}**${bm}${qs} · *${date}*`;
				});
				const title = charakterName
					? `Proben von ${charakterName} (letzte ${history.length})`
					: `Letzte ${history.length} Proben (alle Charaktere)`;
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
				return;
			}

			const charakterName = interaction.options.getString('charactername');
			const character = client.characters.find(
				c => c.name.toLowerCase() === charakterName.toLowerCase()
					|| (c.displayName ?? '').toLowerCase() === charakterName.toLowerCase(),
			);
			if (!character) {
				await interaction.reply({ content: `Charakter **${charakterName}** nicht gefunden.`, flags: MessageFlags.Ephemeral });
				return;
			}

			if (subcommand === 'cheating-get') {
				const cheating = character.cheating ?? {};
				const lines = [];
				if (cheating.general !== undefined) lines.push(`**general**: ${cheating.general}%`);
				if (cheating.crit !== undefined) lines.push(`**crit**: ${cheating.crit}%`);
				const content = lines.length > 0
					? `Cheating-Werte für **${character.displayName ?? character.name}**:\n${lines.join('\n')}`
					: `**${character.displayName ?? character.name}** hat keine gesetzten Cheating-Werte.`;
				await interaction.reply({ content, flags: MessageFlags.Ephemeral });
				return;
			}

			if (subcommand === 'cheating-set') {
				const wert = interaction.options.getInteger('wert');
				character.cheating = { ...(character.cheating ?? {}), general: wert };
				await client.Persistence.persistCharacter(character);
				await interaction.reply({
					content: `**${character.displayName ?? character.name}**: cheating.general auf **${wert}%** gesetzt.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			if (subcommand === 'cheating-set-crit') {
				const wert = interaction.options.getInteger('wert');
				character.cheating = { ...(character.cheating ?? {}), crit: wert };
				await client.Persistence.persistCharacter(character);
				await interaction.reply({
					content: `**${character.displayName ?? character.name}**: cheating.crit auf **${wert}%** gesetzt.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}

		if (group === 'user') {
			if (subcommand === 'meister') {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				let members;
				try {
					members = await interaction.guild.members.fetch();
				}
				catch {
					members = interaction.guild.members.cache;
				}
				const rows = [];
				let currentRow = new ActionRowBuilder();
				let count = 0;
				for (const [, member] of members) {
					if (member.user.bot) continue;
					const isTempMeister = client.temporaryMeisters.has(member.id);
					const btn = new ButtonBuilder()
						.setCustomId(`gm:meister:${member.id}`)
						.setLabel(member.displayName)
						.setStyle(isTempMeister ? ButtonStyle.Danger : ButtonStyle.Success);
					currentRow.addComponents(btn);
					count++;
					if (count % 5 === 0) {
						rows.push(currentRow);
						currentRow = new ActionRowBuilder();
					}
				}
				if (currentRow.components.length > 0) rows.push(currentRow);
				if (rows.length === 0) {
					await interaction.editReply({ content: 'Keine Benutzer gefunden.' });
					return;
				}
				await interaction.editReply({ content: 'Temporäre Meister verwalten (grün = hinzufügen, rot = entfernen):', components: rows.slice(0, 5) });
				return;
			}

			if (subcommand === 'pc') {
				const user = interaction.options.getUser('benutzer');
				const pcName = interaction.options.getString('charactername');
				const char = client.characters.find(c => c.name.toLowerCase() === pcName.toLowerCase());
				if (!char) {
					await interaction.reply({ content: `Charakter '${pcName}' wurde nicht gefunden.`, flags: MessageFlags.Ephemeral });
					return;
				}
				client.characterConfig.alias[user.username] = char.name;
				client.activeCharactersByUser.set(user.id, char.name);
				await interaction.reply({
					content: `${user.username} ist nun der Spieler von **${char.displayName ?? char.name}**.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}
	},
};
