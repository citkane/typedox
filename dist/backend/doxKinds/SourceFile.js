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
Object.defineProperty(exports, "__esModule", { value: true });
const dox = __importStar(require("../typedox"));
class SourceFile extends dox.Dox {
    constructor(context, source) {
        super(context);
        this.relationshipTriggers = [];
        this.declarationsMap = new Map();
        dox.log.info(`-----------------------------------------${source.fileName}`);
        const { checker } = this.context;
        context = Object.assign(Object.assign({}, this.context), { sourceFile: this });
        this.fileName = source.fileName;
        this.fileSymbol = checker.getSymbolAtLocation(source);
        this.fileType = checker.getTypeOfSymbol(this.fileSymbol);
        this.registerDeclarations(context);
        this.package.registerSourceFile(this.fileName, this);
        this.parseExports(this.fileSymbol, context);
    }
    buildRelationships() {
        this.relationshipTriggers.forEach((trigger) => trigger());
    }
    registerDeclarations(context) {
        this.fileType.getProperties().forEach((declarationSymbol) => {
            const declaration = new dox.Declaration(context, declarationSymbol);
            this.declarationsMap.set(declarationSymbol.getName(), declaration);
        });
    }
    parseExports(sourceSymbol, context) {
        const exports = sourceSymbol.exports;
        exports === null || exports === void 0 ? void 0 : exports.forEach((symbol) => {
            new dox.ExportDeclarations(context, symbol, this.relationshipTriggers);
        });
    }
}
exports.default = SourceFile;
//# sourceMappingURL=SourceFile.js.map