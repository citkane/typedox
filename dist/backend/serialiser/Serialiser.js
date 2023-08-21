"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Serialiser {
    /*
    declaration: dox.Declaration;
    node: ts.VariableDeclaration;
    type: ts.Type;
    symbol: ts.Symbol;
    checker: ts.TypeChecker;
    constructor(declaration: dox.Declaration) {
        const { type, symbol, checker, node } = declaration;
        this.declaration = declaration;
        this.type = type;
        this.symbol = symbol;
        this.node = node as ts.VariableDeclaration;
        this.checker = checker;
    }
    */
    static tree(tree) {
        const { packageName, version } = tree;
        const branch = Serialiser.branch(tree);
        return Object.assign({ packageName, version }, branch);
    }
    static branch(branch) {
        const nameSpaces = Serialiser.nameSpaces(branch);
        const declarations = Serialiser.declarations(branch);
        return { nameSpaces, declarations };
    }
    static nameSpaces(branch) {
        const nameSpaces = new Map();
        branch.nameSpaces.forEach((branch, name) => {
            nameSpaces.set(name, Serialiser.branch(branch));
        });
        return nameSpaces;
    }
    static declarations(branch) {
        const declarations = new Map();
        branch.declarations.forEach((declaration, name) => {
            declarations.set(name, {});
        });
        return declarations;
    }
}
exports.default = Serialiser;
//# sourceMappingURL=Serialiser.js.map