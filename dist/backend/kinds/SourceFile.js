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
const Dox_1 = require("../lib/Dox");
const dox = __importStar(require("../typedox"));
class SourceFile extends Dox_1.Dox {
    constructor(context, source) {
        var _a;
        super(context);
        this.relationshipTriggers = [];
        this.childFiles = [];
        this.declarationsMap = new Map();
        this.discoverDeclarations = () => {
            var _a;
            this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
            (_a = this.fileType.getProperties()) === null || _a === void 0 ? void 0 : _a.forEach((symbol) => {
                const declaration = new dox.Declaration(this.context, symbol);
                this.declarationsMap.set(declaration.name, declaration);
            });
        };
        this.discoverRelationships = () => {
            var _a;
            (_a = this.fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.forEach((exported) => this.mergeTriggers(exported));
        };
        this.mergeTriggers = (symbol) => {
            const triggers = new dox.relationships.RelationshipTriggers(this.context, symbol);
            this.relationshipTriggers = [
                ...this.relationshipTriggers,
                ...triggers.relationshipTriggers,
            ];
        };
        this.triggerRelationships = () => {
            this.relationshipTriggers.forEach((trigger) => trigger());
        };
        //Dox.class.bind(this);
        //this.context = { ...this.context, sourceFile: this };
        this.source = source;
        this.fileName = source.fileName;
        this.fileSymbol = this.checker.getSymbolAtLocation(source);
        (_a = this.fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.forEach((symbol) => {
            var _a;
            let get = this.getter(symbol);
            const localTarget = get.localTargetDeclaration;
            if (localTarget)
                get = this.getter(localTarget);
            if (!get.moduleSpecifier)
                return;
            const moduleSymbol = this.checker.getSymbolAtLocation(get.moduleSpecifier);
            const targetFile = (_a = moduleSymbol === null || moduleSymbol === void 0 ? void 0 : moduleSymbol.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile().fileName;
            if (targetFile && !this.childFiles.includes(targetFile))
                this.childFiles.push(targetFile);
        });
        /*
        this.fileSymbol.exports?.forEach((exported) => {
            this.mergeNewFiles(exported);
            this.mergeTriggers(exported);
        });
        */
    }
}
exports.default = SourceFile;
//# sourceMappingURL=SourceFile.js.map