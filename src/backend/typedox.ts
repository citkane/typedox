import * as path from 'path';
import * as ts from 'typescript';
import { TsSourceFile, TsDeclaration } from './projectStructure/_namespace';
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

export { DoxProject } from './projectStructure/DoxProject';
export { default as DoxContext } from './projectStructure/DoxContext';
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

export const npmPackageStub = {
	name: 'typedox',
	version: 'v0.0.0',
	packageRootDir: path.join(__dirname, '../../'),
};

export type npmPackageMap = Record<string, npmPackageInfo>;
export interface npmPackageInfo {
	name: string;
	version: string;
	packageRootDir: string;
	tscRawConfigs: tscRawConfig[];
}
export const npmPackagesStub = [npmPackageStub];
export type npmPackageDefs = typeof npmPackagesStub;
export type npmPackageDef = npmPackageDefs[0];

export type tscRawConfig = {
	filepathAbs: string;
	config: {
		extends?: string;
		references?: ts.ProjectReference[];
		compilerOptions: ts.CompilerOptions;
	};
	error?: ts.Diagnostic;
};
export interface tscParsedConfig extends ts.ParsedCommandLine {
	rootDir: string;
	rootName: string;
}
