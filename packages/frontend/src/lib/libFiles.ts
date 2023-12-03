import { DeclarationSerialised, filePositions } from '@typedox/serialiser';

type fileWorkerMessage = {
	data: { filePath: string; err: Error; data: unknown };
};
type resolve = (value: any | PromiseLike<any>) => void;
type reject = (reason?: any) => void;
interface resolver {
	resolve: resolve;
	reject: reject;
}

const fileCache = new Map<string, unknown>();
const fileQueue = new Map<string, resolver[]>();
const fileWorker = new Worker('assets/js/workers/fileWorker.js');

fileWorker.onmessage = (message: fileWorkerMessage) => {
	const { filePath, err, data } = message.data;
	if (!fileQueue.has(filePath)) return;

	fileCache.set(filePath, deepFreeze(data));
	fileQueue.get(filePath)!.forEach((resolver) => {
		if (err) return resolver.reject(err);
		resolver.resolve(fileCache.get(filePath));
	});
};
fileWorker.onerror = (err) => console.error(err);
fileWorker.onmessageerror = (err) => console.error(err);

export function fetchQueryFromFile(query: string) {
	return fetchDataFromFile<Record<string, DeclarationSerialised>>(
		getQueryFileName(query),
	).then((data) => data[getQueryDeclarationKey(query)]);
}
export function fetchDataFromFile<T>(fileName: string): Promise<T> {
	return new Promise((resolve, reject) =>
		((filePath, fileType) => {
			fileCache.has(filePath)
				? resolve(fileCache.get(filePath) as T)
				: queue(resolve, reject, filePath, fileType, fileQueue);
		})(getFilePath(fileName), getFileType(fileName)),
	);
}
export function compressFilePositions(positions: filePositions) {
	if (positions.length === 1) return positions;
	return positions.reduce((accumulator, position, i) => {
		if (i === 0) {
			accumulator.push([...position]);
			return accumulator;
		}
		((previousPosition, previousEnd, start) => {
			start === previousEnd
				? (previousPosition[1] = position[1]) &&
				  (previousPosition[3] = position[3])
				: accumulator.push([...position]);
		})(
			accumulator[accumulator.length - 1],
			accumulator[accumulator.length - 1][1],
			position[0],
		);
		return accumulator;
	}, [] as filePositions);
}
export function deepFreeze(item: any, seen = new Set<object>()) {
	if (typeof item !== 'object' || seen.has(item)) return item;
	seen.add(item);
	Object.freeze(item);
	Array.isArray(item)
		? item.forEach((child) => deepFreeze(child, seen))
		: Object.values(item).forEach((value) => deepFreeze(value, seen));

	return item;
}
function getQueryFileName(query: string) {
	return ((queryKeys) =>
		((packageKey) =>
			`assets/data/${packageKey}/${queryKeys
				.slice(0, -1)
				.join('.')}.json`)(queryKeys.shift()!))(getQueryKeys(query));
}
function getQueryDeclarationKey(query: string) {
	return getQueryKeys(query).pop()!;
}
function getQueryKeys(query: string) {
	return query.split('.');
}
function getFilePath(fileName: string) {
	const { origin, pathname } = window.location;
	return `${origin}${pathname}${fileName.replace(/.JSON$/i, '.json')}`;
}
function getFileType(fileName: string) {
	return fileName.endsWith('.json') ? 'json' : 'text';
}
function queue(
	resolve: resolve,
	reject: reject,
	filePath: string,
	fileType: string,
	fileQueue: Map<string, resolver[]>,
) {
	fileQueue.has(filePath)
		? fileQueue.get(filePath)?.push({ resolve, reject })
		: fileQueue.set(filePath, [{ resolve, reject }]) &&
		  fileWorker.postMessage([filePath, fileType]);
}
