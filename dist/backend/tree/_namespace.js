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
exports.treeRoot = exports.Branch = exports.treeReference = exports.treePackage = void 0;
var treePackage_1 = require("./treePackage");
Object.defineProperty(exports, "treePackage", { enumerable: true, get: function () { return __importDefault(treePackage_1).default; } });
var treeReference_1 = require("./treeReference");
Object.defineProperty(exports, "treeReference", { enumerable: true, get: function () { return __importDefault(treeReference_1).default; } });
var Branch_1 = require("./Branch");
Object.defineProperty(exports, "Branch", { enumerable: true, get: function () { return __importDefault(Branch_1).default; } });
var treeRoot_1 = require("./treeRoot");
Object.defineProperty(exports, "treeRoot", { enumerable: true, get: function () { return __importDefault(treeRoot_1).default; } });
__exportStar(require("./partitioner"), exports);
//# sourceMappingURL=_namespace.js.map