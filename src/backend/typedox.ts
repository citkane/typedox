import * as path from 'path';
export const nodePackage = {
	name: 'typedox',
	version: 'v0.0.0',
	packageRoot: path.join(__dirname, '../../'),
};
export const packages = [nodePackage];
export const tsEntryRefs: tsEntryDef[] = [
	'test/scenarios/namespace/tsconfig.json',
];

export type tsConfigFile = string;
export type referenceName = string;
export type tsEntryDef = tsConfigFile | [referenceName, tsConfigFile];

import * as ts from 'typescript';

import { SourceFile, Declaration } from './kinds/_namespace';
import Config from './Config';

export * as lib from './lib/_namespace';
export * as tree from './tree/_namespace';
export * as serialiser from './serialiser/_namespace';
export { logLevels } from './lib/_namespace';
export * from './kinds/_namespace';
export { default as Reference } from './kinds/Reference';
export { default as Config } from './Config';
export { default as Package } from './kinds/Package';

export type fileMap = Map<string, SourceFile>;
export type declarationMap = Map<string, Declaration>;

export type referencedExport =
	| ts.NamespaceExport
	| ts.ExportSpecifier
	| ts.ModuleDeclaration;

export type localDeclaration = ts.VariableDeclaration | ts.ClassDeclaration;
export type declaration = referencedExport | localDeclaration;

export type logableObjects = Declaration;

export type whatIsIt = Exclude<ts.Node | ts.Symbol | ts.Type, ts.SourceFile>;

export type nodePackages = ReturnType<(typeof Config)['getNodePackages']>;
export type nodePackage = nodePackages[0];
