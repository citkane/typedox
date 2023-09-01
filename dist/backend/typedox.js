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
exports.TscWrapper = exports.config = exports.lib = exports.DeclarationKind = exports.tsEntryRefsStub = exports.npmPackagesStub = exports.doxOptionsStub = exports.npmPackageStub = void 0;
const path = __importStar(require("path"));
exports.npmPackageStub = {
    name: 'typedox',
    version: 'v0.0.0',
    packageRootDir: path.join(__dirname, '../../'),
};
exports.doxOptionsStub = { tsOverrides: { options: { types: [] } } };
exports.npmPackagesStub = [exports.npmPackageStub];
exports.tsEntryRefsStub = [
    'test/scenarios/testNamespaces/tsconfig.json',
];
var DeclarationKind;
(function (DeclarationKind) {
    DeclarationKind[DeclarationKind["unknown"] = 0] = "unknown";
    DeclarationKind[DeclarationKind["ExportStar"] = 1] = "ExportStar";
    DeclarationKind[DeclarationKind["Module"] = 2] = "Module";
    DeclarationKind[DeclarationKind["Variable"] = 3] = "Variable";
    DeclarationKind[DeclarationKind["Function"] = 4] = "Function";
    DeclarationKind[DeclarationKind["Class"] = 5] = "Class";
    DeclarationKind[DeclarationKind["Enum"] = 6] = "Enum";
})(DeclarationKind || (exports.DeclarationKind = DeclarationKind = {}));
exports.lib = __importStar(require("./lib/_namespace"));
exports.config = __importStar(require("./config/_namespace"));
var TsWrapper_1 = require("./tscApi/TsWrapper");
Object.defineProperty(exports, "TscWrapper", { enumerable: true, get: function () { return TsWrapper_1.TscWrapper; } });
__exportStar(require("./projectStructure/_namespace"), exports);
//# sourceMappingURL=typedox.js.map