"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootEnum = exports.rootArrowFunction = exports.rootFunction = exports.rootConst = exports.rootClass = exports.children = exports.grandchildren = void 0;
exports.grandchildren = __importStar(require("./grandchildren"));
exports.children = __importStar(require("./children"));
__exportStar(require("./grandchildren"), exports);
__exportStar(require("./children"), exports);
class rootClass {
}
exports.rootClass = rootClass;
exports.rootConst = 'rootConst';
function rootFunction() { }
exports.rootFunction = rootFunction;
const rootArrowFunction = () => { };
exports.rootArrowFunction = rootArrowFunction;
var rootEnum;
(function (rootEnum) {
})(rootEnum || (exports.rootEnum = rootEnum = {}));
/*
export * as namespaceExport from './grandchildren';
import * as exportSpecifier from './children';
export { exportSpecifier };

declare namespace localExportSpecifier {
    const farts = 'clean';
    export const one = 1;
    export { farts };
}
export { localExportSpecifier };

const larry = 'larry';
const marta = 'marta';
export { larry as otherLarry, marta };

import importClause from './children';
export { importClause as isExported };

export { default as DefaultClass } from './grandchildren/classes';
*/
//# sourceMappingURL=index.js.map