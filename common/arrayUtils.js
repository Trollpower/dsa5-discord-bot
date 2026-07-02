export const mapAtIndices = (array, indices, mapFunction) => {
	return indices
		.filter(index => index >= 0 && index < array.length)
		.map(index => mapFunction(array[index], index));
};