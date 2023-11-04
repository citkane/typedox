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
    fileNamePath = fileNamePath.endsWith('.json')
        ? fileNamePath
        : `${fileNamePath}.json`;
    try {
        const data = yield fetchFile(fileNamePath, 'json');
        return data;
    }
    catch (error) {
        console.error(error);
    }
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
//# sourceMappingURL=fileUtils.js.map