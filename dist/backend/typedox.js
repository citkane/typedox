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
exports.Kind = exports.Package = exports.log = exports.serialiser = exports.tree = exports.lib = void 0;
exports.lib = __importStar(require("./lib/_namespace"));
exports.tree = __importStar(require("./tree/_namespace"));
exports.serialiser = __importStar(require("./serialiser/_namespace"));
var _namespace_1 = require("./lib/_namespace");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return _namespace_1.log; } });
__exportStar(require("./kinds/_namespace"), exports);
var Package_1 = require("./kinds/Package");
Object.defineProperty(exports, "Package", { enumerable: true, get: function () { return __importDefault(Package_1).default; } });
var Kind;
(function (Kind) {
    Kind[Kind["Unknown"] = 0] = "Unknown";
    Kind[Kind["Package"] = 1] = "Package";
    Kind[Kind["SourceFile"] = 2] = "SourceFile";
    Kind[Kind["Declaration"] = 3] = "Declaration";
    Kind[Kind["NameSpaceExport"] = 4] = "NameSpaceExport";
    Kind[Kind["ExportSpecifier"] = 5] = "ExportSpecifier";
    Kind[Kind["ExportDeclaration"] = 6] = "ExportDeclaration";
    Kind[Kind["VariableDeclaration"] = 7] = "VariableDeclaration";
    Kind[Kind["ClassDeclaration"] = 8] = "ClassDeclaration";
})(Kind || (exports.Kind = Kind = {}));
//# sourceMappingURL=typedox.js.map