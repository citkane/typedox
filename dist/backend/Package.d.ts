import { TypeChecker, SourceFile, Node, Program, ExportDeclaration } from "typescript";
import Dox from "./Dox";
import { exportAlias } from "./types";
export default class Package extends Dox {
    location: exportAlias[];
    constructor(checker: TypeChecker, program: Program, entrySources: readonly SourceFile[]);
    parseEntrySources(sourceFiles: readonly SourceFile[], location?: exportAlias[]): void;
    parseExportDeclaration(exportDeclaration: ExportDeclaration, location: exportAlias[]): void;
    static getExportDeclarations(node: Node, exportDeclarations?: ExportDeclaration[]): ExportDeclaration[];
    get packageName(): string;
}
