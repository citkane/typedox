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
import { TsWrapper } from './tsWrapper/_namespace.mjs';

import * as serialiser from './serialiser/_namespace.mjs';
import * as config from './config/_namespace.mjs';
import * as tsc from './tsWrapper/_namespace.mjs';
import * as events from './events/_namespace.mjs';
import main, { isRequestForHelp, logApplicationHelp } from './index.mjs';

export default main;
export {
	isRequestForHelp,
	logApplicationHelp,
	config,
	DoxBranch as Branch,
	DoxConfig,
	DoxDeclaration,
	DoxPackage,
	DoxProject,
	DoxReference,
	DoxSourceFile,
	events,
	serialiser,
	tsc,
	TsWrapper,
};

/**
 * An enumerator for dox groups used to categorise `doxDeclarations`.
 */
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

type comment = { comment: string };
type tag = { tag: any };
export type jsDocCollection = (comment | tag)[];

export interface DeclarationFlags {
	isDefault?: boolean;
	scopeKeyword?: 'const' | 'let' | 'var';
	notExported?: true;
}
export interface DeclarationLocation {
	query: string;
	hash: string;
}
export interface DeclarationType {
	kind: string;
	name: string;
	id?: number;
	valueString?: string;
}

export interface DeclarationSerialised {
	id: number;
	name: string;
	group: DeclarationGroup;
	flags: DeclarationFlags;
	location: DeclarationLocation;
	type: DeclarationType;
	jsDoc: jsDocCollection | undefined;
	valueString?: string;
}

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
export type programsInPackage = [program: ts.Program, rootDir: string][];
