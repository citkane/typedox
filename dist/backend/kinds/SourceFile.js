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
class SourceFile extends Dox_1.Dox {
    constructor(context, source) {
        var _a;
        super(context);
        this.declarationsMap = new Map();
        this.discoverFiles = (fileSymbols) => {
            return fileSymbols
                .map((symbol) => symbol.flags === ts.SymbolFlags.ExportStar
                ? this.parseExportStars(symbol).map((expression) => this.getter(expression).targetFileName)
                : this.getter(symbol).targetFileName)
                .flat()
                .filter((value, index, array) => !!value && array.indexOf(value) === index);
        };
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
            return (_a = this.fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.forEach((symbol) => {
                symbol.flags === ts.SymbolFlags.ExportStar
                    ? this.parseExportStars(symbol).forEach((expression) => {
                        return;
                        new dox.lib.Relationships(this.context, this.checker.getSymbolAtLocation(expression));
                    })
                    : new dox.lib.Relationships(this.context, symbol);
            });
        };
        SourceFile.class.bind(this);
        this.context = Object.assign(Object.assign({}, this.context), { sourceFile: this });
        this.source = source;
        this.fileName = source.fileName;
        this.fileSymbol = this.checker.getSymbolAtLocation(source);
        const fileExports = (_a = this.fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.values();
        this.childFiles = this.discoverFiles([...(fileExports || [])]);
        this.debug(this.class, this.fileName);
    }
    parseExportStars(symbol) {
        return symbol
            .declarations.map((declaration) => {
            return ts.isExportDeclaration(declaration)
                ? declaration.moduleSpecifier
                : logError(this, declaration);
        })
            .filter((symbol) => !!symbol);
        function logError(self, declaration) {
            self.error(self.class, `Expected a ts.ExportDeclaration but got ts.${ts.SyntaxKind[declaration.kind]}`);
        }
    }
}
exports.default = SourceFile;
//# sourceMappingURL=SourceFile.js.map