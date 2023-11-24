import { DeclarationSerialised, filePositions } from '@typedox/serialiser';

export const fetchQueryFromFile = async (query: string) => {
	const fileName = 'assets/data/' + query + '.json';
	return fetchDataFromFile<DeclarationSerialised>(fileName);
};
export const fetchDataFromFile = async <T>(fileNamePath: string) => {
	fileNamePath = fileNamePath.replace(/.JSON$/i, '.json');
	const fileType = fileNamePath.endsWith('.json') ? 'json' : 'text';

	return fetchFile(fileNamePath, fileType) as Promise<T>;
};

const fetchFile = (
	filePath: string,
	type: 'json' | 'text',
): Promise<object | string> => {
	return new Promise((resolve, reject) => {
		return fetch(filePath)
			.then((stream) => {
				if (stream.ok) {
					resolve(stream[type]());
				} else {
					reject(new Error(`${stream.statusText}: ${filePath}`));
				}
			})
			.catch((err) => reject(err));
	});
};

export function compressFilePositions(positions: filePositions) {
	if (positions.length === 1) return positions;
	return positions.reduce((accumulator, position, i) => {
		if (i === 0) {
			accumulator.push([...position]);
			return accumulator;
		}
		const previousPosition = accumulator[accumulator.length - 1];
		const previousEnd = previousPosition[1];
		const start = position[0];
		if (start === previousEnd) {
			previousPosition[1] = position[1];
			previousPosition[3] = position[3];
		} else {
			accumulator.push([...position]);
		}
		return accumulator;
	}, [] as filePositions);
}
