var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { files } from '../index.js';
export let CategoryKind = {};
export let SyntaxKind = {};
export function initEnums() {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [
            files.fetchDataFromFile('assets/_categoryKind.json'),
            files.fetchDataFromFile('assets/_syntaxKind.json'),
        ];
        const [categoryKindData, syntaxKindData] = yield Promise.all(promises);
        rebuildEnum(CategoryKind, categoryKindData);
        rebuildEnum(SyntaxKind, syntaxKindData);
    });
}
function rebuildEnum(target, data) {
    Object.keys(data).forEach((key) => {
        const index = parseInt(key);
        if (!index)
            return;
        const name = data[index];
        target[(data[name] = index)] = name;
        target[name] = index;
    });
}
//# sourceMappingURL=factoryEnums.js.map