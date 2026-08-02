const createField = (props) => {
	const {
		fieldName,
		fieldValues,
		isInline = true,
		valueFormatting = '`',
		keyFormatting = '__',
	} = props;
	return {
		name: `${keyFormatting}${fieldName}${keyFormatting}`,
		value: fieldValues.filter(kv => kv !== null).map(kv => `${kv.key}${kv.value ? ':' : ''} ${kv.value ? `${valueFormatting}${kv.value}${valueFormatting}` : ''}  
`).join(''), inline: isInline,
	};
};

const addSortedListField = (embed, list, fieldName, mapItem, isInline = true) => {
	if (!list?.length) return;
	embed.fields.push(createField({
		fieldName,
		fieldValues: list.sort((a, b) => a.name.localeCompare(b.name)).map(mapItem),
		isInline,
	}));
};

const createEmbedFromCalendar = (calendar) => {
	const embed = {
		color: 0x0099ff,
		title: '__**Kalender**__',
		fields: [],
	};

	for (const month of calendar ?? []) {
		embed.fields.push(createField({
			fieldName: `${(calendar ?? []).indexOf(month) + 1}. ${month.name}`,
			fieldValues: [
				{ key: 'irdisch', value: month.irdischeEntsprechung ?? '-' },
				{ key: 'Tage', value: month.tage ?? '-' },
			],
			isInline: true,
		}));
	}

	return [embed];
};

const createEmbedFromCharacter = (character) => {
	const embed = {
		color: 0x0099ff,
		title: `__**${character.displayName ?? character.name}**__`,
		...(character.wesenszug ? { description: `— *${character.wesenszug}*` } : {}),
		fields: [],
	};
	embed.fields.push(createField(
		{
			fieldName: '🔢 Eigenschaften',
			fieldValues: [
				{ key: '💢 MU', value: character.eigenschaften['MU'] },
				{ key: '🧠 KL', value: character.eigenschaften['KL'] },
				{ key: '👁️‍🗨️ IN', value: character.eigenschaften['IN'] },
				{ key: '💋 CH', value: character.eigenschaften['CH'] },
				{ key: '🖐 FF', value: character.eigenschaften['FF'] },
				{ key: '🕺 GE', value: character.eigenschaften['GE'] },
				{ key: '🫀 KO', value: character.eigenschaften['KO'] },
				{ key: '💪 KK', value: character.eigenschaften['KK'] },
			],
			isInline: true,
		}));
	embed.fields.push(createField(
		{
			fieldName: '🌡 Werte',
			fieldValues: [
				{ key: '💉 LeP', value: `${character.lep.aktuell} / ${character.lep.max}` },
				character.asp ? { key: '🔮 AsP', value: `${character.asp.aktuell} / ${character.asp.max}` } : null,
				{ key: '⚕ ZK', value: `${character.zk}` },
				{ key: '🪬 SK', value: `${character.sk ?? ''}` },
				{ key: '👟 GS', value: `${character.gs}` },
			],
		},
	));

	addSortedListField(embed, character.talente, '💪 Talente', talent => ({ key: talent.name, value: talent.fertigkeitswert }));
	addSortedListField(embed, character.kampftechniken, '🤺 Kampftechniken', kt => ({ key: kt.name, value: kt.ktw }));
	addSortedListField(embed, character.sonderfertigkeiten, '🕺 Sonderfertigkeiten', sf => ({ key: sf.name }));
	addSortedListField(embed, character.zauber, '🪄 Zauber', item => ({ key: item.name, value: item.fertigkeitswert }));
	addSortedListField(embed, character.elfenlieder, '🧝 Elfenlieder', item => ({ key: item.name, value: item.fertigkeitswert }));
	addSortedListField(embed, character.liturgien, '😇 Liturgien', item => ({ key: item.name, value: item.fertigkeitswert }));
	addSortedListField(embed, character.rituale, '🔯 Rituale', item => ({ key: item.name, value: item.fertigkeitswert }));
	addSortedListField(embed, character.nachteile, '🤢 Nachteile', item => ({ key: `${item.name}${item.category != undefined ? ` (${item.category})` : ''}` }));
	addSortedListField(embed, character.vorteile, '🤩 Vorteile', item => ({ key: `${item.name}${item.category != undefined ? ` (${item.category})` : ''}` }));

	if (character.waffen?.length > 0) {
		const { angelegteWaffen = [] } = character;
		embed.fields.push(createField(
			{
				fieldName: '🗡 Waffen',
				fieldValues: character.waffen.sort((a, b) => a.localeCompare(b)).map(item => ({ key: item, value: angelegteWaffen.includes(item) ? 'X' : null })),
				isInline: true,
			},
		));
	}
	if (character.ruestungen?.length > 0) {
		const { angelegteRuestung = '' } = character;
		embed.fields.push(createField(
			{
				fieldName: '🕴 Rüstungen',
				fieldValues: character.ruestungen.sort((a, b) => a.localeCompare(b)).map(item => ({ key: item, value: item === angelegteRuestung ? 'X' : null })),
				isInline: true,
			},
		));
	}
	return [embed];
};

export { createField, createEmbedFromCharacter, createEmbedFromCalendar };