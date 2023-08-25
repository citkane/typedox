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
class Branch {
    constructor(declarations) {
        this.nameSpaces = new Map();
        this.classes = new Map();
        this.variables = new Map();
        this.functions = new Map();
        this.enums = new Map();
        this.registerAlias = (declaration) => {
            //const { alias } = declaration;
            const alias = declaration;
            if (!alias)
                return dox.log
                    .object(declaration)
                    .error('Could not find an alias for a declaration in dox.Branch:');
            alias.tsKind === ts.SyntaxKind.ModuleDeclaration
                ? this.registerNameSpace(alias, declaration.name)
                : alias.tsKind === ts.SyntaxKind.VariableDeclaration
                    ? this.registerVariable(alias, declaration.name)
                    : alias.tsKind === ts.SyntaxKind.FunctionDeclaration
                        ? this.registerFunction(alias, declaration.name)
                        : alias.tsKind === ts.SyntaxKind.ClassDeclaration
                            ? this.registerClass(alias, declaration.name)
                            : dox.log
                                .object(alias)
                                .error('Did not register an alias in dox.Branch:');
        };
        this.registerNameSpace = (declaration, nameSpace) => {
            const { children } = declaration;
            nameSpace = nameSpace ? nameSpace : declaration.nameSpace;
            if (!nameSpace) {
                dox.log.error('Namespace string was not found :', nameSpace);
                return;
            }
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
        remainder.forEach(Branch.logRemainderError);
    }
    static getChildDeclarations(children) {
        const values = children.values();
        return !!values ? [...values] : [];
    }
}
Branch.logRemainderError = (declaration) => dox.log
    .object(declaration)
    .error('A declaration was not registered in the dox.tree.Branch:');
exports.default = Branch;
//# sourceMappingURL=Branch.js.map