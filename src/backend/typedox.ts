import * as ts from 'typescript';
import { Logger, logLevels } from './logger/Logger';
export const logger = new Logger();

import { DoxConfig } from './config/_namespace';
import {
	Branch,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
} from './projectStructure/_namespace';
import { TsWrapper } from './tsWrapper/_namespace';

import * as serialise from './serialiser/_namespace';
import * as config from './config/_namespace';
import * as tsc from './tsWrapper/_namespace';
import * as loggerUtils from './logger/_namespace';
import main from '.';

export default main;
export {
	logLevels,
	loggerUtils,
	serialise,
	config,
	tsc,
	DoxConfig,
	Branch,
	DoxProject,
	DoxPackage,
	DoxSourceFile,
	DoxDeclaration,
	DoxReference,
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

export type logLevelKeys = keyof typeof logLevels;
export type tsConfigFile = string;
export type referenceName = string;

export * from './projectStructure/_namespace';

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

export type doxPackagePrograms = [program: ts.Program, rootDir: string][];
export type doxPackageDefinitions = namedRegistry<doxPackagePrograms>;
