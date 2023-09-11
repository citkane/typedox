import * as path from 'path';
import * as ts from 'typescript';
import {
	TsSourceFile,
	TsDeclaration,
	TsReference,
} from './projectStructure/_namespace';
import { Logger } from './logger/Logger';

export const logger = new Logger();

/**
 * An enumerator for dox groups used to categorise `tsDeclarations`.
 */
export enum DeclarationGroup {
	unknown,
	ExportStar,
	Module,
	Variable,
	Function,
	Class,
	Enum,
}
export type tsConfigFile = string;
export type referenceName = string;

export { DoxConfig } from './config/_namespace';
export { DoxProject } from './projectStructure/DoxProject';
export { TscWrapper } from './tscApiWrapper/TsWrapper';
export * from './projectStructure/_namespace';
export * as serialise from './serialiser/_namespace';
export * as config from './config/_namespace';
export * as tsc from './tscApiWrapper/_namespace';

export type fileMap = Map<string, TsSourceFile>;
export type declarationMap = Map<string, TsDeclaration>;

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export type logableObjects = TsDeclaration;

export type whatIsIt = Exclude<ts.Node | ts.Symbol | ts.Type, ts.SourceFile>;

export interface rawDox {
	fileName: string;
	init: boolean;
	rootDir: string;
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

export type npmPackageDefinition = [program: ts.Program, rootDir: string][];
export type npmPackageDefinitions = namedRegistry<npmPackageDefinition>;

export namespace foo {
	const bar = 'foo';
}
