"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DoxContext {
    constructor(checker, program, config, id, doxPackage, reference, sourceFile, exportDeclaration) {
        this.checker = checker;
        this.program = program;
        this.config = config;
        this.id = id;
        this.package = doxPackage;
        this.reference = reference;
        this.sourceFile = sourceFile;
        this.exportDeclaration = exportDeclaration;
    }
}
exports.default = DoxContext;
//# sourceMappingURL=Context.js.map