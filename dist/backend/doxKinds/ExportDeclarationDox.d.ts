import { ExportDeclaration } from "typescript";
import { DoxKind, memberMap } from "../types";
import Dox from "../Dox";
import DoxContext from "../DoxContext";
export default class ExportDeclarationDox extends Dox {
    kind: DoxKind;
    private declaration;
    nameSpace: string;
    exportSourceFile: string;
    exportTargetFile: string;
    members: memberMap;
    constructor(context: DoxContext, declaration: ExportDeclaration);
    private get namedExport();
    private get moduleSymbol();
    private get moduleType();
    private get sourceType();
    private registerSelfToPackage;
    private registerMembersToSelf;
    private static getExportTargetFile;
    private static getFileName;
    private static getNameSpace;
}
