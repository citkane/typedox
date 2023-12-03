import ts from 'typescript';
import path from 'node:path';
import fs from 'node:fs';
import { log } from '@typedox/logger';
import { Dox, DoxPackage, config } from './index.mjs';

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
	public doxPackages = new Map<string, DoxPackage>();
	public doxConfig: config.DoxConfig;

	private parsedConfigRegistry: ts.ParsedCommandLine[];

	constructor(doxConfig: config.DoxConfig) {
		super();
		log.info(log.identifier(this), 'Making a Typedox project.', '\n');

		this.doxConfig = doxConfig;
		this.parsedConfigRegistry = [...doxConfig.tscParsedConfigs];
		this.makePackages();
		this.doxPackages.forEach((doxPackage) => doxPackage.init());

		log.info(log.identifier(this), 'Done making a Typedox project.', '\n');
	}
	public get options() {
		return this.doxConfig.options;
	}
	private makePackages() {
		((packageDirs) => {
			packageDirs.forEach((packageDir) => {
				((doxPackage) =>
					this.doxPackages.set(doxPackage.name, doxPackage))(
					this.makePackage(packageDir, this.doxConfig),
				);
			});
		})(DoxProject.findPackages(this.doxConfig.options));
	}
	private makePackage = (
		packageFile: string,
		{ options: { projectRootDir } }: config.DoxConfig,
	) => {
		return ((
			packageDir,
			packageParsedConfigs,
			packageProgramsRootDir,
			configIndices,
		) => {
			this.parsedConfigRegistry.forEach((parsedConfig, i) => {
				((programRootDir) => {
					if (!programRootDir) return notices.rootDir.warn();
					if (programRootDir.startsWith(packageDir)) {
						packageParsedConfigs.push(parsedConfig);
						packageProgramsRootDir.push(programRootDir);
						configIndices.push(i);
					}
				})(programRootDir(parsedConfig));
			});
			/* Prunes the parsedConfigRegistry to avoid duplicate
			   references under wrong packages */
			configIndices.sort().forEach((index, i) => {
				this.parsedConfigRegistry.splice(index - i, 1);
			});
			return new DoxPackage(
				this,
				packageFile,
				packageParsedConfigs,
				packageProgramsRootDir,
			);
		})(
			path.dirname(packageFile),
			[] as ts.ParsedCommandLine[],
			[] as string[],
			[] as number[],
		);
		function programRootDir(parsedConfig: ts.ParsedCommandLine) {
			return DoxProject.getProgramRootDir(
				parsedConfig.fileNames,
				parsedConfig.options,
				projectRootDir,
			);
		}
	};

	private static getProgramRootDir(
		fileNames: string[],
		{ composite, configFilePath }: ts.CompilerOptions,
		projectRootDir: string,
	) {
		type dirAccumulator = { min: number; dirs: string[] };

		return ((programRootDir) => {
			if (!composite) return programRootDir;
			if (isString(configFilePath))
				return path.dirname(path.resolve(configFilePath));
			return ((configFile) => {
				return configFile
					? path.dirname(path.resolve(configFile))
					: undefined;
			})(ts.findConfigFile(programRootDir, ts.sys.fileExists));
		})(getDirFromDirs(getFileDirs()));

		function getDirFromDirs(fileDirs: dirAccumulator) {
			return (
				fileDirs.dirs.find((dir) => dirDepth(dir) === fileDirs.min) ||
				projectRootDir
			);
		}
		function getFileDirs() {
			return fileNames.reduce(
				(accumulator, fileName) => reduceFile(accumulator, fileName),
				{ min: 0, dirs: [] as string[] },
			);
		}
		function reduceFile(accumulator: dirAccumulator, fileName: string) {
			return ((dir, dirDepth) => {
				accumulator.dirs.push(dir);
				accumulator.min === 0 && (accumulator.min = dirDepth);
				accumulator.min =
					dirDepth < accumulator.min ? dirDepth : accumulator.min;

				return accumulator;
			})(getDir(fileName), dirDepth(getDir(fileName)));

			function getDir(fileName: string) {
				return ((fileName) => path.dirname(fileName))(
					path.resolve(fileName),
				);
			}
		}
		function isString(value: any): value is string {
			return (
				!!value &&
				(typeof value === 'string' || value instanceof String)
			);
		}
	}
	private static findPackages(
		{
			projectRootDir: activeDir,
			npmFileConvention,
		}: config.DoxConfig['options'],
		accumulator = [] as string[],
	) {
		((packageFilePath) => {
			if (fs.existsSync(packageFilePath))
				accumulator.push(packageFilePath);
			fs.readdirSync(activeDir, {
				withFileTypes: true,
			}).forEach(findPackageInDir);
		})(path.join(activeDir, npmFileConvention));

		/* sort the packages by directory depth to enable predicatable pruning of the parsedConfigRegistry */
		return accumulator.sort((a, b) => {
			return dirDepth(b) - dirDepth(a);
		});

		function findPackageInDir(dirEnt: fs.Dirent) {
			if (!dirEnt.isDirectory()) return;
			if (dirEnt.name === 'node_modules') return;
			((newDir) => {
				DoxProject.findPackages(
					{
						projectRootDir: newDir,
						npmFileConvention,
					} as config.DoxConfig['options'],
					accumulator,
				);
			})(path.join(activeDir, dirEnt.name));
		}
	}
}
function dirDepth(dirPath: string) {
	return dirPath.split(path.sep).length;
}
const notices = {
	rootDir: {
		warn: () =>
			log.warn(
				log.identifier(__filename),
				'Did not find a root directory for a ts.Program',
			),
	},
};
