import path from 'path';
import ts from 'typescript';

import { tscRawConfig } from '../index.mjs';
import { log, logLevelKeys, logLevels } from '@typedox/logger';
import {
	makeDoxOptions,
	getTscParsedCommandline,
	options,
	ensureAbsPath,
	ensureFileExists,
	findAllRawConfigs,
	makeParsedConfigs,
	CoreArgsApi,
	ArgsApi,
} from './_namespace.mjs';

type optionsSansLogLevel = {
	[key in Exclude<
		keyof options<CoreArgsApi>,
		'logLevel'
	>]: options<CoreArgsApi>[key];
};

export interface coreDoxOptions extends optionsSansLogLevel {
	logLevel: logLevels;
}
export class DoxConfig {
	public options: coreDoxOptions;
	public tscParsedConfigs: ts.ParsedCommandLine[];

	private clProject: string[] | undefined;
	private customProject: string[] | undefined;
	private entryProject: string[] | undefined;
	private tscClConfig: ts.ParsedCommandLine;
	private tscRawConfigs!: tscRawConfig[];

	constructor(
		testDoxOverrides?: Partial<options<CoreArgsApi>>,
		testClOverrrides?: string[],
	) {
		const coreArgs = new CoreArgsApi() as ArgsApi<CoreArgsApi>;
		const options = makeDoxOptions<CoreArgsApi>(
			coreArgs,
			testClOverrrides,
			testDoxOverrides,
		);
		this.options = {
			...options,
			...{ logLevel: logLevels[options.logLevel as logLevelKeys] },
		} as coreDoxOptions;
		this.tscClConfig = getTscParsedCommandline(coreArgs);

		this.clProject = this.getClProject();
		this.customProject = this.getCustomProject();
		this.entryProject = this.getEntryProject();

		if (!this.tsConfigs) notices.throwError.call(this);

		this.tscRawConfigs = this.getTscRawConfigs(this.tsConfigs!);
		this.tscParsedConfigs = this.getTscParsedConfigs();
	}

	private get tsConfigs() {
		return this.clProject
			? this.clProject
			: this.customProject
			? this.customProject
			: this.entryProject;
	}

	private getClProject = (): string[] | undefined => {
		let project = this.tscClConfig.options.project;
		const filePath = project
			? ensureAbsPath(this.options.projectRootDir, project)
			: undefined;

		return filePath ? [ensureFileExists(filePath)!] : undefined;
	};
	private getCustomProject = () => {
		if (this.clProject) return undefined;
		const tsConfigs = (this.options as coreDoxOptions).tsConfigs;

		const custom = tsConfigs.length
			? tsConfigs.map((fileName) =>
					ensureAbsPath(this.options.projectRootDir, fileName),
			  )
			: undefined;

		return custom && custom.length
			? custom.map((file) => ensureFileExists(file)!)
			: undefined;
	};
	private getEntryProject = () => {
		if (this.clProject || this.customProject) return undefined;

		let entryFile = ts.findConfigFile(
			this.options.projectRootDir,
			ts.sys.fileExists,
		);
		entryFile = entryFile ? path.resolve(entryFile) : undefined;
		return entryFile && !entryFile.startsWith(this.options.projectRootDir)
			? undefined
			: entryFile
			? [ensureFileExists(entryFile)!]
			: undefined;
	};
	private getTscRawConfigs = (tsConfigs: string[]): tscRawConfig[] => {
		const isRootInit = !!this.entryProject || !!this.clProject;
		const rawConfigs = findAllRawConfigs(
			tsConfigs,
			ensureAbsPath.bind(null, this.options.projectRootDir),
			isRootInit,
		);

		return rawConfigs;
	};
	private getTscParsedConfigs = () => {
		const isRootLevel = !!this.entryProject || !!this.clProject;
		const existingOptions = isRootLevel ? this.tscClConfig.options : {};
		//existingOptions.module = ts.ModuleKind.NodeNext;
		//existingOptions.types = this.options.typeDependencies;

		const parsedConfigs = makeParsedConfigs(
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
			'Could not locate any tsconfig.json files in the root directory:',
			this.options.projectRootDir,
			'\n\n',
			`Try setting the "tsConfigs" option to specifify sub-directory locations.\n`,
		);
	},
};
