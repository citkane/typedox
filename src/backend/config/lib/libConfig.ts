import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

import {
	logger as log,
	config,
	logLevelKeys,
	tscRawConfig,
	DoxConfig,
} from '../../typedox';

export function resolveConstructorOverload(
	projectOrCheckerOrClArgs?: config.doxOptions | ts.TypeChecker | string[],
	checkerOrClArgs?: ts.TypeChecker | string[],
	argv = process.argv,
): [config.doxOptions | undefined, ts.TypeChecker | undefined, string[]] {
	const arg0is = whatIs(projectOrCheckerOrClArgs);
	const arg1is = whatIs(checkerOrClArgs);

	return [getIndexValue(0), getIndexValue(1), getIndexValue(2)] as any;

	function getIndexValue(index: 0 | 1 | 2) {
		const positions = {
			project: 0,
			checker: 1,
			argv: 2,
		};
		return arg0is && positions[arg0is] === index
			? projectOrCheckerOrClArgs
			: index === 0
			? undefined
			: arg1is && positions[arg1is] === index
			? checkerOrClArgs
			: index === 1
			? undefined
			: argv;
	}

	function whatIs(object: any) {
		const defaultOpts = config.getDefaultDoxOptions();
		return !object
			? undefined
			: Array.isArray(object)
			? 'argv'
			: isEqual(object, defaultOpts)
			? 'project'
			: 'checker';
	}
	function isEqual(value: any, value2: any) {
		const keys = Object.keys(value);
		const keys2 = Object.keys(value2);

		return (
			keys.length === keys2.length &&
			keys.every((key) => keys2.includes(key))
		);
	}
}
export function makeParsedConfig(
	dependTypes: string[],
	existingOptions: ts.CompilerOptions,
	tscRawConfig: tscRawConfig,
) {
	const { rootDir, fileName } = tscRawConfig.dox;
	const { compilerOptions } = tscRawConfig.config;
	compilerOptions && (compilerOptions.types = dependTypes);

	const parsedConfig = ts.parseJsonConfigFileContent(
		tscRawConfig.config,
		ts.sys,
		rootDir,
		existingOptions,
		fileName,
	) as ts.ParsedCommandLine;

	return parsedConfig;
}
export function makeParsedConfigs(
	tscRawConfigs: tscRawConfig[],
	dependTypes: string[],
	existingOptions: ts.CompilerOptions,
) {
	const parseConfig = makeParsedConfig.bind(
		null,
		dependTypes,
		existingOptions,
	);
	const parsedConfigs = tscRawConfigs.map(parseConfig);

	return parsedConfigs;
}

export function findAllRawConfigs(
	configFilePaths: string[],
	ensureAbsPath: (path: string) => string,
	isRootInit: boolean,
	accumulator: tscRawConfig[] = [],
): tscRawConfig[] {
	const tscRawConfigs = configFilePaths.reduce(
		mergeConfigReferences.bind(null, isRootInit),
		accumulator,
	);
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

export function makeRawTscConfigFromFile(fileName: string, init: boolean) {
	const rootDir = path.dirname(fileName);
	const rawConfig = readTscConfigFile(fileName) as tscRawConfig;

	rawConfig.dox = {
		fileName,
		init,
		rootDir,
	};

	return rawConfig;

	function readTscConfigFile(configPath: string) {
		return ts.readConfigFile(configPath, ts.sys.readFile) as tscRawConfig;
	}
}

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
export function parseDoxClArgsToOptions(
	doxClArgsAndValues = config.getClArgs().doxClArgs,
	doxArgs = config.doxArgs,
) {
	const doxOptions = {} as config.doxOptions;
	if (!doxClArgsAndValues.length) return doxOptions;

	type argKey = keyof config.doxArgs;
	type hyphenatedArgKey = `--${string}`;

	const hyphenatedKeys = config.getHyphenatedArgKeys(doxArgs);
	let subjectDoxArg: argKey;

	doxClArgsAndValues.forEach((currentArgOrValue, index) => {
		const isCurrentlyKey = hyphenatedKeys.includes(currentArgOrValue);

		subjectDoxArg = isCurrentlyKey
			? (config.unHyphenateArg(
					currentArgOrValue as hyphenatedArgKey,
			  ) as argKey)
			: subjectDoxArg;

		const defaultArgValue = config.clone(
			doxArgs[subjectDoxArg].defaultValue,
		);
		const set = doxArgs[subjectDoxArg].set;
		const adopt = adoptOrphan.bind(
			null,
			defaultArgValue,
			doxArgs[subjectDoxArg].set,
		);

		const adopted = isCurrentlyKey && lookForOrphanOption(index, adopt);
		!adopted &&
			!isCurrentlyKey &&
			set(doxOptions, currentArgOrValue as any);
	});
	function adoptOrphan(
		defaultValue: any,
		set: config.doxArg<any, any>['set'],
	) {
		typeof defaultValue === 'boolean' && set(doxOptions, true as any);
	}
	function lookForOrphanOption(index: number, adopt: () => void) {
		const parent = doxClArgsAndValues[index + 1];
		const isOrphan = !parent || parent.startsWith(config.argHyphen);
		isOrphan && adopt();

		return isOrphan;
	}

	return doxOptions;
}
export function deepFreeze(item: any, seen = new Map<object, true>()) {
	if (typeof item !== 'object' || seen.has(item)) return item;
	seen.set(item, true);
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

export function jsonFileToObject(absFilepath: string) {
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
