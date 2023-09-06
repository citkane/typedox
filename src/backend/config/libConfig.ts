import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import * as args from './libArgs';
import * as opts from './libOpts';
import * as api from './projectConfigApi';
import { logger as log, config, tscRawConfig } from '../typedox';

/** get a handle for future jsconfig fun */
export const tsFileSpecifier = 'tsconfig';

export function fileExists(filepath: string) {
	if (!fs.existsSync(filepath)) {
		log.error(log.identifier(__filename), 'File not found:', filepath);
		return false;
	}
	return true;
}
export function jsonFileToObject(absFilepath: string) {
	if (!fileExists(absFilepath)) return;

	const sourceFile = ts.readJsonConfigFile(absFilepath, ts.sys.readFile);
	const object = ts.convertToObject(sourceFile, []);

	return object;

	/*
	const source = ts.sys.readFile(absFilepath);
	log.info(source);
	let text = ts.transpile(source!, {
		resolveJsonModule: true,
		removeComments: true,
	});
	log.info(text);
	text = text
		.replace(/}\n(\s)*([",\[,{]])/g, '},$2')
		.replace(/;(\s)*}[\n,$]/g, '}')
		.replace(/([",\[,{]);\n/g, '$1:')
		.replace(/,\n(\s)*}}(\s)*$/g, '}}');

	log.info(text);
	return JSON.parse(text);
	*/

	return {};
}

export function getDoxOut(this: config.ProjectConfig) {
	const doxout = this.projectConfig.doxOut;
	return path.isAbsolute(doxout)
		? doxout
		: path.join(this.projectRootDir, doxout);
}

let _getTsConfigsCache: string[];
export function getTsConfigFilePaths(this: config.ProjectConfig) {
	if (_getTsConfigsCache) return _getTsConfigsCache;
	const { projectConfig } = this;
	const { tsConfigs } = projectConfig;

	const configs: string[] = [];
	this.clProject
		? configs.push(ensureAbsPath(this.projectRootDir, this.clProject))
		: this.entryConfig
		? configs.push(ensureAbsPath(this.projectRootDir, this.entryConfig))
		: tsConfigs.length
		? tsConfigs
				.map((file) => ensureAbsPath(this.projectRootDir, file))
				.forEach((file) => configs.push(file))
		: [];

	_getTsConfigsCache = configs;
	return configs;
}
export function ensureAbsPath(rootDir: string, location: string) {
	const isAbsolute = path.isAbsolute(location);
	if (!isAbsolute) location = path.join(rootDir, location);
	const isFile = location.endsWith('.json');
	if (!isFile) location = path.join(location, `${tsFileSpecifier}.json`);

	return location;
}

export function initTsconfigPathToConfig(
	this: config.ProjectConfig,
	relPath: string,
) {
	const clConfig = this.tscCommandlineConfig;
	const isInit = this.clProject || this.entryConfig;
	const rawConfig = pathToRawTsConfig.call(this, relPath);
	isInit &&
		(rawConfig.config.compilerOptions = {
			...rawConfig.config.compilerOptions,
			...clConfig.options,
		});

	return rawConfig;
}

export function pathToRawTsConfig(
	this: config.ProjectConfig,
	filepath: string,
) {
	filepath = ensureAbsPath(this.projectRootDir, filepath);
	jsonFileToObject(filepath);
	const rawConfig = ts.readConfigFile(
		filepath,
		ts.sys.readFile,
	) as tscRawConfig;
	rawConfig.config.compilerOptions.types = this.dependTypes;
	rawConfig.filepathAbs = filepath;

	return rawConfig;
}

