import { filePositions } from '@typedox/serialiser';
export declare const fetchDataFromFile: <T>(fileNamePath: string) => Promise<T>;
export declare function compressFilePositions(positions: filePositions): filePositions;
