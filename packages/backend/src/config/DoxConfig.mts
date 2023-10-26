import * as path from 'path';
import ts from 'typescript';

import { tscRawConfig, config } from '../typedox.mjs';
import { log, logLevels } from 'typedox/logger';

export class DoxConfig {
	public projectOptions: config.doxOptions;
	public tscParsedConfigs!: ts.ParsedCommandLine[];

	private clProject: string[] | undefined;
	private customProject: string[] | undefined;
	private entryProject: string[] | undefined;
	private tscCommandlineConfig: ts.ParsedCommandLine;
	private tscRawConfigs!: tscRawConfig[];
	private projectRootDir: string;

	constructor(clOptions?: string[]);
	constructor(doxOptions?: config.doxOptions, clOptions?: string[]);
	constructor(
		doxOrClArgs?: config.doxOptions | string[],
		argv = process.argv as string[],
	) {
		const [doxOptions, clArgs] = config.resolveConstructorOverload(
			doxOrClArgs,
			argv,
		);
		const tscCommandlineConfig = config.getTscParsedCommandline(clArgs);
		const projectOptions = doxOptions || config.getDefaultDoxOptions();

		this.projectOptions = projectOptions;
		this.tscCommandlineConfig = tscCommandlineConfig;
		this.projectRootDir = path.resolve(this.projectOptions.projectRootDir);

		this.clProject = this.getClProject();
		this.customProject = this.getCustomProject();
		this.entryProject = this.getEntryProject();

		if (!this.tsConfigs) notices.throwError.call(this);

		this.tscRawConfigs = this.getTscRawConfigs(this.tsConfigs!);
		this.tscParsedConfigs = this.getTscParsedConfigs();
	}

	public get options() {
		return {
			projectRootDir: this.projectRootDir,
			doxOut: this.doxOut,
			typeDependencies: this.typeDependencies,
			logLevel: logLevels[this.projectOptions.logLevel],
			tsConfigs: this.tsConfigs,
			npmFileConvention: this.projectOptions.npmFileConvention,
			typedox: this.projectOptions.typedox,
		};
	}

	private get doxOut() {
		return config.ensureAbsPath(
			this.projectRootDir,
			this.projectOptions.doxOut,
		);
	}
	private get tsConfigs() {
		return this.clProject
			? this.clProject
			: this.customProject
			? this.customProject
			: this.entryProject;
	}
	private get typeDependencies() {
		return this.projectOptions.typeDependencies;
	}

	private get tscCommandLineOptions() {
		const clOptions = {
			...this.tscCommandlineConfig.options,
		} as ts.CompilerOptions;
		clOptions.types = this.typeDependencies;
		return clOptions;
	}
	private getClProject = (): string[] | undefined => {
		let project = this.tscCommandLineOptions.project;
		const filePath = project
			? config.ensureAbsPath(this.projectRootDir, project)
			: undefined;

		return filePath ? [config.ensureFileExists(filePath)!] : undefined;
	};
	private getCustomProject = () => {
		if (this.clProject) return undefined;
		const tsConfigs = this.projectOptions.tsConfigs;

		const custom = tsConfigs
			? tsConfigs.map((fileName) =>
					config.ensureAbsPath(this.projectRootDir, fileName),
			  )
			: undefined;

		return custom && custom.length
			? custom.map((file) => config.ensureFileExists(file)!)
			: undefined;
	};
	private getEntryProject = () => {
		if (this.clProject || this.customProject) return undefined;
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
	private getTscRawConfigs = (tsConfigs: string[]): tscRawConfig[] => {
		const isRootInit = !!this.entryProject || !!this.clProject;
		const rawConfigs = config.findAllRawConfigs(
			tsConfigs,
			config.ensureAbsPath.bind(null, this.projectRootDir),
			isRootInit,
		);

		return rawConfigs;
	};
	private getTscParsedConfigs = () => {
		const isRootLevel = !!this.entryProject || !!this.clProject;
		const existingOptions = isRootLevel ? this.tscCommandLineOptions : {};
		//existingOptions.module = ts.ModuleKind.NodeNext;
		//existingOptions.types = this.options.typeDependencies;

		const parsedConfigs = config.makeParsedConfigs(
			this.tscRawConfigs,
			existingOptions,
		);

		return parsedConfigs;
	};
}

const notices = {
	throwError: function (this: DoxConfig) {
		log.throwError(
			log.identifier(this),
			'Could not locate any tsconfig files to start the documentation process under the directory:',
			this.options.projectRootDir,
		);
	},
};