export function discoverTscRawConfigs(
	this: config.ProjectConfig,
	newConfigs: tscRawConfig[],
	accumulator: tscRawConfig[] = [],
): tscRawConfig[] {
	return newConfigs
		.reduce(discover.bind(this), accumulator)
		.reduce(deDupe, [] as tscRawConfig[]);

	function discover(
		this: config.ProjectConfig,
		accumulator: tscRawConfig[],
		currentConfig: tscRawConfig,
	) {
		accumulator.push(currentConfig);
		const newReferences = currentConfig.config.references?.map(
			(reference) => pathToRawTsConfig.call(this, reference.path),
		);
		newReferences &&
			discoverTscRawConfigs.call(this, newReferences, accumulator);

		return accumulator;
	}
	function deDupe(accumulator: tscRawConfig[], currentConfig: tscRawConfig) {
		!accumulator.find(
			(config) => config.filepathAbs === currentConfig.filepathAbs,
		) && accumulator.push(currentConfig);

		return accumulator;
	}
}

export function getDoxConfigFromCommandLine<Args extends args.doxArgsType>(
	doxArgs: args.doxArgs<Args>,
) {
	const doxClArgs = args.getDoxClArgs<Args>(doxArgs);
	const doxConfig = opts.getDoxClOptions<Args>(
		doxArgs,
		doxClArgs,
		{} as opts.doxOptions<Args>,
	);
	return doxConfig;
}

export function getDoxConfigFromFile(coreArgs: api.confApi) {
	const optionsFile = args.getDoxConfigFilepathFromClArgs(coreArgs);
	let fileOptions = {} as opts.doxOptions<api.confApi>;

	if (!fileExists(optionsFile)) return { fileOptions, optionsFile };

	fileOptions = jsonFileToObject(optionsFile) as opts.doxOptions<api.confApi>;

	return { fileOptions, optionsFile };
}

export function auditConfigFileOptions(
	fileOptions: opts.doxOptions<api.confApi>,
	optionsFile: string,
	coreArgs: api.confApi,
) {
	Object.keys(fileOptions).forEach(parseKey);
	return fileOptions;

	function parseKey(key: string) {
		const doesNotExist = !(key in coreArgs);
		if (doesNotExist)
			return (
				warning(key, coreArgs, optionsFile) && delete fileOptions[key]
			);

		const value = fileOptions[key];
		const defaultValue = coreArgs[key].defaultValue;
		const valueGiven = typeof defaultValue === 'boolean' || value;
		const correctValueType =
			areBothArrays(defaultValue, value) ||
			typeof defaultValue === typeof value;

		!valueGiven && delete fileOptions[key];
		!correctValueType &&
			warning(key, coreArgs, optionsFile, true) &&
			delete fileOptions[key];
	}
}

function areBothArrays(defaultValue: object, value: object) {
	return Array.isArray(defaultValue) && Array.isArray(value);
}
function warning(
	key: string,
	coreArgs: api.confApi,
	optionsFile: string,
	isType: boolean = false,
) {
	log.warn(
		log.identifier(__filename),
		`Invalid option ${isType ? 'type ' : ''}found in ${optionsFile}:`,
		key,
	);
	log.log('Allowed Options:', Object.keys(coreArgs));
	return true;
}

/*
function getClProject(this: config.ProjectConfig, clProject: string) {
	clProject = ensureAbsPath(this.projectRootDir, clProject)!;
	const config = {
		...readTsConfigFromFile(clProject),
		...this.tscCommandlineConfig,
	};

	const doxSpecifiesTsConfig = !!this.projectConfig.tsConfigs.length;
	doxSpecifiesTsConfig && adviseUserOfOverride(this.projectConfig, clProject);

	return config;
}


function adviseUserOfOverride(
	projectConfig: config.ProjectConfig['projectConfig'],
	clProject: string,
) {
	log.info(
		log.identifier(config.ProjectConfig),
		'Tsc command line project overrode dox options:',
		{
			tsc: clProject,
			dox: projectConfig.tsConfigs,
		},
	);
}
function toDirName(this: config.ProjectConfig, tsconfig: string) {
	return path.dirname(tsconfig);
}
function findParentPackage(
	this: config.ProjectConfig,
	dir: string,
): string | undefined {
	const npmPackage = path.join(dir, this.npmFileConvention);
	return fs.existsSync(npmPackage)
		? npmPackage
		: dir === this.projectRootDir
		? undefined
		: findParentPackage.call(this, path.join(dir, '../'));
}
*/
