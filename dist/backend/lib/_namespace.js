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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Relation = exports.DoxContext = exports.logLevels = exports.Logger = void 0;
var Logger_1 = require("./Logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return Logger_1.Logger; } });
Object.defineProperty(exports, "logLevels", { enumerable: true, get: function () { return Logger_1.logLevels; } });
var DoxContext_1 = require("./DoxContext");
Object.defineProperty(exports, "DoxContext", { enumerable: true, get: function () { return DoxContext_1.DoxContext; } });
var Relation_1 = require("./Relation");
Object.defineProperty(exports, "Relation", { enumerable: true, get: function () { return Relation_1.Relation; } });
__exportStar(require("./serialiser"), exports);
//# sourceMappingURL=_namespace.js.map