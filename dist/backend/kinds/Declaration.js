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
    //serialise = () => new Object();
    constructor(context, symbol) {
        var _a, _b, _c;
        super(context);
        this.kind = dox.Kind.Declaration;
        this.parents = [];
        this.children = new Map();
        this.name = symbol.getName();
        this.fileName = (_a = this.sourceFile) === null || _a === void 0 ? void 0 : _a.fileName;
        this.node = symbol.valueDeclaration;
        this.symbol = symbol;
        this.type = this.checker.getTypeOfSymbol(symbol);
        this.tsKind = (_b = this.node) === null || _b === void 0 ? void 0 : _b.kind;
        if (symbol.flags === ts.SymbolFlags.AliasExcludes) {
            const alias = (_c = symbol.declarations) === null || _c === void 0 ? void 0 : _c.find((alias) => Declaration.isDeclarationTheAlias(alias, this.symbol));
            dox.log.info({
                node: ts.SyntaxKind[alias.kind],
                type: ts.TypeFlags[this.type.flags],
                symbol: ts.SymbolFlags[this.symbol.flags],
                text: alias === null || alias === void 0 ? void 0 : alias.parent.getText(),
            });
            /*
            dox.log.info(
                ts.isExportDeclaration(alias!),
                ts.isExportSpecifier(alias!),
                ts.isNamespaceExport(alias!),
            );
            */
            if (!!alias && ts.isExportDeclaration(alias)) {
                //dox.log.info(this.symbol);
                this.isExportDeclaration(alias);
                return;
            }
            if (!!alias && ts.isExportSpecifier(alias)) {
                this.isExportSpecifier(alias);
                return;
            }
            if (!!alias && ts.isNamespaceExport(alias)) {
                this.isNamespaceExport(alias);
                return;
            }
            dox.log.error('No ts.SymbolFlags.AliasExcludes was found for a dox.declaration:', this.symbol.name);
            return;
        }
        if (!symbol.valueDeclaration) {
            dox.log.error('No ts.Symbol.valueDeclaration was found for a dox.declaration:', this.symbol.name);
        }
        //this.setSerialiser();
    }
    isExportSpecifier(alias) {
        //dox.log.info(alias.parent.parent.getText());
        this.alias = alias;
        this.tsKind = ts.SyntaxKind.ExportSpecifier;
    }
    isNamespaceExport(alias) {
        this.alias = alias;
        this.nameSpace = this.name;
        this.tsKind = ts.SyntaxKind.NamespaceExport;
    }
    isExportDeclaration(alias) {
        //dox.log.info(alias.parent.getText());
        this.tsKind = ts.SyntaxKind.ExportDeclaration;
    }
    static isDeclarationTheAlias(alias, symbol) {
        var _a;
        const name = symbol.getName();
        if (ts.isExportSpecifier(alias) ||
            ts.isNamespaceExport(alias) ||
            ts.isExportDeclaration(alias))
            return ((_a = alias.name) === null || _a === void 0 ? void 0 : _a.getText()) === name;
        return false;
    }
}
exports.default = Declaration;
//# sourceMappingURL=Declaration.js.map