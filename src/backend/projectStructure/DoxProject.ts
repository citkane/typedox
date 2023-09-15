import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import {
	logger as log,
	config,
	NpmPackage,
	TsDeclaration,
	Relation,
	TscWrapper,
	npmPackageDefinitions,
	DoxConfig,
	logLevels,
} from '../typedox';

/**
 * A container for the whole project structure
 *
 * &emsp;**DoxProject**\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 */
export class DoxProject extends DoxConfig {
	public npmPackages: NpmPackage[];

	private npmPackageDefinitions: npmPackageDefinitions;
	private programs: ts.Program[];

	constructor(projectOptions: config.doxOptions) {
		super(projectOptions);

		this.programs = this._programs(this.tscParsedConfigs);
		this.npmPackageDefinitions = this._npmPackageDefinitions(this.programs);
		this.npmPackages = this._nmpPackages(this.npmPackageDefinitions);
	}

	private _nmpPackages = (npmPackageDefinitions: npmPackageDefinitions) => {
		const definitions = npmPackageDefinitions;
		const configFiles = Object.keys(definitions);
		const npmPackages = configFiles.map(
			(filePath) => new NpmPackage(this, filePath, definitions[filePath]),
		);

		return npmPackages;
	};
	private _npmPackageDefinitions = (programs: ts.Program[]) => {
		const npmPackageDefinitions = programs.reduce(
			(accumulator, program) => {
				const rootDirs = getProgramRoots(program.getRootFileNames());
				rootDirs.forEach(
					parseProgramRootDir.bind(this, accumulator, program),
				);
				return accumulator;
			},
			{} as npmPackageDefinitions,
		);

		return npmPackageDefinitions;
	};
	private _programs = (tscParsedConfigs: ts.ParsedCommandLine[]) => {
		const programs = tscParsedConfigs.reduce(
			(accumulator, parsedConfig) => {
				if (!configHasOutDir(parsedConfig)) return accumulator;

				const program = ts.createProgram(
					parsedConfig.fileNames,
					parsedConfig.options,
				);
				const { configFilePath } = parsedConfig.options;

				runDiagnostics(program, configFilePath?.toLocaleString());
				accumulator.push(program);

				return accumulator;
			},
			[] as ts.Program[],
		);

		return programs;
	};

	public static deepReport(
		this: TsDeclaration | Relation,
		location: string,
		logLevel: keyof typeof logLevels,
		message: string,
		get: TscWrapper,
		isLocalTarget: boolean,
	) {
		log[logLevel](log.identifier(location), message, {
			filename: this.get.fileName,
			sourceReport: this.get.report,
			sourceDeclaration: this.get.nodeDeclarationText,
			targetReport: isLocalTarget ? get.report : undefined,
			targetDeclaration: isLocalTarget
				? get.nodeDeclarationText
				: undefined,
		});
	}
}
function parseProgramRootDir(
	this: DoxProject,
	accumulator: npmPackageDefinitions,
	program: ts.Program,
	rootDir: string,
) {
	const npmPackage = findNpmPackage(
		this.options.projectRootDir,
		rootDir,
		this.options.npmFileConvention,
	);
	if (!npmPackage) {
		log.error(
			log.identifier(__filename),
			`No npm "${this.options.npmFileConvention}" found for a compiler root directory:`,
			rootDir,
		);
		return accumulator;
	}
	(accumulator[npmPackage] ??= []).push([program, rootDir]);
}
function configHasOutDir(parsedConfig: ts.ParsedCommandLine) {
	const { configFilePath, outDir } = parsedConfig.options;
	if (!outDir) {
		log.info(
			log.identifier(__filename),
			configFilePath?.toLocaleString() || 'An unknown configuration',
			"has no out directory, so it's file list is being ignored.",
		);
	}
	return !!outDir;
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
	if (diagnostics.length)
		log.throwError(
			log.identifier(__filename),
			'Error in ts.Program:',
			fileName || 'unknown file',
		);
}
function findNpmPackage(
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
		: findNpmPackage(projectRootDir, parentDir, npmFileConvention);
}
