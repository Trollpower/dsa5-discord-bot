import { SlashCommandBuilder } from 'discord.js';
import path from 'path';

const KSF_CHOICES = [
	{ name: 'Wuchtschlag', value: 'wuchtschlag' },
	{ name: 'Finte', value: 'finte' },
	{ name: 'Sturmangriff', value: 'sturmangriff' },
	{ name: 'Todesstoß', value: 'todesstoß' },
	{ name: 'Vorstoß', value: 'vorstoß' },
	{ name: 'Entwaffnen', value: 'entwaffnen' },
	{ name: 'Zu Fall bringen', value: 'zufallbringen' },
];

const addFavoritSubcommand = (builder, num) => builder
	.setName(`favorit${num}`)
	.setDescription(`Favorit ${num} für die /quick-Buttonleiste festlegen (Probe, KSF oder Angriff)`)
	.addStringOption(option => option
		.setName('fertigkeit')
		.setDescription('Fertigkeit/Zauber/etc.')
		.setRequired(false)
		.setAutocomplete(true))
	.addStringOption(option => option
		.setName('ksf')
		.setDescription('Kampfsonderfertigkeit')
		.setRequired(false)
		.addChoices(...KSF_CHOICES))
	.addStringOption(option => option
		.setName('angriff')
		.setDescription('Angriff mit einer angelegten Waffe')
		.setRequired(false)
		.setAutocomplete(true))
	.addIntegerOption(option => option
		.setName('stufe')
		.setDescription('Stufe der KSF (nur für Wuchtschlag/Finte)')
		.setRequired(false)
		.addChoices({ name: 'Stufe 1', value: 1 }, { name: 'Stufe 2', value: 2 }, { name: 'Stufe 3', value: 3 }))
	.addStringOption(option => option
		.setName('name')
		.setDescription('Optionaler Anzeigename')
		.setRequired(false))
	.addStringOption(option => option
		.setName('basismanoever')
		.setDescription('Basismanöver kombinieren (nur Sturmangriff, Todesstoß, Vorstoß, Entwaffnen, Zu Fall bringen)')
		.setRequired(false)
		.setAutocomplete(true))
	.addIntegerOption(option => option
		.setName('bonus-malus')
		.setDescription('Fester Bonus (+) oder Malus (-)')
		.setRequired(false));

export default {
	data: new SlashCommandBuilder()
		.setName(path.basename(import.meta.url, '.js'))
		.setDescription('Charakter anzeigen und bearbeiten')
		.addSubcommand(subcommand =>
			subcommand
				.setName('info')
				.setDescription('Charakterinfo'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('export')
				.setDescription('Charakter als ausgefülltes PDF exportieren'))
		.addSubcommand(sub => addFavoritSubcommand(sub, 1))
		.addSubcommand(sub => addFavoritSubcommand(sub, 2))
		.addSubcommand(sub => addFavoritSubcommand(sub, 3))
		.addSubcommand(subcommand =>
			subcommand
				.setName('proben')
				.setDescription('Die letzten Proben des Charakters anzeigen (max. 50)'))
		.addSubcommandGroup(option => option.setName('rüstung').setDescription('Rüstung hinzufügen, anlegen oder ablegen')
			.addSubcommand(subcommand =>
				subcommand
					.setName('hinzufügen')
					.setDescription('Rüstung hinzufügen, bzw. ins Inventar schreiben.')
					.addStringOption(stringOption => stringOption.setName('rüstungsname')
						.setDescription('Der Name der Rüstung')
						.setRequired(true)
						.setName('ruestungname')
						.setAutocomplete(true)),
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('anlegen')
					.setDescription('Rüstung anlegen, a.k.a anziehen.'),
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('ablegen')
					.setDescription('Rüstung ablegen, a.k.a ausziehen.'),
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('entfernen')
					.setDescription('Rüstung aus dem Inventar entfernen.'),
			),
		)
		.addSubcommandGroup(option => option.setName('waffe').setDescription('Waffe hinzufügen, ziehen oder wegstecken')
			.addSubcommand(subcommand =>
				subcommand
					.setName('hinzufügen')
					.setDescription('Waffe hinzufügen, bzw. ins Inventar schreiben.')
					.addStringOption(stringOption => stringOption.setName('waffenname')
						.setDescription('Der Name der Waffe')
						.setRequired(true)
						.setName('waffenname')
						.setAutocomplete(true),
					),
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('ziehen')
					.setDescription('Waffe ziehen.'),
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('ablegen')
					.setDescription('Waffe wegstecken.'),
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('entfernen')
					.setDescription('Waffe aus dem Inventar entfernen.'),
			),
		),

};