const getChar = (interaction, client) => {
	if (!interaction.user?.username) return;
	const activeCharacterName = interaction.user?.id
		? client.activeCharactersByUser?.get(interaction.user.id)
		: null;
	const charName = activeCharacterName ?? client.characterConfig.alias[interaction.user.username];
	if (!charName) return;
	const char = client.characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
	return char;
};

export { getChar };