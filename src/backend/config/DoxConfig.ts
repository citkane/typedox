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
	logLevelKeys,
} from '../typedox';
import { ensureFileExists } from './_namespace';

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';

let _cache: Cache;
export function _deleteCache() {
	(_cache as any) = undefined;
}

export class DoxConfig {
	public checker?: ts.TypeChecker;

	constructor(clOptions?: string[]);
	constructor(checker?: ts.TypeChecker, clOptions?: string[]);
	constructor(doxOptions?: config.doxOptions, clOptions?: string[]);
	constructor(
		doxOptions?: config.doxOptions,
		checker?: ts.TypeChecker,
		clOptions?: string[],
	);
	constructor(
		doxOrCheckerOrClArgs?: config.doxOptions | ts.TypeChecker | string[],
		checkerOrClArgs?: ts.TypeChecker | string[],
		argv = process.argv as string[],
	) {
		const [doxOptions, checker, clArgs] = config.resolveConstructorOverload(
			doxOrCheckerOrClArgs,
			checkerOrClArgs,
			argv,
		);

		this.checker = checker;

		if (!doxOptions && !_cache)
			log.throwError(
				log.identifier(this),
				'The initial DoxConfig must include projectOptions',
			);

		!_cache &&
			this._warmTheCache(
				doxOptions! as config.doxOptions,
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
			typedox: _cache.typedox,
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
			: notices.toObject(constructor);
	}

	protected get tscParsedConfigs() {
		return _cache.tscParsedConfigs;
	}

	private get tsConfigs() {
		return _cache.clProject
			? _cache.clProject
			: _cache.customProject
			? _cache.customProject
			: _cache.entryProject;
	}
	private get projectRootDir() {
		return path.resolve(_cache.projectOptions.projectRootDir!);
	}
	private get doxOut() {
		return config.ensureAbsPath(
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
		!this.checker && notices.tsWrap.throw(log.stackTracer());
		return tsc.wrap(this.checker!, item);
	};
	private _warmTheCache(
		projectOptions: config.doxOptions,
		tscCommandlineConfig: ts.ParsedCommandLine,
	) {
		_cache = new Cache(projectOptions, tscCommandlineConfig);

		_cache.clProject = this._clProject();
		_cache.customProject = this._customProject();
		_cache.entryProject = this._entryProject();

		if (!this.tsConfigs) notices._warmTheCache.throwError.call(this);

		_cache.tscRawConfigs = this._tscRawConfigs(this.tsConfigs!);
		_cache.tscParsedConfigs = this._tscParsedConfigs();
	}
	private get tscCommandLineOptions() {
		const clOptions = {
			..._cache.tscCommandlineConfig.options,
		} as ts.CompilerOptions;
		clOptions.types = this.typeDependencies;
		return clOptions;
	}
	private _clProject = (): string[] | undefined => {
		let project = this.tscCommandLineOptions.project;
		const filePath = project
			? config.ensureAbsPath(this.projectRootDir, project)
			: undefined;

		return filePath ? [config.ensureFileExists(filePath)!] : undefined;
	};
	private _customProject = () => {
		if (_cache._clProject) return undefined;
		const tsConfigs = _cache.projectOptions.tsConfigs;

		const custom = tsConfigs
			? tsConfigs.map((fileName) =>
					config.ensureAbsPath(this.projectRootDir, fileName),
			  )
			: undefined;

		return custom && custom.length
			? custom.map((file) => config.ensureFileExists(file)!)
			: undefined;
	};
	private _entryProject = () => {
		if (_cache._clProject || _cache.customProject) return undefined;
		const entryFile = ts.findConfigFile(
			this.projectRootDir,
			ts.sys.fileExists,
		);

		return entryFile && !entryFile.startsWith(this.projectRootDir)
			? undefined
			: entryFile
			? [config.ensureFileExists(entryFile)!]
			: undefined;
	};
	private _tscRawConfigs = (tsConfigs: string[]): tscRawConfig[] => {
		const isRootInit = !!_cache.entryProject || !!_cache.clProject;
		const rawConfigs = config.findAllRawConfigs(
			tsConfigs,
			config.ensureAbsPath.bind(null, this.projectRootDir),
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
	public static configurators = {
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
					config.doxArgs.tsConfigs.defaultValue || [],
				) as string[];

				doxOptions.tsConfigs ??= defaultValue;
				value === undefined
					? (doxOptions.tsConfigs = undefined)
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
}

class Cache {
	_clProject: string[] | undefined;
	_customProject: string[] | undefined;
	_entryProject: string[] | undefined;
	projectOptions: config.doxOptions;
	tscCommandlineConfig: ts.ParsedCommandLine;
	typedox: string | undefined;
	_tscParsedConfigs!: ts.ParsedCommandLine[];
	_tscRawConfigs!: tscRawConfig[];

	constructor(
		projectOptions: config.doxOptions,
		tscCommandlineConfig: ts.ParsedCommandLine,
	) {
		this.projectOptions = projectOptions;
		this.tscCommandlineConfig = tscCommandlineConfig;
		this.typedox = projectOptions.typedox;
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
	set entryProject(value: string[] | undefined) {
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
	toObject: (constructor: string) =>
		log.error(
			log.identifier(__filename),
			'Call made to unknown serialiser:',
			constructor,
		),
	_warmTheCache: {
		throwError: function (this: DoxConfig) {
			log.throwError(
				log.identifier(this),
				'Could not locate any tsconfig files to start the documentation process under the directory:',
				this.options.projectRootDir,
			);
		},
	},
};
