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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dox = __importStar(require("../typedox"));
class SourceFile extends dox.lib.Dox {
    constructor(context, source) {
        var _b, _c;
        super(context);
        this.relationshipTriggers = [];
        this.childFiles = [];
        this.kind = dox.Kind.SourceFile;
        this.declarationsMap = new Map();
        this.triggerRelationships = () => {
            this.relationshipTriggers.forEach((trigger) => trigger());
        };
        this.registerDoxDeclarations = (symbol) => {
            const declaration = new dox.Declaration(this.context, symbol);
            this.declarationsMap.set(declaration.name, declaration);
        };
        this.mergeNewFiles = (symbol) => {
            const files = new dox.relationships.FileFinder(this.context, symbol);
            this.childFiles = [...this.childFiles, ...files.childFiles];
        };
        this.mergeTriggers = (symbol) => {
            const triggers = new dox.relationships.RelationshipTriggers(this.context, symbol);
            this.relationshipTriggers = [
                ...this.relationshipTriggers,
                ...triggers.relationshipTriggers,
            ];
        };
        this.context = Object.assign(Object.assign({}, this.context), { sourceFile: this });
        const { checker } = this.context;
        this.source = source;
        this.fileName = source.fileName;
        this.fileSymbol = checker.getSymbolAtLocation(source);
        if (!this.fileSymbol)
            return;
        this.fileType = checker.getTypeOfSymbol(this.fileSymbol);
        (_b = this.fileType.getProperties()) === null || _b === void 0 ? void 0 : _b.forEach(this.registerDoxDeclarations);
        (_c = this.fileSymbol.exports) === null || _c === void 0 ? void 0 : _c.forEach((exported) => {
            this.mergeNewFiles(exported);
            this.mergeTriggers(exported);
        });
    }
    static getFilenameFromType(type) {
        var _b, _c;
        return (_c = (_b = type.getSymbol()) === null || _b === void 0 ? void 0 : _b.valueDeclaration) === null || _c === void 0 ? void 0 : _c.getSourceFile().fileName;
    }
    static getLocalTargetSymbol(checker, declaration) {
        var _b;
        const declarations = (_b = checker
            .getExportSpecifierLocalTargetSymbol(declaration)) === null || _b === void 0 ? void 0 : _b.getDeclarations();
        return declarations && declarations.length > 1
            ? dox.log.warn('Expected only one declaration in a local target symbol')
            : declarations
                ? declarations[0]
                : undefined;
        /*
            .find((declaration) => {
                dox.log.kind(declaration);
                return [
                    ts.SyntaxKind.NamespaceExport,
                    ts.SyntaxKind.ModuleDeclaration,
                    ts.SyntaxKind.Declar,
                ].includes(declaration.kind);
            }) as
            | ts.NamespaceImport
            | ts.ModuleDeclaration
            | ts.ExportDeclaration
            | undefined;
            */
    }
}
_a = SourceFile;
SourceFile.getModuleSpecifier = (node) => {
    if ('moduleSpecifier' in node)
        return node.moduleSpecifier;
    if (!!node.parent)
        return _a.getModuleSpecifier(node.parent);
    return undefined;
};
exports.default = SourceFile;
//# sourceMappingURL=SourceFile.js.map