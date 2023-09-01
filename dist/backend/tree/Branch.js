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
const { Logger } = dox.lib;
class Branch extends Logger {
    constructor(parent, declarations) {
        super();
        this._declarationBundle = new Map();
        this._exportStarBundle = new Map();
        this.nameSpaces = new Map();
        this.classes = new Map();
        this.variables = new Map();
        this.functions = new Map();
        this.enums = new Map();
        this.bundleDeclaration = (declaration) => {
            const { kind, name } = declaration;
            const { DeclarationKind } = dox;
            kind === DeclarationKind.ExportStar
                ? this.bundleExportStar(declaration)
                : this._declarationBundle.set(declaration.name, declaration);
        };
        this.mergeReExportIntoDeclarations = (declaration) => {
            if (this._declarationBundle.has(declaration.name))
                return;
            this._declarationBundle.set(declaration.name, declaration);
        };
        this.registerDeclaration = (declaration) => {
            const { kind, name } = declaration;
            const { DeclarationKind } = dox;
            kind === DeclarationKind.Module
                ? this.registerNameSpace(declaration)
                : kind === DeclarationKind.Class
                    ? this.classes.set(name, declaration)
                    : kind === DeclarationKind.Function
                        ? this.functions.set(name, declaration)
                        : kind === DeclarationKind.Variable
                            ? this.variables.set(name, declaration)
                            : kind === DeclarationKind.Enum
                                ? this.enums.set(name, declaration)
                                : this.error(this.classIdentifier, 'Did not find a kind for a declaration: ', `${DeclarationKind[kind]}\n`, declaration.get.report);
        };
        this.bundleExportStar = (declaration) => {
            [...(declaration.children.values() || [])].forEach((declaration) => {
                if (this._exportStarBundle.has(declaration.name))
                    return;
                this._exportStarBundle.set(declaration.name, declaration);
            });
        };
        this.registerNameSpace = (declaration) => {
            if (this.nameSpaces.has(declaration.name))
                return;
            const children = Branch.getChildDeclarations(declaration.children);
            const newBranch = new Branch(this, children);
            this.nameSpaces.set(declaration.name, newBranch);
        };
        this.parent = parent;
        /*
        declarations.forEach((declaration) => {
            this.info(
                declaration.name,
                declaration.fileName,
                declaration.children.keys(),
            );
        });
        */
        declarations.forEach(this.bundleDeclaration);
        this.reExports.forEach(this.mergeReExportIntoDeclarations);
        this.declarationBundle.forEach(this.registerDeclaration);
        /*
        this.info({
            declarations: declarations.map((declaration) => ({
                name: declaration.name,
                parents: declaration.parents.length,
                children: declaration.children,
            })),
            declare: this._declarationBundle.keys(),
            star: this._exportStarBundle.keys(),
        });
        */
    }
    get reExports() {
        return [...this._exportStarBundle.values()];
    }
    get declarationBundle() {
        return [...this._declarationBundle.values()];
    }
    static getChildDeclarations(children) {
        const values = children.values();
        return !!values ? [...values] : [];
    }
}
exports.default = Branch;
//# sourceMappingURL=Branch.js.map