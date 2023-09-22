import * as path from 'path';
import {
	logger as log,
	DoxProject,
	TsReference,
	namedRegistry,
	npmPackagePrograms,
	DoxConfig,
	config,
} from '../typedox';

/**
 * A container for all npm `package` declarations. Can be one, or many in a monorepo:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- **NpmPackage**[]\
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
 *
 *
 */
export class NpmPackage extends DoxConfig {
	public parent: DoxProject;
	public tsReferences: TsReference[];

	public version: string;
	public name: string;

	constructor(
		parent: DoxProject,
		npmFilePath: string,
		npmPackages: npmPackagePrograms,
	) {
		super();
		const packageConfig = config.jsonFileToObject(npmFilePath);
		const { name, version } = packageConfig;

		this.parent = parent;
		this.tsReferences = this._tsReferences(npmPackages);
		this.name = name;
		this.version = version;
	}

	private _tsReferences = (programs: npmPackagePrograms) => {
		const nameMap = getNameMap(programs);
		const tsReferences = programs.map((tuple) => {
			const [program, rootDir] = tuple;
			const name = nameMap[rootDir];
			const files = program
				.getRootFileNames()
				.filter((fileName) => fileName.startsWith(rootDir));

			return new TsReference(this, name, program, files);
		});

		return tsReferences;
	};
}

export function getNameMap(programs: npmPackagePrograms) {
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
