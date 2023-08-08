import { TypeChecker, SourceFile, Symbol, Program } from "typescript";

export default class TypeDox {
  checker: TypeChecker;
  program: Program;
  constructor(checker: TypeChecker, program: Program) {
    this.checker = checker;
    this.program = program;
  }
  getExportsFromSourcefile(sourceFile: SourceFile) {
    const sourceSymbol = this.checker.getSymbolAtLocation(sourceFile);
    return this.checker.getExportsOfModule(sourceSymbol);
  }

  getTypeFromSymbol(classSymbol: Symbol) {
    return classSymbol.valueDeclaration
      ? this.checker.getTypeOfSymbolAtLocation(
          classSymbol,
          classSymbol.valueDeclaration
        )
      : undefined;
  }
}
