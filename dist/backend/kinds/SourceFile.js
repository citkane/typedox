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
        this.declarationsMap = new Map();
        this.discoverFiles = (fileSymbols) => {
            return fileSymbols.map(getFileNames.bind(this)).flat().filter(filter);
            function getFileNames(symbol) {
                return SourceFile.isStarExport(symbol)
                    ? discoverStars.bind(this)(symbol)
                    : this.tsWrap(symbol).targetFileName;
            }
            function discoverStars(symbol) {
                return SourceFile.parseExportStars
                    .call(this, symbol)
                    .map((expression) => this.tsWrap(expression).targetFileName);
            }
            function filter(value, index, array) {
                return !!value && array.indexOf(value) === index;
            }
        };
        this.discoverDeclarations = () => {
            var _a;
            (_a = this.fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.forEach(parseSymbol.bind(this));
            function parseSymbol(symbol) {
                SourceFile.isStarExport(symbol)
                    ? discoverStarExports.bind(this)(symbol)
                    : makeDeclaration.call(this, symbol);
            }
            function discoverStarExports(symbol) {
                SourceFile.parseExportStars
                    .call(this, symbol)
                    .forEach(makeDeclaration.bind(this));
            }
            function makeDeclaration(item) {
                const declaration = new dox.Declaration(this.context, item);
                this.declarationsMap.set(declaration.name, declaration);
            }
        };
        this.discoverRelationships = () => {
            this.declarationsMap.forEach((declaration) => new dox.lib.Relation(this.context, declaration));
            /*
            this.fileSymbol.exports?.forEach(discoverStarExports.bind(this));
            function discoverStarExports(this: SourceFile, symbol: ts.Symbol) {
                SourceFile.isStarExport(symbol)
                    ? parseStars.call(this, symbol)
                    : new dox.lib.Relation(this.context, symbol);
                    
            }
            function parseStars(this: SourceFile, symbol: ts.Symbol) {
                SourceFile.parseExportStars
                    .call(this, symbol)
                    .forEach((expression) => {
                        new dox.lib.Relation(this.context, expression);
                    });
            }
            */
        };
        SourceFile.classString.bind(this);
        this.context = Object.assign(Object.assign({}, this.context), { sourceFile: this });
        this.source = source;
        this.fileName = source.fileName;
        this.fileSymbol = this.checker.getSymbolAtLocation(source);
        this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
        const fileExports = (_a = this.fileSymbol.exports) === null || _a === void 0 ? void 0 : _a.values();
        this.childFiles = this.discoverFiles([...(fileExports || [])]);
        this.debug(this.classIdentifier, this.fileName);
    }
    get parent() {
        return this.reference;
    }
}
exports.default = SourceFile;
//# sourceMappingURL=SourceFile.js.map