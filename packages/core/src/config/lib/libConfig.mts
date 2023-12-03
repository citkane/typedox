import ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

import { config, tscRawConfig } from '../../index.mjs';
import { log } from '@typedox/logger';

const __filename = log.getFilename(import.meta.url);

export function makeParsedConfig(
	existingOptions: ts.CompilerOptions,
	tscRawConfig: tscRawConfig,
) {
	let { rootDir, filePath } = tscRawConfig.dox;

	const parsedConfig = ts.parseJsonConfigFileContent(
		tscRawConfig.config,
		ts.sys,
		rootDir,
		existingOptions,
		filePath,
	) as ts.ParsedCommandLine;

	return parsedConfig;
}
export function makeParsedConfigs(
	tscRawConfigs: tscRawConfig[],
	existingOptions: ts.CompilerOptions,
) {
	const parsedConfigs = tscRawConfigs.map((config) =>
		makeParsedConfig(existingOptions, config),
	);

	return parsedConfigs as ts.ParsedCommandLine[];
}

export function findAllRawConfigs(
	configFilePaths: string[],
	ensureAbsPath: (path: string) => string,
	isRootInit: boolean,
	accumulator: tscRawConfig[] = [],
): tscRawConfig[] {
	const seen: string[] = [];
	const tscRawConfigs = configFilePaths
		.reduce(mergeConfigReferences.bind(null, isRootInit), accumulator)
		.filter((config) => {
			if (seen.includes(config.dox.filePath)) return false;
			seen.push(config.dox.filePath);
			return true;
		});
	return tscRawConfigs;

	function mergeConfigReferences(
		isInit: boolean,
		accumulator: tscRawConfig[],
		fileName: string,
	) {
		const rawConfig = makeRawTscConfigFromFile(fileName, isInit);

		accumulator.push(rawConfig);

		const references = discoverReferences(rawConfig);

		return references.length
			? findAllRawConfigs(references, ensureAbsPath, false, accumulator)
			: accumulator;
	}
}
export function discoverReferences(rawConfig: tscRawConfig) {
	if (!rawConfig.config.references) return [];

	const references = rawConfig.config.references
		.map(resolveReference)
		.filter((reference) => !!reference);

	return references as string[];

	function resolveReference(reference: ts.ProjectReference) {
		const { rootDir } = rawConfig.dox;
		let referencePath = ts.resolveProjectReferencePath(reference);

		(referencePath as string) = ensureAbsPath(rootDir, referencePath);
		if (!referencePath || !fs.existsSync(referencePath))
			return notices.discoverReferences(reference);

		return referencePath;
	}
}

export function makeRawTscConfigFromFile(filePath: string, init: boolean) {
	const rootDir = path.dirname(filePath);
	const rawConfig = readTscConfigFile(filePath) as tscRawConfig;
	const fileName = path.basename(filePath);

	rawConfig.dox = {
		init,
		rootDir,
		fileName,
		filePath,
	};

	return rawConfig;

	function readTscConfigFile(configPath: string) {
		return ts.readConfigFile(configPath, ts.sys.readFile) as tscRawConfig;
	}
}
/*
export function getDoxFilepathFromArgs(
	doxClArgsAndValues = config.getClArgs().doxClArgs,
	doxArgs = config.doxArgs,
) {
	let { typedox, projectRootDir } = config.parseDoxClArgsToOptions(
		doxClArgsAndValues,
		doxArgs,
	);

	typedox ??= doxArgs.typedox.defaultValue;
	projectRootDir ??= doxArgs.projectRootDir.defaultValue;
	const absDox = typedox && path.isAbsolute(typedox);

	if (absDox && !typedox.startsWith(projectRootDir))
		log.throwError(
			log.identifier(__filename),
			'typedox.json must exist under the project root directory',
		);

	return absDox ? typedox : path.join(projectRootDir, typedox);
}
*/
/*

*/
export function deepFreeze(item: any, seen = new Set<object>()) {
	if (typeof item !== 'object' || seen.has(item)) return item;
	seen.add(item);
	Object.freeze(item);
	Array.isArray(item)
		? item.forEach((child) => deepFreeze(child, seen))
		: Object.values(item).forEach((value) => deepFreeze(value, seen));

	return item;
}
export function clone<T = object>(object: any) {
	if (typeof object !== 'object') return object;
	if (Array.isArray(object)) return [...object] as T;
	return { ...object } as T;
}

export function jsonFileToObject(
	absFilepath: string,
): Record<any, any> & any[] {
	ensureFileExists(absFilepath);
	const sourceFile = ts.readJsonConfigFile(absFilepath, ts.sys.readFile);
	const diagnostics: ts.Diagnostic[] = [];
	const object = ts.convertToObject(sourceFile, diagnostics);
	diagnostics.forEach((diagnostic) =>
		log.warn(log.identifier(__filename), diagnostic.messageText),
	);

	return object;
}
export function ensureFileExists(filepath: string) {
	if (!fs.existsSync(filepath)) {
		log.throwError(log.identifier(__filename), 'File not found:', filepath);
	}
	return filepath;
}
export function ensureAbsPath(rootDir: string, location: string) {
	if (path.isAbsolute(location)) return location;
	return path.join(rootDir, location);
}

const notices = {
	discoverReferences: (reference: ts.ProjectReference) =>
		log.warn(
			log.identifier(__filename),
			'Did not resolve a reference:',
			reference.path,
		),
};
