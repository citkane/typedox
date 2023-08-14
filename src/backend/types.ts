import {
	ClassDeclaration,
	ExportAssignment,
	ExportDeclaration,
	ImportDeclaration,
	InterfaceDeclaration,
	TypeAliasDeclaration,
	Node,
} from 'typescript';
import ExportDeclarationDox from './doxKinds/ExportDeclarationDox';
import ExportMemberDox from './doxKinds/ExportMemberDox';

export enum DoxKind {
	Unknown = 0,
	Package = 1,
	ExportDeclaration = 2,
	ExportMember = 3,
}

export type fileMap = Map<string, declarationMaps>;
export interface declarationMaps {
	exports: Map<number, ExportDeclarationDox>;
	imports: Map<number, ImportDeclaration>;
	classes: Map<number, ClassDeclaration>;
	variables: Map<number, Node>;
	types: Map<number, TypeAliasDeclaration>;
	interfaces: Map<number, InterfaceDeclaration>;
}
export type memberMap = Map<string, ExportMemberDox>;

export interface declarationKinds {
	exports: (ExportDeclaration | ExportAssignment)[];
	imports: ImportDeclaration[];
	classes: ClassDeclaration[];
	variables: Node[];
	types: TypeAliasDeclaration[];
	interfaces: InterfaceDeclaration[];
}
