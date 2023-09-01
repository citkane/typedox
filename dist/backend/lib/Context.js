"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DoxContext {
    constructor(tsProgram, tsConfig, npmPackage, tsReference, tsSourceFile, tsDeclaration) {
        this.tsProgram = tsProgram;
        this.checker = tsProgram.getTypeChecker();
        this.tsConfig = tsConfig;
        this.npmPackage = npmPackage;
        this.tsReference = tsReference;
        this.tsSourceFile = tsSourceFile;
        this.tsDeclaration = tsDeclaration;
    }
}
exports.default = DoxContext;
//# sourceMappingURL=Context.js.map