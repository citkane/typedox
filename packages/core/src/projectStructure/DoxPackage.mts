import * as path from 'path';
import {
	DoxProject,
	DoxReference,
	namedRegistry,
	config,
	DoxSourceFile,
	programsInPackage,
} from '../index.mjs';
import { Dox } from './Dox.mjs';

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
		doxPackages: programsInPackage,
	) {
		super();
		const packageConfig = config.jsonFileToObject(npmFilePath);
		const { name, version } = packageConfig;
		this.emit('package.begin', this, packageConfig);
		this.parent = parent;
		this.doxReferences = this.makeDoxReferences(doxPackages);
		this.name = name;
		this.version = version;
		this.emit('package.end', this, packageConfig);
	}
	public get doxProject() {
		return this.parent;
	}

	private makeDoxReferences = (programs: programsInPackage) => {
		const nameMap = DoxPackage.getNameMap(programs);
		const doxReferences = programs.map((tuple) => {
			const [program, rootDir] = tuple;
			const name = nameMap[rootDir];
			const files = program
				.getRootFileNames()
				.filter((fileName) => fileName.startsWith(rootDir));

			return new DoxReference(this, name, program, files);
		});

		return doxReferences;
	};

	public static getNameMap(programs: programsInPackage) {
		const rootDirs = programs.map((tuple) => tuple[1]);

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
