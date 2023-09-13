import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';

import {
	logger as log,
	tscRawConfig,
	config,
	TscWrapper,
	tsItem,
	serialise,
	DoxProject,
	NpmPackage,
	TsReference,
	tsc,
	projectOptions,
} from '../typedox';
import { appConfApi } from './doxConfigApi';

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';

let _tscCommandlineConfig: ts.ParsedCommandLine;
let _clProject: string[] | undefined;
let _customProject: string[] | undefined;
let _entryProject: string[];
let _tscRawConfigs: tscRawConfig[];
let _tscParsedConfigs: ts.ParsedCommandLine[];
let _projectOptions: projectOptions;

export class DoxConfig {
	public checker?: ts.TypeChecker;

	constructor(checker?: ts.TypeChecker);
	constructor(projectOptions: projectOptions, checker?: ts.TypeChecker);
	constructor(
		projectOrChecker?: projectOptions | ts.TypeChecker,
		optionalChecker?: ts.TypeChecker,
	) {
		const [projectOptions, checker] = resolveConstructorOverload(
			projectOrChecker,
			optionalChecker,
		);
		this.checker = checker;

		_projectOptions ??= projectOptions! as projectOptions;
		_tscCommandlineConfig = _tscCommandlineConfig ??=
			config.getTscParsedCommandline();

		_clProject ??= this._clProject();
		_customProject ??= this._customProject();
		_entryProject ??= this._entryProject();
		_tscRawConfigs ??= this._tscRawConfigs();
		_tscParsedConfigs ??= this._tscParsedConfigs();

		if (!_projectOptions)
			log.throwError(
				log.identifier(__filename),
				'must be initiated with project options.',
			);
	}

	public get options() {
		return {
			projectRootDir: this.projectRootDir,
			doxout: this.doxOut,
			dependTypes: this.dependTypes,
			logLevel: this.logLevel,
			npmFileConvention: this.npmFileConvention,
			tsConfigs: this.tsConfigs,
		};
	}

	public get toObject() {
		const constructor = this.constructor.name;
		const self = this as unknown;
		return constructor === 'DoxProject'
			? serialise.serialiseProject(self as DoxProject)
			: constructor === 'NpmPackage'
			? serialise.serialiseNpmPackage(self as NpmPackage)
			: constructor === 'TsReference'
			? serialise.serialiseTsReference(self as TsReference)
			: log.error(
					log.identifier(__filename),
					'Call made to unknown serialiser:',
					constructor,
			  );
	}

	protected get tscParsedConfigs() {
		return _tscParsedConfigs;
	}

	private get projectRootDir() {
		return path.resolve(_projectOptions.projectRootDir!);
	}
	private get doxOut() {
		return DoxConfig.ensureAbsPath(
			this.projectRootDir,
			_projectOptions.doxOut!,
		);
	}
	private get dependTypes() {
		return _projectOptions.typeDependencies || [];
	}
	private get logLevel() {
		return log.logLevels[_projectOptions.logLevel!];
	}
	private get npmFileConvention() {
		return _projectOptions.npmFileConvention!;
	}
	private get tsConfigs() {
		return _clProject
			? _clProject
			: _customProject?.length
			? _customProject
			: _entryProject;
	}

	public isSpecifierKind = (kind: ts.SyntaxKind) => {
		const {
			NamespaceExport,
			NamespaceImport,
			ModuleDeclaration,
			ExportDeclaration,
			ExportSpecifier,
			ExportAssignment,
			ImportClause,
			ImportSpecifier,
		} = ts.SyntaxKind;
		const specifiers = [
			NamespaceExport,
			NamespaceImport,
			ModuleDeclaration,
			ExportDeclaration,
			ExportSpecifier,
			ExportAssignment,
			ImportClause,
			ImportSpecifier,
		];

		return specifiers.includes(kind);
	};

	protected tsWrap = (item: tsItem): TscWrapper => {
		!this.checker && notices.tsWrap.throw(log.stackTracer);
		return tsc.wrap(this.checker!, item);
	};

	private get tscCommandLineOptions() {
		const clOptions = {
			..._tscCommandlineConfig.options,
		} as ts.CompilerOptions;
		clOptions.types = this.dependTypes;
		return clOptions;
	}
	private _clProject = () => {
		let project = this.tscCommandLineOptions.project;
		const def = project
			? [DoxConfig.ensureAbsPath(this.projectRootDir, project)]
			: undefined;

		return def;
	};
	private _customProject = () => {
		return _projectOptions.tsConfigs?.map((fileName) =>
			DoxConfig.ensureAbsPath(this.projectRootDir, fileName),
		);
	};
	private _entryProject = () => {
		return [ts.findConfigFile(this.projectRootDir, ts.sys.fileExists)!];
	};
	private _tscRawConfigs = (): tscRawConfig[] => {
		const isRootInit = !!_entryProject || !!_clProject;
		const rawConfigs = findAllRawConfigs(
			this.tsConfigs,
			DoxConfig.ensureAbsPath.bind(null, this.projectRootDir),
			isRootInit,
		);
		return rawConfigs;
	};
	private _tscParsedConfigs = () => {
		const isRootLevel = _entryProject || _clProject;
		const existingOptions = isRootLevel ? this.tscCommandLineOptions : {};

		const parsedConfigs = makeParsedConfigs(
			_tscRawConfigs,
			this.dependTypes,
			existingOptions,
		);

		return parsedConfigs;
	};

	public static jsonFileToObject(absFilepath: string) {
		DoxConfig.ensureFileExists(absFilepath);
		const sourceFile = ts.readJsonConfigFile(absFilepath, ts.sys.readFile);
		const diagnostics: ts.Diagnostic[] = [];
		const object = ts.convertToObject(sourceFile, diagnostics);
		diagnostics.forEach((diagnostic) =>
			log.warn(log.identifier(__filename), diagnostic.messageText),
		);

		return object;
	}
	public static ensureFileExists(filepath: string) {
		if (!fs.existsSync(filepath)) {
			log.throwError(
				log.identifier(__filename),
				'File not found:',
				filepath,
			);
		}
	}
	public static ensureAbsPath(rootDir: string, location: string) {
		if (path.isAbsolute(location)) return location;
		return path.join(rootDir, location);
	}
}
function resolveConstructorOverload(
	optionsOrChecker: any,
	checker: any,
): [projectOptions | undefined, ts.TypeChecker | undefined] {
	if (!optionsOrChecker && !checker) return [undefined, undefined];
	if (optionsOrChecker && checker)
		return [optionsOrChecker as projectOptions, checker as ts.TypeChecker];

	const isOptions = isEqual(optionsOrChecker, config.appConfApi);
	return isOptions
		? [optionsOrChecker as projectOptions, undefined]
		: [undefined, optionsOrChecker as ts.TypeChecker];

	function isEqual(value: any, value2: any) {
		const keys = Object.keys(value);
		const keys2 = Object.keys(value2);

		return keys.every((key) => keys2.includes(key));
	}
}
function makeParsedConfig(
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
function makeParsedConfigs(
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

function findAllRawConfigs(
	configFilePaths: string[],
	ensureAbsPath: (path: string) => string,
	isRootInit: boolean = false,
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
function makeRawTscConfigFromFile(fileName: string, init: boolean) {
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

const notices = {
	tsWrap: {
		throw: function (trace: string) {
			log.throwError(
				log.identifier(__filename),
				'Typechecker has not been registered yet',
				trace,
			);
		},
	},
};
