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
const ts = __importStar(require("typescript"));
class Tree {
    constructor(pack) {
        const { getDeclarationRoots, makeTree } = Tree;
        const declarationRoots = getDeclarationRoots(pack);
        const branch = new dox.serialiser.Branch();
        this.treeRoot = makeTree(declarationRoots, Object.assign({ packageName: pack.name, version: pack.version }, branch));
    }
    serialise() {
        const { packageName, version, nameSpaces, declarations } = this.treeRoot;
        const branch = new dox.serialiser.Branch(nameSpaces, declarations).serialise();
        return JSON.stringify(Object.assign({ packageName,
            version }, branch), null, 4);
    }
}
_a = Tree;
Tree.makeTree = (declarations, branch, specifierAlias) => {
    declarations.forEach((declaration) => {
        var _b, _c;
        let { alias, name, nameSpace, children, tsKind } = declaration;
        name = specifierAlias || name;
        switch (tsKind) {
            case ts.SyntaxKind.NamespaceExport:
                (_b = branch.nameSpaces) === null || _b === void 0 ? void 0 : _b.set(nameSpace, _a.makeTree([...children.values()], new dox.serialiser.Branch()));
                break;
            case ts.SyntaxKind.ExportSpecifier:
                const child = children.get(alias || name);
                alias
                    ? _a.makeTree([child], branch, name)
                    : _a.makeTree([child], branch);
                break;
            case ts.SyntaxKind.ExportDeclaration:
                _a.makeTree([...children.values()], branch);
                break;
            default:
                (_c = branch.declarations) === null || _c === void 0 ? void 0 : _c.set(name, declaration);
        }
    });
    return branch;
};
Tree.getDeclarationRoots = (pack) => {
    return _a.getAllDeclarations(pack).filter((declaration) => !declaration.parents.length);
};
Tree.getAllDeclarations = (pack) => {
    return [..._a.getAllFileSources(pack)]
        .map((fileSource) => [...fileSource.declarationsMap.values()])
        .flat();
};
Tree.getAllFileSources = (pack) => {
    return pack.filesMap.values();
};
exports.default = Tree;
//# sourceMappingURL=Tree.js.map