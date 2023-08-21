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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = exports.Context = exports.Dox = exports.Id = exports.DoxKind = void 0;
var DoxKind;
(function (DoxKind) {
    DoxKind[DoxKind["Unknown"] = 0] = "Unknown";
    DoxKind[DoxKind["Package"] = 1] = "Package";
    DoxKind[DoxKind["ExportDeclaration"] = 2] = "ExportDeclaration";
    DoxKind[DoxKind["ExportMember"] = 3] = "ExportMember";
})(DoxKind = exports.DoxKind || (exports.DoxKind = {}));
__exportStar(require("./doxKinds"), exports);
var Id_1 = require("./Id");
Object.defineProperty(exports, "Id", { enumerable: true, get: function () { return __importDefault(Id_1).default; } });
var Dox_1 = require("./Dox");
Object.defineProperty(exports, "Dox", { enumerable: true, get: function () { return __importDefault(Dox_1).default; } });
var Context_1 = require("./Context");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return __importDefault(Context_1).default; } });
var Package_1 = require("./Package");
Object.defineProperty(exports, "Package", { enumerable: true, get: function () { return __importDefault(Package_1).default; } });
//# sourceMappingURL=typeDox.js.map