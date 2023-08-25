import * as ts from 'typescript';

import { SourceFile, Declaration } from './kinds/_namespace';

export * as lib from './lib/_namespace';
export * as relationships from './relationships/_namespace';
export * as tree from './tree/_namespace';
export * as serialiser from './serialiser/_namespace';
export { log } from './lib/_namespace';
export * from './kinds/_namespace';
export { default as Package } from './kinds/Package';

export enum Kind {
	Unknown,
	Package,
	SourceFile,
	Declaration,
	NameSpaceExport,
	ExportSpecifier,
	ExportDeclaration,
	VariableDeclaration,
	ClassDeclaration,
}

export type fileMap = Map<string, SourceFile>;
export type declarationMap = Map<string, Declaration>;

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export type logableObjects = Declaration;
