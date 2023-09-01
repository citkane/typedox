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
exports.Dox = void 0;
const ts = __importStar(require("typescript"));
const dox = __importStar(require("../typedox"));
const Logger_1 = require("./Logger");
class Dox extends Logger_1.Logger {
    constructor(context) {
        var _a;
        super();
        this.tsWrap = (item) => new dox.TscWrapper(this.checker, item);
        this.context = context;
        this.checker = context.checker;
        this.package = context.npmPackage;
        this.reference = context.tsReference;
        this.sourceFile = context.tsSourceFile;
        this.fileName = (_a = context.tsSourceFile) === null || _a === void 0 ? void 0 : _a.fileName;
    }
    static parseExportStars(symbol) {
        const _this = this;
        return symbol
            .declarations.map((declaration) => {
            return ts.isExportDeclaration(declaration)
                ? declaration.moduleSpecifier
                : logError(declaration);
        })
            .filter((symbol) => !!symbol);
        function logError(declaration) {
            Dox.error(_this.classIdentifier, `Expected a ts.ExportDeclaration but got ts.${ts.SyntaxKind[declaration.kind]}`);
        }
    }
}
exports.Dox = Dox;
Dox.isStarExport = (symbol) => symbol.flags === ts.SymbolFlags.ExportStar;
Dox.isSpecifierKind = (kind) => {
    const { NamespaceExport, NamespaceImport, ModuleDeclaration, ExportDeclaration, ExportSpecifier, ExportAssignment, ImportClause, ImportSpecifier, } = ts.SyntaxKind;
    const specifiers = [
        NamespaceExport,
        NamespaceImport,
        ModuleDeclaration,
        ExportDeclaration,
        ExportSpecifier,
        ExportAssignment,
        ImportClause,
        ImportSpecifier,
    ];
    return specifiers.includes(kind);
};
//# sourceMappingURL=Dox.js.map