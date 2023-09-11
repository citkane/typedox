import * as ts from 'typescript';
import * as path from 'path';
import {
	logger as log,
	DoxProject,
	TsReference,
	namedRegistry,
	npmPackageDefinition,
	DoxConfig,
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
		programs: npmPackageDefinition,
	) {
		super(parent.projectOptions);
		const packageConfig = DoxConfig.jsonFileToObject(npmFilePath);
		const { name, version } = packageConfig;

		this.parent = parent;
		this.tsReferences = this._tsReferences(programs);
		this.name = name;
		this.version = version;
	}

	public get serialNpmPackage() {
		return {};
		//return serialise.serialiseNpmPackage(this);
	}

	private _tsReferences = (programs: npmPackageDefinition) => {
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

function getNameMap(programs: npmPackageDefinition) {
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
		longname: string[],
	): string[] {
		const hasParent = rootDirs.find(
			(dir) => dir !== rootDir && rootDir.startsWith(dir),
		);
		hasParent && longname.unshift(path.basename(hasParent));

		return hasParent
			? getNameFromRootDir(rootDirs, hasParent, longname)
			: longname;
	}

	return referenceNameMap;
}
/*
const testDirs = [
	'/foo/bar',
	'/foo/bar/poo/moo',
	'/bar',
	'/bar/none',
	'/foo/bar/poo',
	'/foo',
];
*/
