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
class ExportSpecifier extends dox.lib.Dox {
    constructor(context, exportNode, remoteType) {
        var _a;
        super(context);
        this.kind = dox.Kind.ExportSpecifier;
        const name = exportNode.name.getText();
        const alias = (_a = exportNode.propertyName) === null || _a === void 0 ? void 0 : _a.getText();
        const declaration = this.getDeclaration(name);
        if (alias)
            declaration.alias = alias;
        if (!remoteType) {
            const symbol = this.checker.getAliasedSymbol(declaration.symbol);
            const node = symbol.valueDeclaration;
            declaration.symbol = symbol;
            declaration.tsKind = node.kind;
            declaration.fileName = node.getSourceFile().fileName;
            return;
        }
        declaration.tsKind = ts.SyntaxKind.ExportSpecifier;
        const map = this.getRemoteDeclarationsMap(remoteType);
        const remoteDeclaration = map.get(alias || name);
        declaration.children.set(alias || name, remoteDeclaration);
        remoteDeclaration.parents.push(declaration);
    }
    getDeclaration(name) {
        return this.sourceFile.declarationsMap.get(name);
    }
    getRemoteDeclarationsMap(remoteType) {
        const fileName = remoteType.symbol.valueDeclaration.getSourceFile().fileName;
        return this.package.filesMap.get(fileName).declarationsMap;
    }
}
exports.default = ExportSpecifier;
//# sourceMappingURL=ExportSpecifier.js.map