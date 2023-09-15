import * as ts from 'typescript';
import * as path from 'path';

import { logger as log, config, logLevelKeys, tscRawConfig } from '../typedox';

export function resolveConstructorOverload(
	projectOrCheckerOrClArgs?: config.doxOptions | ts.TypeChecker | string[],
	checkerOrClArgs?: ts.TypeChecker | string[],
	argv = process.argv,
): [config.doxOptions | undefined, ts.TypeChecker | undefined, string[]] {
	if (!projectOrCheckerOrClArgs && !checkerOrClArgs)
		return [undefined, undefined, argv];

	const defaultOpts = config.getDefaultDoxOptions();
	delete defaultOpts.typedox;

	const arg0is = !projectOrCheckerOrClArgs
		? undefined
		: Array.isArray(projectOrCheckerOrClArgs)
		? 'argv'
		: isEqual(projectOrCheckerOrClArgs, defaultOpts)
		? 'project'
		: 'checker';

	const arg1is = !checkerOrClArgs
		? undefined
		: Array.isArray(checkerOrClArgs)
		? 'argv'
		: 'checker';

	log.debug({
		projectOrCheckerOrClArgs,
		checkerOrClArgs,
		argv,
		arg0is,
		arg1is,
	});

	if (!checkerOrClArgs)
		return !arg0is
			? [undefined, undefined, argv]
			: arg0is === 'argv'
			? [undefined, undefined, projectOrCheckerOrClArgs as string[]]
			: arg0is === 'project'
			? [projectOrCheckerOrClArgs as config.doxOptions, undefined, argv]
			: [undefined, projectOrCheckerOrClArgs as ts.TypeChecker, argv];

	return arg0is === 'project' && arg1is === 'argv'
		? [
				projectOrCheckerOrClArgs as config.doxOptions,
				undefined,
				checkerOrClArgs as string[],
		  ]
		: arg0is === 'checker' && arg1is === 'argv'
		? [
				undefined,
				projectOrCheckerOrClArgs as ts.TypeChecker,
				checkerOrClArgs as string[],
		  ]
		: [
				projectOrCheckerOrClArgs as config.doxOptions,
				checkerOrClArgs as ts.TypeChecker,
				argv,
		  ];

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
		mergeConfigReferences.bind(isRootInit),
		accumulator,
	);
	return tscRawConfigs;

	function mergeConfigReferences(
		this: boolean,
		accumulator: tscRawConfig[],
		fileName: string,
	) {
		const isInit = this;
		const rawConfig = makeRawTscConfigFromFile(fileName, isInit);

		accumulator.push(rawConfig);

		const references = discoverReferences(rawConfig);

		return references.length
			? findAllRawConfigs(references, ensureAbsPath, false, accumulator)
			: accumulator;
	}

	function discoverReferences(rawConfig: tscRawConfig) {
		const references = (rawConfig.config.references || [])
			.map(resolveReference)
			.filter((reference) => !!reference);

		return references as string[];
	}
	function resolveReference(reference: ts.ProjectReference) {
		const referencePath = ts.resolveProjectReferencePath(reference);
		!referencePath &&
			log.warn(
				log.identifier(__filename),
				'Did not resolve a reference:',
				reference.path,
			);
		return referencePath ? ensureAbsPath(referencePath) : undefined;
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

export const configurators = {
	projectRootDir: {
		validate: (value: string) => {
			return !!value && typeof value === 'string';
		},
		set: (doxOptions: config.doxOptions, value: string) => {
			doxOptions.projectRootDir = value;
		},
	},
	doxOut: {
		validate: (value: string) => {
			return !!value && typeof value === 'string';
		},
		set: (doxOptions: config.doxOptions, value: string) => {
			doxOptions.doxOut = value;
		},
	},
	typeDependencies: {
		validate: (value: string[]) => {
			return (
				Array.isArray(value) &&
				!value.find((value) => typeof value !== 'string')
			);
		},
		set: (doxOptions: config.doxOptions, value: string) => {
			doxOptions.typeDependencies ??= config.clone(
				config.doxArgs.typeDependencies.defaultValue,
			);
			!doxOptions.typeDependencies.includes(value) &&
				doxOptions.typeDependencies.push(value);
		},
	},
	logLevel: {
		validate: (value: logLevelKeys) => {
			return log.logLevelKeyStrings.includes(value);
		},
		set: (doxOptions: config.doxOptions, value: logLevelKeys) => {
			doxOptions.logLevel = value;
		},
	},
	tsConfigs: {
		validate: (value: string[] | undefined) => {
			return value === undefined
				? true
				: !Array.isArray(value)
				? false
				: !value.find((innerVal) => typeof innerVal !== 'string');
		},
		set: (doxOptions: config.doxOptions, value: string | undefined) => {
			const defaultValue = config.clone(
				config.doxArgs.tsConfigs.defaultValue,
			) as string[];

			doxOptions.tsConfigs ??= defaultValue;
			value === undefined
				? (doxOptions.tsConfigs = value)
				: !doxOptions.tsConfigs.includes(value)
				? doxOptions.tsConfigs.push(value)
				: null;
		},
	},
	npmFileConvention: {
		validate: (value: string) => {
			return typeof value === 'string' && value.split('.').length > 1;
		},
		set: (doxOptions: config.doxOptions, value: string) => {
			doxOptions.npmFileConvention = value;
		},
	},
	typedox: {
		validate: (value: string | undefined) => {
			return value === undefined
				? true
				: typeof value === 'string' && value.split('.').length > 1;
		},
		set: (doxOptions: config.doxOptions, value: string | undefined) => {
			doxOptions.typedox = value;
		},
	},
};
