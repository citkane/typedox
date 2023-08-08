import { TypeChecker, SourceFile, Symbol, Node, Program } from "typescript";
import TypeDox from "./TypeDox";
export default class Package extends TypeDox {
    exportSymbols: Symbol[];
    exportDeclarations: Node[];
    constructor(checker: TypeChecker, program: Program, entrySources: readonly SourceFile[]);
    parseExports(sources: readonly SourceFile[], location?: string[]): void;
    get packageName(): string;
    static isNodeExported(node: Node): boolean;
}
