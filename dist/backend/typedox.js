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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = exports.tsc = exports.config = exports.serialise = exports.TscWrapper = exports.DoxProject = exports.DoxConfig = exports.DeclarationGroup = exports.logger = void 0;
const Logger_1 = require("./logger/Logger");
exports.logger = new Logger_1.Logger();
/**
 * An enumerator for dox groups used to categorise `tsDeclarations`.
 */
var DeclarationGroup;
(function (DeclarationGroup) {
    DeclarationGroup[DeclarationGroup["unknown"] = 0] = "unknown";
    DeclarationGroup[DeclarationGroup["ExportStar"] = 1] = "ExportStar";
    DeclarationGroup[DeclarationGroup["Module"] = 2] = "Module";
    DeclarationGroup[DeclarationGroup["Variable"] = 3] = "Variable";
    DeclarationGroup[DeclarationGroup["Function"] = 4] = "Function";
    DeclarationGroup[DeclarationGroup["Class"] = 5] = "Class";
    DeclarationGroup[DeclarationGroup["Enum"] = 6] = "Enum";
})(DeclarationGroup || (exports.DeclarationGroup = DeclarationGroup = {}));
var _namespace_1 = require("./config/_namespace");
Object.defineProperty(exports, "DoxConfig", { enumerable: true, get: function () { return _namespace_1.DoxConfig; } });
var DoxProject_1 = require("./projectStructure/DoxProject");
Object.defineProperty(exports, "DoxProject", { enumerable: true, get: function () { return DoxProject_1.DoxProject; } });
var TsWrapper_1 = require("./tscApiWrapper/TsWrapper");
Object.defineProperty(exports, "TscWrapper", { enumerable: true, get: function () { return TsWrapper_1.TscWrapper; } });
__exportStar(require("./projectStructure/_namespace"), exports);
exports.serialise = __importStar(require("./serialiser/_namespace"));
exports.config = __importStar(require("./config/_namespace"));
exports.tsc = __importStar(require("./tscApiWrapper/_namespace"));
var foo;
(function (foo) {
    const bar = 'foo';
})(foo || (exports.foo = foo = {}));
//# sourceMappingURL=typedox.js.map