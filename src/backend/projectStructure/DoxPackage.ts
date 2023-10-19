import * as path from 'path';
import {
	logger as log,
	DoxProject,
	DoxReference,
	namedRegistry,
	doxPackagePrograms,
	DoxConfig,
	config,
	serialise,
	DoxSourceFile,
} from '../typedox';
import { Dox } from './Dox';

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
	public parent: DoxProject;
	public doxReferences: DoxReference[];
	public filesMap = new Map<string, DoxSourceFile>();

	public version: string;
	public name: string;

	constructor(
		parent: DoxProject,
		npmFilePath: string,
		doxPackages: doxPackagePrograms,
	) {
		super();
		const packageConfig = config.jsonFileToObject(npmFilePath);
		const { name, version } = packageConfig;

		this.parent = parent;
		this.doxReferences = this._doxReferences(doxPackages);
		this.name = name;
		this.version = version;
	}
	public get toObject() {
		return serialise.serialiseDoxPackage(this);
	}

	private _doxReferences = (programs: doxPackagePrograms) => {
		const nameMap = getNameMap(programs);
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
}

export function getNameMap(programs: doxPackagePrograms) {
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
