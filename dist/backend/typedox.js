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
exports.Package = exports.Config = exports.Reference = exports.logLevels = exports.serialiser = exports.tree = exports.lib = exports.tsEntryRefs = exports.packages = exports.nodePackage = void 0;
const path = __importStar(require("path"));
exports.nodePackage = {
    name: 'typedox',
    version: 'v0.0.0',
    packageRoot: path.join(__dirname, '../../'),
};
exports.packages = [exports.nodePackage];
exports.tsEntryRefs = [
    'test/scenarios/namespace/tsconfig.json',
];
exports.lib = __importStar(require("./lib/_namespace"));
exports.tree = __importStar(require("./tree/_namespace"));
exports.serialiser = __importStar(require("./serialiser/_namespace"));
var _namespace_1 = require("./lib/_namespace");
Object.defineProperty(exports, "logLevels", { enumerable: true, get: function () { return _namespace_1.logLevels; } });
__exportStar(require("./kinds/_namespace"), exports);
var Reference_1 = require("./kinds/Reference");
Object.defineProperty(exports, "Reference", { enumerable: true, get: function () { return __importDefault(Reference_1).default; } });
var Config_1 = require("./Config");
Object.defineProperty(exports, "Config", { enumerable: true, get: function () { return __importDefault(Config_1).default; } });
var Package_1 = require("./kinds/Package");
Object.defineProperty(exports, "Package", { enumerable: true, get: function () { return __importDefault(Package_1).default; } });
//# sourceMappingURL=typedox.js.map