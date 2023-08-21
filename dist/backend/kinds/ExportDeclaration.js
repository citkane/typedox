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
class ExportDeclaration extends dox.lib.Dox {
    constructor(context, exportNode, remoteType) {
        super(context);
        this.kind = dox.Kind.ExportDeclaration;
        this.remoteType = remoteType;
        this.remoteSymbols.forEach((symbol) => {
            const name = symbol.getName();
            const declaration = this.getDeclaration(name);
            const remoteDeclaration = this.remoteDeclarationsMap.get(name);
            declaration.tsKind = ts.SyntaxKind.ExportDeclaration;
            declaration.children.set(name, remoteDeclaration);
            remoteDeclaration.parents.push(declaration);
        });
    }
    getDeclaration(name) {
        return this.sourceFile.declarationsMap.get(name);
    }
    get remoteSourceFile() {
        return this.package.filesMap.get(this.remoteType.symbol.valueDeclaration.getSourceFile().fileName);
    }
    get remoteDeclarationsMap() {
        return this.remoteSourceFile.declarationsMap;
    }
    get remoteSymbols() {
        return this.remoteType
            .getProperties()
            .filter((symbol) => symbol.name !== 'default');
    }
}
exports.default = ExportDeclaration;
//# sourceMappingURL=ExportDeclaration.js.map