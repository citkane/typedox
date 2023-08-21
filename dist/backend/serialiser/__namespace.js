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
exports.Branch = exports.Tree = exports.Serialiser = void 0;
var Serialiser_1 = require("./Serialiser");
Object.defineProperty(exports, "Serialiser", { enumerable: true, get: function () { return __importDefault(Serialiser_1).default; } });
var Tree_1 = require("./Tree");
Object.defineProperty(exports, "Tree", { enumerable: true, get: function () { return __importDefault(Tree_1).default; } });
var Branch_1 = require("./Branch");
Object.defineProperty(exports, "Branch", { enumerable: true, get: function () { return __importDefault(Branch_1).default; } });
__exportStar(require("./variable/__namespace"), exports);
//# sourceMappingURL=__namespace.js.map