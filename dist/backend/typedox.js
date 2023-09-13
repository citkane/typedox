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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = exports.DeclarationGroup = exports.TscWrapper = exports.TsReference = exports.TsDeclaration = exports.TsSourceFile = exports.Relation = exports.NpmPackage = exports.DoxProject = exports.Branch = exports.DoxConfig = exports.tsc = exports.config = exports.serialise = exports.logger = void 0;
const Logger_1 = require("./logger/Logger");
exports.logger = new Logger_1.Logger();
const _namespace_1 = require("./config/_namespace");
Object.defineProperty(exports, "DoxConfig", { enumerable: true, get: function () { return _namespace_1.DoxConfig; } });
const _namespace_2 = require("./projectStructure/_namespace");
Object.defineProperty(exports, "Branch", { enumerable: true, get: function () { return _namespace_2.Branch; } });
Object.defineProperty(exports, "DoxProject", { enumerable: true, get: function () { return _namespace_2.DoxProject; } });
Object.defineProperty(exports, "NpmPackage", { enumerable: true, get: function () { return _namespace_2.NpmPackage; } });
Object.defineProperty(exports, "Relation", { enumerable: true, get: function () { return _namespace_2.Relation; } });
Object.defineProperty(exports, "TsDeclaration", { enumerable: true, get: function () { return _namespace_2.TsDeclaration; } });
Object.defineProperty(exports, "TsReference", { enumerable: true, get: function () { return _namespace_2.TsReference; } });
Object.defineProperty(exports, "TsSourceFile", { enumerable: true, get: function () { return _namespace_2.TsSourceFile; } });
const _namespace_3 = require("./tscApiWrapper/_namespace");
Object.defineProperty(exports, "TscWrapper", { enumerable: true, get: function () { return _namespace_3.TscWrapper; } });
const serialise = __importStar(require("./serialiser/_namespace"));
exports.serialise = serialise;
const config = __importStar(require("./config/_namespace"));
exports.config = config;
const tsc = __importStar(require("./tscApiWrapper/_namespace"));
exports.tsc = tsc;
const _1 = __importDefault(require("."));
exports.default = _1.default;
/**
 * An enumerator for dox groups used to categorise `tsDeclarations`.
 */
var DeclarationGroup;
(function (DeclarationGroup) {
    DeclarationGroup[DeclarationGroup["unknown"] = 0] = "unknown";
    DeclarationGroup[DeclarationGroup["ExportStar"] = 1] = "ExportStar";
    DeclarationGroup[DeclarationGroup["ReExporter"] = 2] = "ReExporter";
    DeclarationGroup[DeclarationGroup["Module"] = 3] = "Module";
    DeclarationGroup[DeclarationGroup["Variable"] = 4] = "Variable";
    DeclarationGroup[DeclarationGroup["Function"] = 5] = "Function";
    DeclarationGroup[DeclarationGroup["Class"] = 6] = "Class";
    DeclarationGroup[DeclarationGroup["Enum"] = 7] = "Enum";
    DeclarationGroup[DeclarationGroup["Type"] = 8] = "Type";
    DeclarationGroup[DeclarationGroup["Default"] = 9] = "Default";
})(DeclarationGroup || (exports.DeclarationGroup = DeclarationGroup = {}));
__exportStar(require("./projectStructure/_namespace"), exports);
var foo;
(function (foo) {
    const bar = 'foo';
})(foo || (exports.foo = foo = {}));
//# sourceMappingURL=typedox.js.map