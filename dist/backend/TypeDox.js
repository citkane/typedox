"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TypeDox {
    checker;
    program;
    constructor(checker, program) {
        this.checker = checker;
        this.program = program;
    }
    getExportsFromSourcefile(sourceFile) {
        const sourceSymbol = this.checker.getSymbolAtLocation(sourceFile);
        return this.checker.getExportsOfModule(sourceSymbol);
    }
    getTypeFromSymbol(classSymbol) {
        return classSymbol.valueDeclaration
            ? this.checker.getTypeOfSymbolAtLocation(classSymbol, classSymbol.valueDeclaration)
            : undefined;
    }
}
exports.default = TypeDox;
//# sourceMappingURL=TypeDox.js.map