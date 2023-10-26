import ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import {
	config,
	DoxPackage,
	DoxConfig,
	serialiser,
	programsInPackage,
} from '../typedox.mjs';
import { Dox } from './Dox.mjs';
import { log, loggerUtils } from 'typedox/logger';

const __filename = log.getFilename(import.meta.url);

type doxPackageDefinitions = Record<string, programsInPackage>;

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
	public doxPackages: DoxPackage[];
	public doxConfig: DoxConfig;

	constructor(doxOptions: config.doxOptions, tscClOptions?: string[]) {
		super();

		this.doxConfig = new DoxConfig(doxOptions, tscClOptions);

		const programs = makePrograms(this.doxConfig.tscParsedConfigs);
		const packages = makePackageDefinitions(programs, doxOptions);
		this.doxPackages = this.makeDoxPackages(packages);
	}
	public get options() {
		return this.doxConfig.options;
	}
	public get toObject() {
		return serialiser.serialiseProject(this);
	}
	private makeDoxPackages = (
		doxPackageDefinitions: doxPackageDefinitions,
	) => {
		const definitions = doxPackageDefinitions;
		const configFiles = Object.keys(definitions);
		const doxPackages = configFiles.map(
			(filePath) => new DoxPackage(this, filePath, definitions[filePath]),
		);

		return doxPackages;
	};
}
function makePrograms(tscParsedConfigs: ts.ParsedCommandLine[]) {
	return tscParsedConfigs.reduce((accumulator, parsedConfig, i) => {
		const program = makeProgramFromConfig(parsedConfig);
		if (!program) return accumulator;

		logMemoryUsage(String(parsedConfig.options.configFilePath), i);
		accumulator.push(program);
		return accumulator;
	}, [] as ts.Program[]);

	function makeProgramFromConfig(parsedConfig: ts.ParsedCommandLine) {
		const { fileNames, options } = parsedConfig;
		const { configFilePath, outDir, out, outFile, noEmit } = options;
		const program = ts.createProgram(fileNames, options);
		return runDiagnostics(program, String(configFilePath))
			? program
			: undefined;
	}
	function logMemoryUsage(filePath: string, i: number) {
		const memoryUsed = loggerUtils.formatBytes(process.memoryUsage().rss);
		log.info(
			`Creating tsc program ${Number(i) + 1} of ${
				tscParsedConfigs.length
			}:`,
			filePath,
			loggerUtils.colourise('FgGray', memoryUsed),
		);
	}
	function runDiagnostics(program: ts.Program, fileName: string) {
		const diagnostics = program.getGlobalDiagnostics();
		diagnostics.forEach((diagnostic) => {
			notices.diagnostics.warn(diagnostic.messageText.toString());
		});
		if (diagnostics.length) notices.diagnostics.error(fileName);
		return diagnostics.length ? false : true;
	}
}
function makePackageDefinitions(
	programs: ts.Program[],
	options: config.doxOptions,
) {
	const doxPackageDefinitions = programs.reduce((accumulator, program) => {
		const rootDirs = getProgramRoots(program.getRootFileNames());
		rootDirs.forEach((rootDir) =>
			parseProgramRootDir(options, accumulator, program, rootDir),
		);
		return accumulator;
	}, {} as doxPackageDefinitions);

	if (!Object.keys(doxPackageDefinitions).length)
		notices.packageDefinitions.throw();

	return doxPackageDefinitions;

	function parseProgramRootDir(
		options: config.doxOptions,
		accumulator: doxPackageDefinitions,
		program: ts.Program,
		rootDir: string,
	) {
		const doxPackage = findDoxPackage(
			options.projectRootDir,
			rootDir,
			options.npmFileConvention,
		);
		if (!doxPackage) {
			notices.parseProgramRootDir.warn(
				options.npmFileConvention,
				rootDir,
			);
			return accumulator;
		}
		(accumulator[doxPackage] ??= []).push([program, rootDir]);
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
	function getProgramRoots(fileNames: readonly string[]) {
		return fileNames
			.map((file) => path.dirname(file))
			.map((dir, i, array) => array.find((d) => dir.startsWith(d))!)
			.filter((dir, i, array) => array.indexOf(dir) === i);
	}
}

const notices = {
	diagnostics: {
		warn: (message: string) =>
			log.warn(log.identifier(__filename), message),
		error: (fileName: string) =>
			log.error(
				log.identifier(__filename),
				'Error in ts.Program:',
				String(fileName),
			),
	},
	packageDefinitions: {
		throw: () =>
			log.throwError(
				log.identifier(__filename),
				'no npm package files were found for the project.',
			),
	},
	parseProgramRootDir: {
		warn: (npmFileConvention: string, rootDir: string) =>
			log.warn(
				log.identifier(__filename),
				`No npm "${npmFileConvention}" found for a compiler root directory:`,
				rootDir,
			),
	},
};
