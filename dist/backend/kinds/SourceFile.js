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
class SourceFile extends dox.lib.Dox {
    constructor(context, source) {
        var _a, _b;
        super(context);
        /**
         * An array of callback functions to be triggered after all linked
         * files of the package have been discovered.
         */
        this.relationshipTriggers = [];
        this.childFiles = [];
        this.kind = dox.Kind.SourceFile;
        this.declarationsMap = new Map();
        this.buildRelationships = () => {
            this.relationshipTriggers.forEach((trigger) => trigger());
        };
        const { checker } = this.context;
        context = Object.assign(Object.assign({}, this.context), { sourceFile: this });
        this.source = source;
        this.fileName = source.fileName;
        this.fileSymbol = checker.getSymbolAtLocation(source);
        this.fileType = checker.getTypeOfSymbol(this.fileSymbol);
        (_a = this.fileType.getProperties()) === null || _a === void 0 ? void 0 : _a.forEach((symbol) => {
            const keyName = symbol.getName();
            const declaration = new dox.Declaration(context, symbol);
            this.declarationsMap.set(keyName, declaration);
        });
        (_b = this.fileSymbol.exports) === null || _b === void 0 ? void 0 : _b.forEach((symbol) => {
            const triggers = new dox.lib.RelationshipTriggers(context, symbol);
            this.mergeNewTriggers(triggers.relationshipTriggers);
            this.mergeNewFiles(triggers.childFiles);
        });
    }
    mergeNewTriggers(relationshipTriggers) {
        this.relationshipTriggers = [
            ...this.relationshipTriggers,
            ...relationshipTriggers,
        ];
    }
    mergeNewFiles(childFiles) {
        this.childFiles = [...this.childFiles, ...childFiles];
    }
}
exports.default = SourceFile;
//# sourceMappingURL=SourceFile.js.map