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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dox = __importStar(require("../typedox"));
const ts = __importStar(require("typescript"));
const Branch_1 = __importDefault(require("./Branch"));
class Tree extends Branch_1.default {
    constructor(doxPackage) {
        super();
        this.makeTree = (declarations, branch) => {
            declarations.forEach((declaration) => {
                var _b, _c;
                const { nameSpace, children, tsKind, name } = declaration;
                switch (tsKind) {
                    case ts.SyntaxKind.ModuleDeclaration:
                    case ts.SyntaxKind.NamespaceExport:
                        const childDecs = Tree.getChildDeclarations(children);
                        const newBranch = new dox.tree.Branch();
                        (_b = branch.nameSpaces) === null || _b === void 0 ? void 0 : _b.set(nameSpace, this.makeTree(childDecs, newBranch));
                        break;
                    default:
                        //dox.log.info(declaration.name, name, declaration.tsKind);
                        (_c = branch.declarations) === null || _c === void 0 ? void 0 : _c.set(name, declaration);
                }
            });
            return branch;
        };
        this.packageName = doxPackage.name;
        this.version = doxPackage.version;
        const { getDeclarationRoots } = Tree;
        const declarations = getDeclarationRoots(doxPackage);
        declarations.forEach((declaration) => {
            const { tsKind } = declaration;
            switch (tsKind) {
                case ts.SyntaxKind.ModuleDeclaration:
                case ts.SyntaxKind.NamespaceExport:
                    break;
                default:
            }
        });
        this.makeTree(declarations, this);
    }
    toObject() {
        return dox.serialiser.Serialiser.tree(this);
    }
    static getChildDeclarations(children) {
        const values = children.values();
        return !!values ? [...values] : [];
    }
}
_a = Tree;
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