import ts from 'typescript';
import { coreEventsApi } from './index.mjs';
import { DoxEvents } from './events/DoxEvents.mjs';

export const events = new DoxEvents<coreEventsApi>(coreEventsApi);

export interface DeclarationFlags {
	isDefault?: true;
	isExternal?: true;
	isReExporter?: true;
	reExported?: true;
	notExported?: true;
	scopeKeyword?: 'const' | 'let' | 'var';
	type?: ts.TypeFlags | string;
}
export enum CategoryKind {
	Project,
	Package,
	Reference,
	Namespace,
	Class,
	Function,
	Variable,
	Enum,
	Type,
	Export,
	menuHeader,
	unknown,
}

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export interface rawDox {
	init: boolean;
	rootDir: string;
	fileName: string;
	filePath: string;
}
export interface tscRawConfig {
	dox: rawDox;
	config: {
		extends?: string;
		references?: ts.ProjectReference[];
		compilerOptions?: ts.CompilerOptions;
		exclude: string[];
		include: string[];
	};
	error?: ts.Diagnostic;
}
export interface DoxLocation {
	query: string;
	hash: string;
}
export type namedDef<def> = [string | undefined, def];
export type namedRegistry<reg> = Record<string, reg>;

export { Dox } from './Dox.mjs';
export { DoxDeclaration } from './DoxDeclaration.mjs';
export { DoxPackage } from './DoxPackage.mjs';
export { DoxProject } from './DoxProject.mjs';
export { DoxReference } from './DoxReference.mjs';
export { DoxSourceFile } from './DoxSourceFile.mjs';
export * from './events/_index.mjs';
export * as config from './config/_namespace.mjs';
export * as declarationUtils from './declarationUtils/_index.mjs';
