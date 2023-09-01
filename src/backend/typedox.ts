import * as path from 'path';
export const npmPackageStub = {
	name: 'typedox',
	version: 'v0.0.0',
	packageRootDir: path.join(__dirname, '../../'),
};

export const doxOptionsStub = { tsOverrides: { options: { types: [] } } };
export const npmPackagesStub = [npmPackageStub];
export const tsEntryRefsStub: tsEntryDef[] = [
	'test/scenarios/testNamespaces/tsconfig.json',
];

export enum DeclarationKind {
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
export type tsEntryDef = tsConfigFile | [referenceName, tsConfigFile];

import * as ts from 'typescript';

import { TsSourceFile, TsDeclaration } from './projectStructure/_namespace';

export * as lib from './lib/_namespace';
export * as config from './config/_namespace';
export { TscWrapper } from './tscApi/TsWrapper';
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

export type whatIsIt = Exclude<ts.Node | ts.Symbol | ts.Type, ts.SourceFile>;

export type npmPackageDefs = typeof npmPackagesStub;
export type npmPackageDef = npmPackageDefs[0];
export type doxOptions = typeof doxOptionsStub;
