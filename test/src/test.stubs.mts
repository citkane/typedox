import ts, { __String } from 'typescript';
import path from 'path';
import {
	DoxConfig,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
	config,
} from '@typedox/core';

const globalLogLevel: logLevels | undefined = undefined; //logLevels.error;
const escape = ts.escapeLeadingUnderscores;
const doxArgs = new config.CoreArgsApi();

const rootDir = path.join(process.cwd(), doxArgs.projectRootDir.defaultValue);
const projectFactoryDir = path.join(rootDir, 'test/projectFactory');
const projectDir = (factory: factoryFolders) =>
	path.join(projectFactoryDir, factory);

const factoryFolders = [
	'common',
	'configs',
	'ems',
	'categories',
	'scopes',
	'specifiers',
	'overloading',
] as const;
type factoryFolders = (typeof factoryFolders)[number];

/** ensures a path is absolute above the rootDir when a relative path is given */
const ensureAbsPath = config.ensureAbsPath.bind(null, rootDir);
/** A string of five spaces */
const spacer = ' '.repeat(5);

const defaultDoxConfigPath = ensureAbsPath(doxArgs.typedox.defaultValue);
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
import { log, logLevels } from '@typedox/logger';

function itExists(key: __String, item: any, map: Map<__String, any>) {
	assert.exists(
		item,
		`"${key}" does not exist in [\n${spacer}${spacer}${Array.from(
			map.keys(),
		).join(`\n${spacer}${spacer}`)}\n${spacer}]`,
	);
}
/** Extracts a doxDeclaration from the given key in a doxSourcefile. Errors with all available keys logged */
function getDeclaration(this: DoxSourceFile, key: __String) {
	const declaration = this.declarationsMap.get(key);
	itExists(key, declaration, this.declarationsMap);
	return declaration;
}
/** Gets an exported ts.Symbol child from the given key. Errors with all available keys logged */
function getExportedSymbol(this: ts.Symbol, key: __String) {
	const exports = this.exports!;
	const symbol = exports.get(key as any);

	itExists(key, symbol, exports);

	return symbol;
}

function doxReference(
	folder: factoryFolders,
	checker?: ts.TypeChecker,
	parsedConfig?: ts.ParsedCommandLine,
) {
	const { compiler } = compilerFactory(folder);
	if (!checker || !parsedConfig) {
		({ checker, parsedConfig } = compiler());
	}
	return new DoxReference(
		doxPackage(),
		'testStubReference',
		parsedConfig,
		1,
		0,
	);
}
function doxProject(options = config.getDefaultDoxOptions(doxArgs)) {
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
	const { getFile, checker, parsedConfig } = compiler();
	const sourceFile = getFile().sourceFile;
	const fileSymbol = getFile().sourceSymbol;
	const reference = doxReference(folder, checker, parsedConfig);
	return new DoxSourceFile(reference, sourceFile!);
}
function doxDeclaration(folder: factoryFolders, declarationName: __String) {
	const sourceFile = doxSourceFile(folder);
	const exportKeys = Array.from(sourceFile.fileSymbol?.exports?.keys() || []);
	const symbol = getExportedSymbol.call(
		sourceFile.fileSymbol,
		declarationName,
	);
	if (!symbol)
		throw Error(
			`Declared symbol "${declarationName}" not found in: ${JSON.stringify(
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
