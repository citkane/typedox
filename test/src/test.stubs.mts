import ts from 'typescript';
import path from 'path';
import {
	DoxConfig,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
	config,
	tsItem,
} from '@typedox/core';

const globalLogLevel: logLevels | undefined = undefined; //logLevels.error;

/** The default project root directory (probably process.cwd()) */
const rootDir = config.doxArgs.projectRootDir.defaultValue;
const projectFactoryDir = path.join(rootDir, 'test/projectFactory');
const projectDir = (factory: factoryFolders) =>
	path.join(projectFactoryDir, factory);

const factoryFolders = [
	'common',
	'configs',
	'ems',
	'groups',
	'scopes',
	'specifiers',
	'overloading',
] as const;
type factoryFolders = (typeof factoryFolders)[number];

/** ensures a path is absolute above the rootDir when a relative path is given */
const ensureAbsPath = config.ensureAbsPath.bind(null, rootDir);
/** A string of five spaces */
const spacer = ' '.repeat(5);

const defaultDoxConfigPath = ensureAbsPath(config.doxArgs.typedox.defaultValue);
const configs = {
	/** As per the src definition, not test - usually process.cwd()/typedox.json */
	defaultDoxConfigPath,
	/** How many tsconfig.json files set up in the test scenario project chain */
	expectedConfigLength: 4,
};

export {
	configs,
	doxDeclaration,
	doxPackage,
	doxProject,
	doxReference,
	doxSourceFile,
	ensureAbsPath,
	projectDir,
	factoryFolders,
	getDeclaration,
	getExportedSymbol,
	globalLogLevel,
	projectFactoryDir,
	rootDir,
	spacer,
};

import { assert } from 'chai';
import { compilerFactory } from './factories/compilerFactory.mjs';
import { logLevels } from '@typedox/logger';
import wrapper, { TsWrapper } from '@typedox/wrapper';

function itExists(key: string, item: any, map: Map<string, any>) {
	assert.exists(
		item,
		`"${key}" does not exist in [\n${spacer}${spacer}${Array.from(
			map.keys(),
		).join(`\n${spacer}${spacer}`)}\n${spacer}]`,
	);
}
/** Extracts a doxDeclaration from the given key in a doxSourcefile. Errors with all available keys logged */
function getDeclaration(this: DoxSourceFile, key: string) {
	const declaration = this.declarationsMap.get(key);
	itExists(key, declaration, this.declarationsMap);
	return declaration;
}
/** Gets an exported ts.Symbol child from the given key. Errors with all available keys logged */
function getExportedSymbol(this: ts.Symbol, key: string) {
	const exports = this.exports!;
	const symbol = exports.get(key as any);
	itExists(key, symbol, exports as Map<string, ts.Symbol>);

	return symbol;
}

function doxReference(
	folder: factoryFolders,
	checker?: ts.TypeChecker,
	program?: ts.Program,
) {
	const { compiler } = compilerFactory(folder);
	if (!checker || !program) {
		({ checker, program } = compiler());
	}
	return new DoxReference(doxPackage(), 'testStubReference', program, []);
}
function doxProject(options = config.getDefaultDoxOptions()) {
	return {
		options: new DoxConfig(options).options,
	} as DoxProject;
}

function doxPackage() {
	return {
		name: 'testStubPackage',
		doxProject: doxProject(),
	} as DoxPackage;
}
function doxSourceFile(folder: factoryFolders) {
	const { compiler } = compilerFactory(folder);
	const { getFile, checker, program } = compiler();
	const sourceFile = getFile().sourceFile;
	const fileSymbol = getFile().sourceSymbol;
	const reference = doxReference(folder, checker, program);
	return new DoxSourceFile(reference, sourceFile!, fileSymbol);
}
function doxDeclaration(folder: factoryFolders, declaration: string) {
	const sourceFile = doxSourceFile(folder);
	const exportKeys = Array.from(sourceFile.fileSymbol.exports?.keys() || []);
	const symbol = getExportedSymbol.call(sourceFile.fileSymbol, declaration);
	if (!symbol)
		throw Error(
			`Declared symbol "${declaration}" not found in: ${JSON.stringify(
				exportKeys,
			)}`,
		);
	return new DoxDeclaration(sourceFile, symbol!);
}
const circularReplacer = '[circular]';
export function deepClone(item: any, seen = new Map<object, true>()) {
	if (typeof item !== 'object') return item;
	seen.set(item, true);
	const isArray = Array.isArray(item);

	return isArray
		? item.reduce(array, [] as string[])
		: Object.entries(item).reduce(
				objectReducer,
				{} as { [key: string]: any },
		  );

	function array(accumulator: any[], value: any) {
		seen.has(value)
			? accumulator.push(circularReplacer)
			: accumulator.push(deepClone(value, seen));

		return accumulator;
	}
	function objectReducer(
		accumulator: { [key: string]: any },
		tuple: [string, any],
	) {
		const [key, value] = tuple;
		accumulator[key] = seen.has(value)
			? circularReplacer
			: deepClone(value, seen);

		return accumulator;
	}
}
