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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.Dox = void 0;
const dox = __importStar(require("../typedox"));
const Logger_1 = __importDefault(require("./Logger"));
class Dox extends Logger_1.default {
    constructor(context) {
        var _a;
        super();
        this.getter = (item) => new dox.lib.WhatIsIt(this.checker, item);
        this.context = context;
        this.checker = context.checker;
        this.id = context.id.uid;
        this.package = context.package;
        this.reference = context.reference;
        this.sourceFile = context.sourceFile;
        this.fileName = (_a = context.sourceFile) === null || _a === void 0 ? void 0 : _a.fileName;
        this.exportDeclaration = context.exportDeclaration;
    }
}
exports.Dox = Dox;
exports.log = new Logger_1.default();
//# sourceMappingURL=Dox.js.map