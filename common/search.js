import stringSim from 'string-similarity';

const check = (sourceValue, targetValue) => {
	const indx = sourceValue.toLowerCase().indexOf(targetValue.toLowerCase()) >= 0;
	const prob = stringSim.compareTwoStrings(sourceValue.toLowerCase(), targetValue.toLowerCase()) >= 0.7;
	return indx || prob;
};

export const highestSimilarity = (inputString, comparePropertyAccessor, sourceArray) => {
	const normalizedInput = String(inputString ?? '').toLowerCase();
	if (!normalizedInput) return;

	const exactMatch = sourceArray.find(f => comparePropertyAccessor(f).name.toLowerCase() === normalizedInput);
	if (exactMatch) {
		return exactMatch;
	}

	const prefixMatch = sourceArray.find(f => comparePropertyAccessor(f).name.toLowerCase().startsWith(normalizedInput));
	if (prefixMatch) {
		return prefixMatch;
	}

	const aliasMatch = sourceArray.find(f => (comparePropertyAccessor(f).aliases ?? []).some(alias => alias.toLowerCase().startsWith(normalizedInput)));
	if (aliasMatch) {
		return aliasMatch;
	}

	return sourceArray.find(f => check(comparePropertyAccessor(f).name, normalizedInput));
};

export const highestSimilarities = (inputString, comparePropertyAccessor, sourceArray) => {
	return sourceArray.filter(f => check(comparePropertyAccessor(f).name, inputString.toLowerCase()));
};