import { ClassDeclaration, ExportDeclaration, ImportDeclaration, InterfaceDeclaration, TypeAliasDeclaration, VariableDeclarationList } from "typescript";
import ExportDeclarationDox from "./doxKinds/ExportDeclarationDox";
import ExportMemberDox from "./doxKinds/ExportMemberDox";
export declare enum DoxKind {
    Unknown = 0,
    Package = 1,
    ExportDeclaration = 2,
    ExportMember = 3
}
export type fileMap = Map<string, declarationMaps>;
export interface declarationMaps {
    exports: Map<number, ExportDeclarationDox>;
    imports: Map<number, ImportDeclaration>;
    classes: Map<number, ClassDeclaration>;
    variables: Map<number, VariableDeclarationList>;
    types: Map<number, TypeAliasDeclaration>;
    interfaces: Map<number, InterfaceDeclaration>;
}
export type memberMap = Map<number, ExportMemberDox>;
export interface declarationKinds {
    exports: ExportDeclaration[];
    imports: ImportDeclaration[];
    classes: ClassDeclaration[];
    variables: VariableDeclarationList[];
    types: TypeAliasDeclaration[];
    interfaces: InterfaceDeclaration[];
}
