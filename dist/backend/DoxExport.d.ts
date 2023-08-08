import { ExportDeclaration, NamedExports, Program, SyntaxKind, TypeChecker, Node, StringLiteral, ExportSpecifier, NamespaceExport, SourceFile, ExportAssignment, Identifier } from "typescript";
import TypeDox from "./TypeDox";
export default class DoxExport extends TypeDox {
    exportDeclaration: Node;
    exportSources: SourceFile[];
    location: string[];
    constructor(checker: TypeChecker, program: Program, declaration: Node, location: string[]);
    parseExportDeclaration(exportDeclaration: ExportDeclaration, namespace?: boolean): void;
    parseNamedExports(namedExport: NamedExports, namespace?: boolean): void;
    parseExportSpecifier: (exportSpecifier: ExportSpecifier, namespace?: boolean) => void;
    parseStringLiteral(stringLiteral: StringLiteral, namespace?: boolean): void;
    parseNamespaceExport(namespaceExport: NamespaceExport, namespace?: boolean): void;
    parseExportAssignment(exportAssignment: ExportAssignment, namespace?: boolean): void;
    parseIdentifier(identifier: Identifier, namespace?: boolean): void;
    parse(node: Node, namespace?: boolean): any;
    static nodesToSkip: SyntaxKind[];
}
