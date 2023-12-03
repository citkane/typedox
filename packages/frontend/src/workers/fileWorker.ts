type Pako = typeof import('pako');
importScripts('../../lib/pako/pako_inflate.min.js');
const inflate: Pako['ungzip'] = (self as any).pako.inflate;

onmessage = (e: { data: [filePath: string, type: 'json' | 'text'] }) => {
	const [filePath, type] = e.data;
	const gzPath = filePath + '.gz';
	fetch(gzPath)
		.then((stream) => {
			if (!stream.ok) {
				throw new Error(`${stream.statusText}: ${gzPath}`);
			}
			return stream.arrayBuffer();
		})
		.then((compressed) => {
			const data = inflate(compressed, { to: 'string' });
			return type === 'json' ? JSON.parse(data) : data;
		})
		.then((data) => postMessage({ filePath, data }))
		.catch((err: Error) => postMessage({ filePath, err }));
};
