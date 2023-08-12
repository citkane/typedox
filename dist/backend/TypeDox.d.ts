import { TypeChecker, SourceFile, Symbol, Program, Node, ExportDeclaration, StringLiteral, ExportSpecifier } from "typescript";
import { exportAlias } from "./types";
export default class TypeDox {
    checker: TypeChecker;
    program: Program;
    constructor(checker: TypeChecker, program: Program);
    getExportsFromSourcefile(sourceFile: SourceFile): Symbol[];
    getTypeFromSymbol(classSymbol: Symbol): import("typescript").Type;
    static isNodeExported(node: Node): boolean;
    static makeFilePath(exportDeclaration: ExportDeclaration, pathString: StringLiteral): {
        originalExtension: string;
        fileName: string;
        dirName: string;
        filePath: string;
    };
    static makeExportAlias(specification: ExportSpecifier | string): {
        name: string;
        alias?: undefined;
    } | {
        name: string;
        alias: string;
    };
    static resolveLocation(location: exportAlias[]): string;
}
