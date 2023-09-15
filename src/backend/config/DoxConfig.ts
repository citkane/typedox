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
	logLevels,
} from '../typedox';

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';

let _cache: Cache;
export class DoxConfig {
	_deleteCache = () => {
		(_cache as any) = undefined;
	};

	public checker?: ts.TypeChecker;

	constructor(clOptions?: string[]);
	constructor(checker?: ts.TypeChecker, clOptions?: string[]);
	constructor(
		projectOptions?: config.doxOptions,
		checker?: ts.TypeChecker,
		clOptions?: string[],
	);
	constructor(
		projectOrCheckerOrClArgs?:
			| config.doxOptions
			| ts.TypeChecker
			| string[],
		checkerOrClArgs?: ts.TypeChecker | string[],
		argv = process.argv as string[],
	) {
		const [projectOptions, checker, clArgs] =
			config.resolveConstructorOverload(
				projectOrCheckerOrClArgs,
				checkerOrClArgs,
				argv,
			);

		this.checker = checker;

		if (!projectOptions && !_cache)
			log.throwError(
				log.identifier(this),
				'The initial DoxConfig must include projectOptions',
			);

		!_cache &&
			this.warmTheCache(
				projectOptions! as config.doxOptions,
				config.getTscParsedCommandline(clArgs),
			);
	}

	public get options() {
		return {
			projectRootDir: this.projectRootDir,
			doxOut: this.doxOut,
			typeDependencies: this.typeDependencies,
			logLevel: this.logLevel,
			tsConfigs: this.tsConfigs,
			npmFileConvention: this.npmFileConvention,
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
		return _cache.tscParsedConfigs;
	}

	private get tsConfigs() {
		return _cache.clProject
			? _cache.clProject
			: _cache.customProject?.length
			? _cache.customProject
			: _cache.entryProject;
	}
	private get projectRootDir() {
		return path.resolve(_cache.projectOptions.projectRootDir!);
	}
	private get doxOut() {
		return DoxConfig.ensureAbsPath(
			this.projectRootDir,
			_cache.projectOptions.doxOut!,
		);
	}
	private get typeDependencies() {
		return _cache.projectOptions.typeDependencies;
	}
	private get logLevel() {
		return logLevels[_cache.projectOptions.logLevel];
	}
	private get npmFileConvention() {
		return _cache.projectOptions.npmFileConvention!;
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
	private warmTheCache(
		projectOptions: config.doxOptions,
		tscCommandlineConfig: ts.ParsedCommandLine,
	) {
		_cache = new Cache(projectOptions, tscCommandlineConfig);
		_cache.clProject = this._clProject();
		_cache.entryProject = this._entryProject();
		_cache.tscRawConfigs = this._tscRawConfigs();
		_cache.customProject = this._customProject();
		_cache.tscParsedConfigs = this._tscParsedConfigs();
	}
	private get tscCommandLineOptions() {
		const clOptions = {
			..._cache.tscCommandlineConfig.options,
		} as ts.CompilerOptions;
		clOptions.types = this.typeDependencies;
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
		return _cache.projectOptions.tsConfigs?.map((fileName) =>
			DoxConfig.ensureAbsPath(this.projectRootDir, fileName),
		);
	};
	private _entryProject = () => {
		return [ts.findConfigFile(this.projectRootDir, ts.sys.fileExists)!];
	};
	private _tscRawConfigs = (): tscRawConfig[] => {
		const isRootInit = !!_cache.entryProject || !!_cache.clProject;
		const rawConfigs = config.findAllRawConfigs(
			this.tsConfigs,
			DoxConfig.ensureAbsPath.bind(null, this.projectRootDir),
			isRootInit,
		);
		return rawConfigs;
	};
	private _tscParsedConfigs = () => {
		const isRootLevel = !!_cache.entryProject || !!_cache.clProject;
		const existingOptions = isRootLevel ? this.tscCommandLineOptions : {};

		const parsedConfigs = config.makeParsedConfigs(
			_cache.tscRawConfigs,
			this.typeDependencies,
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

class Cache {
	_clProject: string[] | undefined;
	_customProject: string[] | undefined;
	_entryProject!: string[];
	projectOptions: config.doxOptions;
	tscCommandlineConfig: ts.ParsedCommandLine;
	_tscParsedConfigs!: ts.ParsedCommandLine[];
	_tscRawConfigs!: tscRawConfig[];

	constructor(
		projectOptions: config.doxOptions,
		tscCommandlineConfig: ts.ParsedCommandLine,
	) {
		this.projectOptions = projectOptions;
		this.tscCommandlineConfig = tscCommandlineConfig;
	}

	set clProject(value: string[] | undefined) {
		this._clProject = value;
	}
	get clProject() {
		return this._clProject;
	}
	set customProject(value: string[] | undefined) {
		this._customProject = value;
	}
	get customProject() {
		return this._customProject;
	}
	set entryProject(value: string[]) {
		this._entryProject = value;
	}
	get entryProject() {
		return this._entryProject;
	}
	set tscParsedConfigs(value: ts.ParsedCommandLine[]) {
		this._tscParsedConfigs = value;
	}
	get tscParsedConfigs() {
		return this._tscParsedConfigs;
	}
	set tscRawConfigs(value: tscRawConfig[]) {
		this._tscRawConfigs = value;
	}
	get tscRawConfigs() {
		return this._tscRawConfigs;
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
