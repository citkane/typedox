import ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { DoxPackage } from './index.mjs';
import { DoxConfig } from './config/DoxConfig.mjs';
import { Dox } from './Dox.mjs';
import { log } from '@typedox/logger';

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
	public doxConfig: DoxConfig;

	constructor(doxConfig: DoxConfig) {
		super();

		log.info(log.identifier(this), 'Making a Typedox project.', '\n');

		this.doxConfig = doxConfig;
		const { options } = doxConfig;

		const packages = DoxProject.findPackages(
			options.projectRootDir,
			options.npmFileConvention,
		);

		packages.forEach((packageDir) => {
			const doxPackage = this.makePackage(
				packageDir,
				this.doxConfig.tscParsedConfigs,
				this.doxConfig.options.projectRootDir,
			);
			this.doxPackages.set(doxPackage.name, doxPackage);
		});

		log.info(log.identifier(this), 'done.', '\n');
	}
	public get options() {
		return this.doxConfig.options;
	}
	private makePackage = (
		packageFile: string,
		parsedConfigs: ts.ParsedCommandLine[],
		projectRootDir: string,
	) => {
		const packageDir = path.dirname(packageFile);

		const packageParsedConfigs = [] as ts.ParsedCommandLine[];
		const packageProgramsRootDir = [] as string[];
		const included = [] as number[];
		parsedConfigs.forEach((parsedConfig, i) => {
			const programRootDir = DoxProject.getProgramRootDir(
				parsedConfig,
				projectRootDir,
			);

			if (!programRootDir) return notices.rootDir.warn();

			const include = programRootDir.startsWith(packageDir);
			if (include) {
				packageParsedConfigs.push(parsedConfig);
				packageProgramsRootDir.push(programRootDir);
				included.push(i);
			}
		});
		included.sort().forEach((index, i) => {
			parsedConfigs.splice(index - i, 1);
		});
		return new DoxPackage(
			this,
			packageFile,
			packageParsedConfigs,
			packageProgramsRootDir,
		);
	};

	public static getProgramRootDir(
		parsedConfig: ts.ParsedCommandLine,
		projectRootDir: string,
	) {
		const { composite, configFilePath } = parsedConfig.options;
		const fileDirs = parsedConfig.fileNames.reduce(
			(accumulator, fileName) => {
				fileName = path.resolve(fileName);
				const dir = path.dirname(fileName);
				const len = dir.split(path.sep).length;
				accumulator.dirs.push(dir);
				accumulator.min === 0 && (accumulator.min = len);
				accumulator.min = len < accumulator.min ? len : accumulator.min;

				return accumulator;
			},
			{ min: 0, dirs: [] as string[] },
		);

		let programRootDir = fileDirs.dirs.find((dir) => {
			const len = dir.split(path.sep).length;
			return len === fileDirs.min;
		});
		programRootDir ??= projectRootDir;

		if (!composite) return programRootDir;
		if (
			configFilePath &&
			(typeof configFilePath === 'string' ||
				configFilePath instanceof String)
		) {
			return path.dirname(path.resolve(configFilePath.toString()));
		}

		let configFile = ts.findConfigFile(programRootDir, ts.sys.fileExists);
		configFile = configFile ? path.resolve(configFile) : undefined;

		return configFile && path.dirname(configFile);
	}
	public static findPackages(
		rootDir: string,
		pacackeDef: string,
		accumulator = [] as string[],
	) {
		const packFile = path.join(rootDir, pacackeDef);
		if (fs.existsSync(packFile)) accumulator.push(packFile);
		fs.readdirSync(rootDir, { withFileTypes: true }).forEach((dirEnt) => {
			if (!dirEnt.isDirectory()) return;
			if (dirEnt.name === 'node_modules') return;

			const newDir = path.join(rootDir, dirEnt.name);
			DoxProject.findPackages(newDir, pacackeDef, accumulator);
		});
		return accumulator.sort((a, b) => {
			const aLen = a.split(path.sep).length;
			const bLen = b.split(path.sep).length;
			return bLen - aLen;
		});
	}
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
