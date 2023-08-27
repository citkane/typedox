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
exports.WhatIsIt = exports.Id = exports.Context = exports.Logger = void 0;
var Logger_1 = require("./Logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return __importDefault(Logger_1).default; } });
var Context_1 = require("./Context");
Object.defineProperty(exports, "Context", { enumerable: true, get: function () { return __importDefault(Context_1).default; } });
var Id_1 = require("./Id");
Object.defineProperty(exports, "Id", { enumerable: true, get: function () { return __importDefault(Id_1).default; } });
var WhatIsIt_1 = require("./WhatIsIt");
Object.defineProperty(exports, "WhatIsIt", { enumerable: true, get: function () { return __importDefault(WhatIsIt_1).default; } });
__exportStar(require("./Dox"), exports);
//# sourceMappingURL=_namespace.js.map