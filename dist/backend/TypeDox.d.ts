import { TypeChecker, SourceFile, Symbol, Program } from "typescript";
export default class TypeDox {
    checker: TypeChecker;
    program: Program;
    constructor(checker: TypeChecker, program: Program);
    getExportsFromSourcefile(sourceFile: SourceFile): Symbol[];
    getTypeFromSymbol(classSymbol: Symbol): import("typescript").Type;
}
