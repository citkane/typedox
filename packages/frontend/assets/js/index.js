var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchDataFromFile } from './utils/_index.js';
import { DoxApp } from './index.js';
export * from './components/_index.js';
const doxApp = (function () {
    return __awaiter(this, void 0, void 0, function* () {
        const promises = [
            fetchDataFromFile('assets/_mainMenu.json'),
            fetchDataFromFile('assets/_categoryKind.json'),
            fetchDataFromFile('assets/_syntaxKind.json'),
        ];
        const [mainMenu, CategoryKind, SyntaxKind] = (yield Promise.all(promises));
        document.dox = {
            mainMenu,
            categoryKind: CategoryKind,
            SyntaxKind,
        };
        const doxApp = new DoxApp();
        document.body.appendChild(doxApp);
    });
})();
export default doxApp;
//# sourceMappingURL=index.js.map