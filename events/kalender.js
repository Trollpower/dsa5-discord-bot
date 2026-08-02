import { EmbedBuilder, Events, MessageFlags } from 'discord.js';
import path from 'path';
import { createEmbedFromCalendar, createEmbedFromWeekdays } from '../common/embeds.js';
import kalender from '../data/kalender.json' with { type: 'json' };

const monthIndexByName = new Map(kalender.monate.map((month, index) => [month.name, index]));
const yearLength = kalender.monate.reduce((sum, month) => sum + (month.tage ?? 0), 0);

const getMonthByName = (monthName) => kalender.monate[monthIndexByName.get(monthName)];

const getOrdinal = (day, monthName) => {
	const monthIndex = monthIndexByName.get(monthName);
	if (monthIndex === undefined) return null;

	const month = kalender.monate[monthIndex];
	if (!month?.tage || day < 1 || day > month.tage) return null;

	const daysBeforeMonth = kalender.monate
		.slice(0, monthIndex)
		.reduce((sum, currentMonth) => sum + (currentMonth.tage ?? 0), 0);

	return daysBeforeMonth + day;
};

const calculateInclusiveDays = ({ startDay, startMonth, endDay, endMonth }) => {
	const startOrdinal = getOrdinal(startDay, startMonth);
	const endOrdinal = getOrdinal(endDay, endMonth);

	if (startOrdinal === null || endOrdinal === null) {
		return null;
	}

	if (endOrdinal >= startOrdinal) {
		return endOrdinal - startOrdinal + 1;
	}

	return (yearLength - startOrdinal + 1) + endOrdinal;
};

const createCalendarCalculationEmbed = ({ startDay, startMonth, endDay, endMonth, days }) => {
	const embed = new EmbedBuilder()
		.setColor('#0099ff')
		.setTitle('Kalenderberechnung')
		.addFields(
			{ name: 'Start', value: `${startDay}. ${startMonth}`, inline: true },
			{ name: 'Ende', value: `${endDay}. ${endMonth}`, inline: true },
			{ name: 'Tage inkl. Start und Ende', value: `${days}`, inline: false },
		);

	return embed;
};

export default {
	type: Events.InteractionCreate,
	name: path.basename(import.meta.url, '.js'),
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName !== path.basename(import.meta.url, '.js')) return;

		const subcommand = interaction.options.getSubcommand();
		if (subcommand === 'monate') {
			await interaction.reply({ embeds: createEmbedFromCalendar(kalender) });
			return;
		}

		if (subcommand === 'woche') {
			await interaction.reply({ embeds: createEmbedFromWeekdays(kalender) });
			return;
		}

		if (subcommand !== 'calc') return;

		const startDay = interaction.options.getInteger('starttag', true);
		const startMonth = interaction.options.getString('startmonat', true);
		const endDay = interaction.options.getInteger('endtag', true);
		const endMonth = interaction.options.getString('endmonat', true);

		const startMonthEntry = getMonthByName(startMonth);
		const endMonthEntry = getMonthByName(endMonth);

		if (!startMonthEntry || !endMonthEntry) {
			await interaction.reply({ content: 'Ungültiger Monat angegeben.', flags: MessageFlags.Ephemeral });
			return;
		}

		if (startDay > startMonthEntry.tage || endDay > endMonthEntry.tage) {
			await interaction.reply({
				content: `Ungültiger Tag für den gewählten Monat. ${startMonthEntry.name} hat ${startMonthEntry.tage} Tage, ${endMonthEntry.name} hat ${endMonthEntry.tage} Tage.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const days = calculateInclusiveDays({ startDay, startMonth, endDay, endMonth });
		if (days === null) {
			await interaction.reply({ content: 'Die Kalenderdaten konnten nicht berechnet werden.', flags: MessageFlags.Ephemeral });
			return;
		}

		await interaction.reply({
			embeds: [createCalendarCalculationEmbed({ startDay, startMonth, endDay, endMonth, days })],
			flags: MessageFlags.Ephemeral,
		});
	},
};