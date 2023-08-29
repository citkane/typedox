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
    constructor(context, symbol) {
        super(context);
        this.parents = [];
        this.children = new Map();
        this.parseNamespaceExport = (declaration) => {
            this.nameSpace = this.name;
            this.tsKind = declaration.kind;
        };
        this.parseNamespaceImport = (declaration) => {
            this.nameSpace = this.name;
            this.tsKind = declaration.kind;
        };
        this.parseImportClause = (declaration) => {
            this.tsKind = declaration.kind;
        };
        Dox_1.Dox.class.bind(this);
        this.get = this.getter(symbol);
        this.tsSymbol = symbol;
        this.name = symbol.getName();
        this.tsNode = this.get.tsNode;
        this.tsType = this.checker.getTypeOfSymbol(symbol);
        this.tsKind = this.tsNode.kind;
        this.aliasName = this.get.alias;
        this.parser(this.tsNode);
        this.debug(this.class, this.get.nodeDeclarationText);
    }
    get parent() {
        return this.reference;
    }
    parser(node, get = this.get, isLocalTarget = false) {
        if (Declaration.isDeclaredEnough(node))
            return;
        ts.isModuleDeclaration(node)
            ? this.parseModuleDeclaration(node)
            : ts.isNamespaceExport(node)
                ? this.parseNamespaceExport(node)
                : ts.isExportSpecifier(node)
                    ? this.parseExportSpecifier(node)
                    : ts.isExportAssignment(node)
                        ? this.parseExportAssignment(node)
                        : dox.lib.Relationships.fullReport('error', this, this.class, `Did not parse a ${isLocalTarget ? 'localTargetNode' : 'node'}`, get, isLocalTarget);
    }
    parseExportAssignment(declaration) {
        this.tsKind = declaration.kind;
    }
    parseExportDeclaration(declaration) {
        this.tsKind = declaration.kind;
    }
    parseModuleDeclaration(module) {
        this.nameSpace = module.name.getText();
        this.tsKind = module.kind;
    }
    parseExportSpecifier(declaration) {
        const localTarget = this.get.localTargetDeclaration;
        if (!localTarget)
            return this.error(this.class, 'No local target found:', this.get.report);
        const get = this.getter(localTarget);
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
}
Declaration.isDeclaredEnough = (node) => Dox_1.Dox.canBeIgnored(node) ||
    ts.isNamespaceImport(node) ||
    ts.isImportClause(node);
exports.default = Declaration;
//# sourceMappingURL=Declaration.js.map