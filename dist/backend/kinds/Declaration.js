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
const ts = __importStar(require("typescript"));
class Declaration extends dox.lib.Dox {
    constructor(context, symbol) {
        var _a, _b;
        super(context);
        this.kind = dox.Kind.Declaration;
        this.parents = [];
        this.children = new Map();
        /*
        private parseModuleDeclaration(self: dox.Declaration = this) {
            self.nameSpace = self.symbol.name;
            self.tsKind = ts.SyntaxKind.ModuleDeclaration;
        }
        */
        this.parseNamespaceImport = (declaration) => {
            this.nameSpace = this.name;
            this.tsKind = declaration.kind;
        };
        this.parseNamespaceExport = (declaration) => {
            this.nameSpace = this.name;
            this.tsKind = declaration.kind;
        };
        const { checker } = context;
        this.symbol = symbol;
        this.name = symbol.getName();
        this.fileName = (_a = this.sourceFile) === null || _a === void 0 ? void 0 : _a.fileName;
        this.node = symbol.valueDeclaration;
        this.type = this.checker.getTypeOfSymbol(symbol);
        this.tsKind = (_b = this.node) === null || _b === void 0 ? void 0 : _b.kind;
        if (Declaration.isIgnored(this.node))
            return;
        this.node && ts.isExportSpecifier(this.node)
            ? this.parseExportSpecifier(this.node)
            : this.node && ts.isModuleDeclaration(this.node)
                ? this.parseModuleDeclaration(this.node)
                : !!this.node
                    ? dox.log.object(this).warn('Unexpected node in a dox.Declaration:')
                    : this.symbol.flags === ts.SymbolFlags.AliasExcludes
                        ? this.parseAlias()
                        : dox.log
                            .object(this)
                            .warn('Unexpected dox.Declaration was not processed:');
        /*
        if (this.symbol.flags === ts.SymbolFlags.AliasExcludes) {
            const aliasSymbol = this.checker.getAliasedSymbol(this.symbol);
            const node = aliasSymbol.valueDeclaration;

            node && ts.isModuleDeclaration(node)
                ? this.parseAliasModuleDeclaration(aliasSymbol)
                : this.parseAlias();
        } else {
            this.node && ts.isModuleDeclaration(this.node)
                ? this.parseModuleDeclaration()
                : Declaration.isIgnored(this.node)
                ? null
                : dox.log
                        .object(this)
                        .error('Unknown kind encountered in a dox.Declaration');
        }
        */
    }
    parseAlias() {
        var _a;
        //dox.log.object(this).info();
        (_a = this.symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.forEach((declaration) => {
            ts.isExportSpecifier(declaration)
                ? this.parseExportSpecifier(declaration)
                : null;
        });
        /*
        const { getLocalNamespace } = dox.SourceFile;
        //const localNamespace = getLocalNamespace(this.checker, )
        const declaration = Declaration.findAliasDeclarationFromSymbol(
            this.symbol,
        );

        if (!declaration)
            return dox.log.warn(
                'Did not find an alias in dox.Declaration:',
                this.symbol.name,
            );

        ts.isNamespaceExport(declaration)
            ? this.parseNamespaceExport(declaration)
            : ts.isExportSpecifier(declaration)
            ? this.parseExportSpecifier(declaration)
            : ts.isExportDeclaration(declaration)
            ? this.parseExportDeclaration(declaration)
            : dox.log.error(
                    'Unknown alias encounter in a dox.Declaration: ',
                    declaration,
              );
              */
    }
    /*
    private parseAliasModuleDeclaration(aliasSymbol: ts.Symbol) {
        this.nameSpace = this.name;
        this.tsKind = ts.SyntaxKind.ModuleDeclaration;
        //this._alias = new Declaration(this.context, aliasSymbol);
        //this.parseModuleDeclaration(this._alias);
    }
    */
    parseModuleDeclaration(module) {
        this.nameSpace = module.name.getText();
        this.tsKind = module.kind;
    }
    parseExportSpecifier(declaration) {
        var _a;
        const { getLocalTargetSymbol } = dox.SourceFile;
        const localTarget = getLocalTargetSymbol(this.checker, declaration);
        this.aliasName = (_a = declaration.propertyName) === null || _a === void 0 ? void 0 : _a.getText();
        if (localTarget) {
            ts.isModuleDeclaration(localTarget)
                ? this.parseModuleDeclaration(localTarget)
                : localTarget && ts.isNamespaceImport(localTarget)
                    ? this.parseNamespaceImport(localTarget)
                    : (this.tsKind = localTarget.kind);
        }
        else {
            dox.log
                .object(this)
                .warn('Unprocessed ts.ExportSpecifier in dox.Declaration');
        }
    }
    parseExportDeclaration(declaration) {
        this.tsKind = declaration.kind;
    }
    static findAliasDeclarationFromSymbol(symbol) {
        var _a;
        const name = symbol.getName();
        return (_a = symbol.getDeclarations()) === null || _a === void 0 ? void 0 : _a.find((declaration) => {
            var _a;
            return ((ts.isExportSpecifier(declaration) ||
                ts.isNamespaceExport(declaration) ||
                ts.isExportDeclaration(declaration) ||
                ts.isModuleDeclaration(declaration)) &&
                ((_a = declaration.name) === null || _a === void 0 ? void 0 : _a.getText()) === name);
        });
    }
}
/*
public get alias(): Declaration | undefined {
    if (this._alias) return this._alias;
    if (!!this.node) return undefined;
    if (this.aliasName && this.children.has(this.aliasName))
        return this.children.get(this.aliasName);
    const aliasSymbol = this.checker.getAliasedSymbol(this.symbol);
    this._alias = new Declaration(this.context, aliasSymbol);
    return this._alias;
}
*/
Declaration.isIgnored = (node) => node &&
    (ts.isEnumDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isSourceFile(node) ||
        ts.isFunctionDeclaration(node));
exports.default = Declaration;
//# sourceMappingURL=Declaration.js.map