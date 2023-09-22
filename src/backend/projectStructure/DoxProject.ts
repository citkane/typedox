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

	constructor(doxOptions: config.doxOptions, tscClOptions?: string[]) {
		super(doxOptions, tscClOptions);

		this.programs = this._programs(this.tscParsedConfigs);
		this.npmPackageDefinitions = this._npmPackageDefinitions(this.programs);
		this.npmPackages = this._npmPackages(this.npmPackageDefinitions);
	}

	private _npmPackages = (npmPackageDefinitions: npmPackageDefinitions) => {
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
		if (!Object.keys(npmPackageDefinitions).length)
			notices._npmPackageDefinitions.throw();

		return npmPackageDefinitions;
	};
	private _programs = (tscParsedConfigs: ts.ParsedCommandLine[]) => {
		const programs = tscParsedConfigs.reduce(
			makeProgramFromConfig,
			[] as ts.Program[],
		);

		if (!programs.length)
			notices._programs.throw(this.options.projectRootDir);

		return programs;

		function makeProgramFromConfig(
			accumulator: ts.Program[],
			parsedConfig: ts.ParsedCommandLine,
		) {
			const { fileNames, options } = parsedConfig;
			const { configFilePath, outDir, out, outFile, noEmit } = options;

			const noOutTarget = !out && !outFile && !outDir;
			if (noOutTarget || noEmit) {
				notices._programs.info(configFilePath);
				return accumulator;
			}

			const program = ts.createProgram(fileNames, options);
			runDiagnostics(program, String(configFilePath));
			accumulator.push(program);

			return accumulator;
		}
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
		notices.parseProgramRootDir.warn(
			this.options.npmFileConvention,
			rootDir,
		);
		return accumulator;
	}
	(accumulator[npmPackage] ??= []).push([program, rootDir]);
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
			String(fileName),
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

const notices = {
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
	_npmPackageDefinitions: {
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
