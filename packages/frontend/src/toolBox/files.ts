export const fetchDataFromFile = async <T>(fileNamePath: string) => {
	fileNamePath = fileNamePath.replace(/.JSON$/i, '.json');
	fileNamePath = fileNamePath.endsWith('.json')
		? fileNamePath
		: `${fileNamePath}.json`;

	return fetchFile(fileNamePath, 'json') as Promise<T>;
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
