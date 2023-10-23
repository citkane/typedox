import ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import {
	log as log,
	config,
	DoxPackage,
	doxPackageDefinitions,
	DoxConfig,
	serialiser,
	loggerUtils,
} from '../typedox.mjs';
import { Dox } from './Dox.mjs';

const __filename = log.getFilename(import.meta.url);

/**
 * A container for the whole project structure
 *
 * &emsp;**DoxProject**\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- DoxSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- DoxDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...DoxDeclaration...
 */
export class DoxProject extends Dox {
	public doxPackages!: DoxPackage[];
	public doxConfig: DoxConfig;

	private doxPackageDefinitions!: doxPackageDefinitions;
	private programs!: ts.Program[];

	constructor(doxOptions: config.doxOptions, tscClOptions?: string[]) {
		super();

		this.doxConfig = new DoxConfig(doxOptions, tscClOptions);

		this.programs = this._programs(this.doxConfig.tscParsedConfigs);
		this.doxPackageDefinitions = this._doxPackageDefinitions(this.programs);
		this.doxPackages = this._doxPackages(this.doxPackageDefinitions);
	}
	public get options() {
		return this.doxConfig.options;
	}
	public get toObject() {
		return serialiser.serialiseProject(this);
	}
	private _doxPackages = (doxPackageDefinitions: doxPackageDefinitions) => {
		const definitions = doxPackageDefinitions;
		const configFiles = Object.keys(definitions);
		const doxPackages = configFiles.map(
			(filePath) => new DoxPackage(this, filePath, definitions[filePath]),
		);

		return doxPackages;
	};
	private _doxPackageDefinitions = (programs: ts.Program[]) => {
		const doxPackageDefinitions = programs.reduce(
			(accumulator, program) => {
				const rootDirs = getProgramRoots(program.getRootFileNames());
				rootDirs.forEach(
					parseProgramRootDir.bind(this, accumulator, program),
				);
				return accumulator;
			},
			{} as doxPackageDefinitions,
		);
		if (!Object.keys(doxPackageDefinitions).length)
			notices._doxPackageDefinitions.throw();

		return doxPackageDefinitions;
	};
	private _programs = (tscParsedConfigs: ts.ParsedCommandLine[]) => {
		//const programs = [] as ts.Program[];
		const programMap = new Map<string, ts.Program>();

		for (let i in tscParsedConfigs) {
			const parsedConfig = tscParsedConfigs[i];
			const memoryUsed = loggerUtils.formatBytes(
				process.memoryUsage().rss,
			);
			log.info(
				`Creating tsc program ${Number(i) + 1} of ${
					tscParsedConfigs.length
				}:`,
				parsedConfig.options.configFilePath,
				loggerUtils.colourise('FgGray', memoryUsed),
			);

			const program = makeProgramFromConfig(parsedConfig);
			!!program &&
				programMap.set(
					parsedConfig.options.configFilePath!.toString(),
					program,
				);
		}

		const programs = Array.from(programMap.values());

		if (!programs.length)
			notices._programs.throw(this.options.projectRootDir);

		return programs;

		function makeProgramFromConfig(parsedConfig: ts.ParsedCommandLine) {
			const { fileNames, options } = parsedConfig;
			const { configFilePath, outDir, out, outFile, noEmit } = options;
			const noOutTarget = !out && !outFile && !outDir;
			if (noOutTarget || noEmit) {
				return notices._programs.info(configFilePath);
			}
			const program = ts.createProgram(fileNames, options);
			runDiagnostics(program, String(configFilePath));
			return program;
		}
	};
}
function parseProgramRootDir(
	this: DoxProject,
	accumulator: doxPackageDefinitions,
	program: ts.Program,
	rootDir: string,
) {
	const doxPackage = findDoxPackage(
		this.options.projectRootDir,
		rootDir,
		this.options.npmFileConvention,
	);
	if (!doxPackage) {
		notices.parseProgramRootDir.warn(
			this.options.npmFileConvention,
			rootDir,
		);
		return accumulator;
	}
	(accumulator[doxPackage] ??= []).push([program, rootDir]);
}

function getProgramRoots(fileNames: readonly string[]) {
	return fileNames
		.map((file) => path.dirname(file))
		.map((dir, i, array) => array.find((d) => dir.startsWith(d))!)
		.filter((dir, i, array) => array.indexOf(dir) === i);
}
function runDiagnostics(program: ts.Program, fileName: string | undefined) {
	const diagnostics = program.getGlobalDiagnostics();
	diagnostics.forEach((diagnostic) => log.warn(diagnostic.messageText));
	if (diagnostics.length) notices.diagnostics.throw(String(fileName));
}
function findDoxPackage(
	projectRootDir: string,
	absDir: string,
	npmFileConvention: string,
): string | undefined {
	const npmFilePath = path.join(absDir, npmFileConvention);
	const parentDir = path.join(absDir, '../');
	const atFsRoot = parentDir === absDir;
	const atProjectRoot = absDir === projectRootDir;
	return fs.existsSync(npmFilePath)
		? npmFilePath
		: atFsRoot || atProjectRoot
		? undefined
		: findDoxPackage(projectRootDir, parentDir, npmFileConvention);
}

const notices = {
	diagnostics: {
		throw: (fileName: string) =>
			log.throwError(
				log.identifier(__filename),
				'Error in ts.Program:',
				String(fileName),
			),
	},
	_programs: {
		info: (
			configFilePath: ts.CompilerOptionsValue | ts.TsConfigSourceFile,
		) => {
			log.info(
				log.identifier(__filename),
				String(configFilePath),
				"has no out directory or does not emit. It's file list is being ignored.",
			);
		},
		throw: (rootDir: string) => {
			log.throwError(
				log.identifier(__filename),
				'Did not find any typescript configs which emit and have out directories in:',
				rootDir,
			);
		},
	},
	_doxPackageDefinitions: {
		throw: () =>
			log.throwError(
				log.identifier(__filename),
				'no npm package files were found for the project.',
			),
	},
	parseProgramRootDir: {
		warn: (fileConvention: string, rootDir: string) =>
			log.warn(
				log.identifier(__filename),
				`No npm "${fileConvention}" found for a compiler root directory:`,
				rootDir,
			),
	},
};
