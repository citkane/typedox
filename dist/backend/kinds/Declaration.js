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
const ts = __importStar(require("typescript"));
class Declaration extends Dox_1.Dox {
    constructor(context, item) {
        super(context);
        this.parents = [];
        this.children = new Map();
        this.parseNamespaceExport = () => {
            this.nameSpace = this.name;
        };
        this.parseNamespaceImport = () => {
            this.nameSpace = this.name;
        };
        Dox_1.Dox.classString.bind(this);
        this.get = this.tsWrap(item);
        this.name = this.get.name;
        this.tsKind = this.get.kind;
        this.tsNode = this.get.tsNode;
        this.tsSymbol = this.get.tsSymbol;
        this.tsType = this.get.tsType;
        if (!this.get.isExportStarChild &&
            !Declaration.isSpecifierKind(this.tsKind))
            return;
        this.debug(this.classIdentifier, this.get.nodeDeclarationText);
        this.parser(this.get.tsNode);
    }
    get parent() {
        return this.sourceFile;
    }
    get kind() {
        const { SyntaxKind } = ts;
        const { DeclarationKind } = dox;
        if (this.get.isExportStarChild)
            return DeclarationKind.ExportStar;
        const tsKind = Declaration.resolveTsKind(this);
        const isModule = tsKind === SyntaxKind.ModuleDeclaration ||
            tsKind === SyntaxKind.NamespaceExport;
        const kind = tsKind === SyntaxKind.VariableDeclaration
            ? DeclarationKind.Variable
            : isModule
                ? DeclarationKind.Module
                : tsKind === SyntaxKind.ClassDeclaration
                    ? DeclarationKind.Class
                    : tsKind === SyntaxKind.FunctionDeclaration
                        ? DeclarationKind.Function
                        : tsKind === SyntaxKind.EnumDeclaration
                            ? DeclarationKind.Enum
                            : DeclarationKind.unknown;
        if (kind === dox.DeclarationKind.unknown)
            this.error(this.classIdentifier, 'Did not discover a kind:', SyntaxKind[tsKind], this.get.report);
        return kind;
    }
    parser(node, get = this.get, isLocalTarget = false) {
        ts.isModuleDeclaration(node)
            ? this.parseModuleDeclaration(node)
            : ts.isNamespaceExport(node)
                ? this.parseNamespaceExport()
                : ts.isExportSpecifier(node)
                    ? this.parseExportSpecifier()
                    : get.isExportStarChild
                        ? this.parseReExporter(get)
                        : Declaration.deepReport.call(this, 'error', `Did not parse a ${isLocalTarget ? 'localTargetNode' : 'node'}`, get, isLocalTarget);
    }
    parseReExporter(get) {
        //this.info(get.tsSymbol.exports);
    }
    parseModuleDeclaration(module) {
        this.nameSpace = module.name.getText();
    }
    parseExportSpecifier() {
        const localTarget = this.get.localTargetDeclaration;
        if (!localTarget)
            return this.error(this.classIdentifier, 'No local target found:', this.get.report);
        const get = this.tsWrap(localTarget);
        this.parser(get.tsNode, get, true);
        /*
        if (Declaration.isNotNeeded(localTarget)) return;

        ts.isModuleDeclaration(localTarget)
            ? this.parseModuleDeclaration(localTarget)
            : ts.isNamespaceImport(localTarget)
            ? this.parseNamespaceImport(localTarget)
            : ts.isImportClause(localTarget)
            ? this.parseImportClause(localTarget)
            : this.warn(
                    this.class,
                    'Did not parse a local target:',
                    this.getter(localTarget).report,
              );
              */
    }
    static resolveTsKind(declaration) {
        let tsKind = declaration.tsKind;
        let { get } = declaration;
        if (get.localTargetDeclaration) {
            get = declaration.tsWrap(get.localTargetDeclaration);
            tsKind = get.tsNode.kind;
        }
        if (tsKind === ts.SyntaxKind.VariableDeclaration &&
            get.callSignatures.length) {
            tsKind = ts.SyntaxKind.FunctionDeclaration;
        }
        return tsKind;
    }
}
exports.default = Declaration;
//# sourceMappingURL=Declaration.js.map