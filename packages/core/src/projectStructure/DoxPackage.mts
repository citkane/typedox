import * as path from 'path';
import {
	DoxProject,
	DoxReference,
	namedRegistry,
	config,
	DoxSourceFile,
} from '../index.mjs';
import { Dox } from './Dox.mjs';
import { log, loggerUtils } from '@typedox/logger';
import ts from 'typescript';

const __filename = log.getFilename(import.meta.url);

/**
 * A container for all npm `package` declarations. Can be one, or many in a monorepo:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- **DoxPackage**[]\
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
 *
 *
 */
export class DoxPackage extends Dox {
	public doxReferences: DoxReference[];
	public filesMap = new Map<string, DoxSourceFile>();
	public version: string;
	public name: string;

	private parent: DoxProject;
	constructor(
		parent: DoxProject,
		npmFilePath: string,
		parsedConfigs: ts.ParsedCommandLine[],
		programsRootDir: string[],
	) {
		super();
		const packageConfig = config.jsonFileToObject(npmFilePath);
		const { name, version } = packageConfig;
		this.parent = parent;
		this.name = name;
		this.version = version;

		this.events.emit('core.package.begin', this, packageConfig);
		log.info(log.identifier(this), `Making package ${name}: ${version}`);

		this.doxReferences = this.makeDoxReferences(
			parsedConfigs,
			programsRootDir,
		);

		log.info(log.identifier(this), 'done', '\n');
		this.events.emit('core.package.end', this, packageConfig);
	}
	public get doxProject() {
		return this.parent;
	}

	private makeDoxReferences = (
		parsedConfigs: ts.ParsedCommandLine[],
		rootDirs: string[],
	) => {
		const nameSpaceMap = DoxPackage.getNameMap(rootDirs);
		const doxReferences = parsedConfigs.reduce(
			(accumulator, parsedConfig, i) => {
				const rootDir = rootDirs[i];
				const name = nameSpaceMap[rootDir];

				const reference = new DoxReference(
					this,
					name,
					parsedConfig,
					parsedConfigs.length,
					i,
				);
				if (reference.program) accumulator.push(reference);

				return accumulator;
			},
			[] as DoxReference[],
		);

		return doxReferences;
	};

	public static getNameMap(rootDirs: string[]) {
		const referenceNameMap = rootDirs
			.sort()
			.reverse()
			.reduce((accumulator, rootDir) => {
				accumulator[rootDir] = getNameFromRootDir(rootDirs, rootDir, [
					path.basename(rootDir),
				]).join('-');
				return accumulator;
			}, {} as namedRegistry<string>);

		function getNameFromRootDir(
			rootDirs: string[],
			rootDir: string,
			longName: string[],
		): string[] {
			const hasParent = rootDirs.find(
				(dir) => dir !== rootDir && rootDir.startsWith(dir),
			);
			hasParent && longName.unshift(path.basename(hasParent));

			return hasParent
				? getNameFromRootDir(rootDirs, hasParent, longName)
				: longName;
		}

		return referenceNameMap;
	}
}
