import { ExportDeclaration } from "typescript";
import { exportAlias, fileRef } from "../types";
import Dox from "../Dox";
import DoxContext from "../DoxContext";
export default class ExportDeclarationDox extends Dox {
    private exportDeclaration;
    readonly exportSources: fileRef[];
    readonly location: exportAlias[];
    constructor(context: DoxContext, declaration: ExportDeclaration);
    private parse;
    private parseNamedExports;
    private parseExportSpecifier;
    private parseStringLiteral;
    private parseNamespaceExport;
    private parseExportAssignment;
    private parseIdentifier;
}
