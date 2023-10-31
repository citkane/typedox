import ts from 'typescript';
import { DoxConfig } from './config/_namespace.mjs';
import {
	DoxBranch,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
} from './projectStructure/_namespace.mjs';
import { DoxEvents } from './events/DoxEvents.mjs';
import { coreEventsApi } from './events/coreEventsApi.mjs';

import * as config from './config/_namespace.mjs';

export interface DeclarationFlags {
	isDefault?: boolean;
	scopeKeyword?: 'const' | 'let' | 'var';
	notExported?: true;
}
export enum DeclarationGroup {
	unknown,
	ReExport,
	Module,
	Variable,
	Function,
	Class,
	Enum,
	Type,
}
export {
	config,
	DoxBranch as Branch,
	DoxConfig,
	DoxDeclaration,
	DoxPackage,
	DoxProject,
	DoxReference,
	DoxSourceFile,
	DoxEvents,
	coreEventsApi,
};

export type tsConfigFile = string;
export type referenceName = string;

export * from './projectStructure/_namespace.mjs';

export type fileMap = Map<string, DoxSourceFile>;
export type declarationsMap = Map<string, DoxDeclaration>;

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export type logableObjects = DoxDeclaration;

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
