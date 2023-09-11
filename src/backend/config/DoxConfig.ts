import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';

import {
	logger as log,
	tscRawConfig,
	config,
	TscWrapper,
	whatIsIt,
} from '../typedox';

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';
let _tscCommandlineConfig: ts.ParsedCommandLine;
let _clProject: string[] | undefined;
let _customProject: string[] | undefined;
let _entryProject: string[];
let _tscRawConfigs: tscRawConfig[];
let _tscParsedConfigs: ts.ParsedCommandLine[];

export class DoxConfig {
	public projectOptions: config.doxGenericOptions<config.appConfApi>;
	public tscParsedConfigs: ts.ParsedCommandLine[];

	protected checker?: ts.TypeChecker;

	private clProject: string[] | undefined;
	private customProject: string[] | undefined;
	private entryProject: string[];
	private tscRawConfigs: tscRawConfig[];
	private _tscCommandlineConfig: ts.ParsedCommandLine;

	constructor(
		projectOptions: config.doxGenericOptions<config.appConfApi>,
		checker?: ts.TypeChecker,
	) {
		this.checker = checker;

		this.projectOptions = projectOptions;
		this._tscCommandlineConfig = _tscCommandlineConfig ??=
			config.getTscParsedCommandline();

		this.clProject = _clProject ??= this._clProject;
		this.customProject = _customProject ??= this._customProject;
		this.entryProject = _entryProject ??= this._entryProject;
		this.tscRawConfigs = _tscRawConfigs ??= this._tscRawConfigs;
		this.tscParsedConfigs = _tscParsedConfigs ??= this._tscParsedConfigs;
	}

	public get projectRootDir() {
		return path.resolve(this.projectOptions.projectRootDir!);
	}
	public get doxOut() {
		return DoxConfig.ensureAbsPath(
			this.projectRootDir,
			this.projectOptions.doxOut!,
		);
	}
	public get dependTypes() {
		return this.projectOptions.typeDependencies!;
	}
	public get logLevel() {
		return log.logLevels[this.projectOptions.logLevel!];
	}
	public get npmFileConvention() {
		return this.projectOptions.npmFileConvention!;
	}

	protected tsWrap = (item: whatIsIt): TscWrapper => {
		if (!this.checker)
			log.throwError(
				log.identifier(this),
				'Typechecker has not been registered yet',
			);
		return new TscWrapper(this.checker!, item);
	};
	private get tsConfigs() {
		return this.clProject
			? this.clProject
			: this.customProject?.length
			? this.customProject
			: this.entryProject;
	}
	private get tscCommandLineOptions() {
		const clOptions = {
			...this._tscCommandlineConfig.options,
		} as ts.CompilerOptions;
		clOptions.types = this.dependTypes;
		return clOptions;
	}
	private get _clProject() {
		let project = this.tscCommandLineOptions.project;
		const def = project
			? [DoxConfig.ensureAbsPath(this.projectRootDir, project)]
			: undefined;

		return def;
	}
	private get _customProject() {
		return this.projectOptions.tsConfigs?.map((fileName) =>
			DoxConfig.ensureAbsPath(this.projectRootDir, fileName),
		);
	}
	private get _entryProject() {
		return [ts.findConfigFile(this.projectRootDir, ts.sys.fileExists)!];
	}
	private get _tscRawConfigs(): tscRawConfig[] {
		const isRootInit = !!this.entryProject || !!this.clProject;
		const rawConfigs = findAllRawConfigs(
			this.tsConfigs,
			DoxConfig.ensureAbsPath.bind(null, this.projectRootDir),
			isRootInit,
		);
		return rawConfigs;
	}
	private get _tscParsedConfigs() {
		const isRootLevel = this.entryProject || this.clProject;
		const existingOptions = isRootLevel ? this.tscCommandLineOptions : {};

		const parsedConfigs = makeParsedConfigs(
			this.tscRawConfigs,
			this.dependTypes,
			existingOptions,
		);
		/*
		const npmPackageConfigRegister = makeNpmPackageConfigRegister(
			parsedConfigRegister,
			this.projectRootDir,
			this.npmFileConvention,
		);
		*/
		return parsedConfigs;
	}

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
