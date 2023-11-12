import ts from 'typescript';

export interface DeclarationFlags {
	isDefault?: true;
	isExternal?: true;
	isReExporter?: true;
	reExported?: true;
	notExported?: true;
	scopeKeyword?: 'const' | 'let' | 'var';
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
	menuHeader,
	unknown,
}

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export type tsItem = ts.Node | ts.Symbol;

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

export type namedDef<def> = [string | undefined, def];
export type namedRegistry<reg> = Record<string, reg>;

export { Dox } from './Dox.mjs';
export { DoxBranch } from './DoxBranch.mjs';
export { DoxDeclaration } from './DoxDeclaration.mjs';
export { DoxPackage } from './DoxPackage.mjs';
export { DoxProject } from './DoxProject.mjs';
export { DoxReference } from './DoxReference.mjs';
export { DoxSourceFile } from './DoxSourceFile.mjs';
export * from './events/_index.mjs';
export * as config from './config/_namespace.mjs';
export * as declarationUtils from './declarationUtils/_index.mjs';
