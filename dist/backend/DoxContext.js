"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DoxContext {
    constructor(checker, program, config, id, doxPackage, exportDeclaration) {
        this.checker = checker;
        this.program = program;
        this.config = config;
        this.id = id;
        this.package = doxPackage;
        this.exportDeclaration = exportDeclaration;
    }
}
exports.default = DoxContext;
//# sourceMappingURL=DoxContext.js.map