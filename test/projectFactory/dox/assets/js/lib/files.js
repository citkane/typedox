var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const fetchDataFromFile = (fileNamePath) => __awaiter(void 0, void 0, void 0, function* () {
    fileNamePath = fileNamePath.replace(/.JSON$/i, '.json');
    const fileType = fileNamePath.endsWith('.json') ? 'json' : 'text';
    return fetchFile(fileNamePath, fileType);
});
const fetchFile = (filePath, type) => {
    return new Promise((resolve, reject) => {
        return fetch(filePath)
            .then((stream) => {
            if (stream.ok) {
                resolve(stream[type]());
            }
            else {
                reject(new Error(`${stream.statusText}: ${filePath}`));
            }
        })
            .catch((err) => reject(err));
    });
};
export function compressFilePositions(positions) {
    if (positions.length === 1)
        return positions;
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
        }
        else {
            accumulator.push([...position]);
        }
        return accumulator;
    }, []);
}
//# sourceMappingURL=files.js.map