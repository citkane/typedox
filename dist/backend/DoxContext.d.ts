import { ParsedCommandLine, Program, TypeChecker } from "typescript";
import Id from "./Id";
import DoxPackage from "./DoxPackage";
import ExportDeclarationDox from "./doxKinds/ExportDeclarationDox";
export default class DoxContext {
    checker: TypeChecker;
    program: Program;
    config: ParsedCommandLine;
    id: Id;
    package?: DoxPackage;
    exportDeclaration?: ExportDeclarationDox;
    constructor(checker: TypeChecker, program: Program, config: ParsedCommandLine, id: Id, doxPackage?: DoxPackage, exportDeclaration?: ExportDeclarationDox);
}
