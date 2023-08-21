"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Branch {
    constructor(nameSpaces = new Map(), declarations = new Map()) {
        this.nameSpaces = nameSpaces;
        this.declarations = declarations;
    }
    serialise() {
        const nameSpaces = {};
        const declarations = {};
        this.nameSpaces.forEach((branch, name) => {
            nameSpaces[name] = branch.serialise();
        });
        this.declarations.forEach((declaration, name) => (declarations[name] = declaration.serialise()));
        return { nameSpaces, declarations };
    }
}
exports.default = Branch;
//# sourceMappingURL=Branch.js.map