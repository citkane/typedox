import * as ts from 'typescript';
import { Logger, logLevels } from './logger/Logger';
export const logger = new Logger();

import { DoxConfig } from './config/_namespace';
import {
	Branch,
	DoxProject,
	NpmPackage,
	TsDeclaration,
	TsReference,
	TsSourceFile,
} from './projectStructure/_namespace';
import { TscWrapper } from './tscApiWrapper/_namespace';

import * as serialise from './serialiser/_namespace';
import * as config from './config/_namespace';
import * as tsc from './tscApiWrapper/_namespace';
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
	NpmPackage,
	TsSourceFile,
	TsDeclaration,
	TsReference,
	TscWrapper,
};

/**
 * An enumerator for dox groups used to categorise `tsDeclarations`.
 */
export enum DeclarationGroup {
	unknown,
	//ExportStar,
	ReExport,
	Module,
	Variable,
	Function,
	Class,
	Enum,
	Type,
	Default,
}

export type logLevelKeys = keyof typeof logLevels;
export type tsConfigFile = string;
export type referenceName = string;

export * from './projectStructure/_namespace';

export type fileMap = Map<string, TsSourceFile>;
export type declarationMap = Map<string, TsDeclaration>;

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export type logableObjects = TsDeclaration;

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

export type npmPackagePrograms = [program: ts.Program, rootDir: string][];
export type npmPackageDefinitions = namedRegistry<npmPackagePrograms>;

export namespace foo {
	const bar = 'foo';
}
