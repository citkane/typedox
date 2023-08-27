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
const { Logger } = dox.lib;
class Branch extends Logger {
    constructor(declarations) {
        super();
        this.nameSpaces = new Map();
        this.classes = new Map();
        this.variables = new Map();
        this.functions = new Map();
        this.enums = new Map();
        this.registerAlias = (declaration) => {
            //const { alias } = declaration;
            const alias = declaration;
            if (!alias)
                return this.error(this.class, 'Could not find an alias for a declaration.');
            alias.tsKind === ts.SyntaxKind.ModuleDeclaration
                ? this.registerNameSpace(alias, declaration.name)
                : alias.tsKind === ts.SyntaxKind.VariableDeclaration
                    ? this.registerVariable(alias, declaration.name)
                    : alias.tsKind === ts.SyntaxKind.FunctionDeclaration
                        ? this.registerFunction(alias, declaration.name)
                        : alias.tsKind === ts.SyntaxKind.ClassDeclaration
                            ? this.registerClass(alias, declaration.name)
                            : this.error(this.class, 'Did not register an alias');
        };
        this.registerNameSpace = (declaration, nameSpace) => {
            const { children } = declaration;
            nameSpace = nameSpace ? nameSpace : declaration.nameSpace;
            if (!nameSpace)
                return this.error('Namespace string was not found :', nameSpace);
            const newBranch = new Branch(Branch.getChildDeclarations(children));
            this.nameSpaces.set(nameSpace, newBranch);
        };
        this.registerVariable = (declaration, name) => {
            name = name ? name : declaration.name;
            this.variables.set(name, declaration);
        };
        this.registerClass = (declaration, name) => {
            name = name ? name : declaration.name;
            this.classes.set(name, declaration);
        };
        this.registerFunction = (declaration, name) => {
            name = name ? name : declaration.name;
            this.functions.set(name, declaration);
        };
        const { nameSpaceDeclarations, functionDeclarations, enumDeclarations, variableDeclarations, classDeclarations, aliasDeclarations, remainder, } = dox.tree.partitionDeclarations(declarations);
        aliasDeclarations.forEach((d) => this.registerAlias(d));
        nameSpaceDeclarations.forEach((d) => this.registerNameSpace(d));
        variableDeclarations.forEach((d) => this.registerVariable(d));
        classDeclarations.forEach((d) => this.registerClass(d));
        functionDeclarations.forEach((d) => this.registerFunction(d));
        remainder.forEach((declaration) => this.error(this.class, 'A declaration was not registered:', declaration.name));
    }
    static getChildDeclarations(children) {
        const values = children.values();
        return !!values ? [...values] : [];
    }
}
exports.default = Branch;
//# sourceMappingURL=Branch.js.map