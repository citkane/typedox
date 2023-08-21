"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DoxContext {
    constructor(checker, program, config, id, doxPackage, sourceFile, exportDeclaration) {
        this.checker = checker;
        this.program = program;
        this.config = config;
        this.id = id;
        this.package = doxPackage;
        this.sourceFile = sourceFile;
        this.exportDeclaration = exportDeclaration;
    }
}
exports.default = DoxContext;
//# sourceMappingURL=Context.js.map