import {
	Branch,
	DoxConfig,
	DoxProject,
	NpmPackage,
	TsSourceFile,
	fileMap,
	logger as log,
	rawDox,
} from '../typedox';
import * as ts from 'typescript';

/**
 * A container for a typescript compiler reference. This could be the only one in a npm package, or one of many if
 * the typescript `references` option is used. Each reference will have a corresponding `tsconfig`.
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- **TsReference**[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 *
 */
export class TsReference extends DoxConfig {
	public name: string;
	public parent: NpmPackage;
	public filesMap = new Map<string, TsSourceFile>();
	public treeBranches: Map<string, Branch> = new Map();
	public entryFileList: string[];
	private program: ts.Program;

	constructor(
		parent: NpmPackage,
		name: string,
		program: ts.Program,
		files: string[],
	) {
		super(parent.projectOptions, program.getTypeChecker());

		this.name = name;
		this.parent = parent;
		this.entryFileList = files;
		this.program = program;
		/*
		files.forEach((fileName) => {
			const checker = program.getTypeChecker();
			const foo = program.getSourceFile(fileName)!;
			this.filesMap.set(fileName, new TsSourceFile(this, foo, checker));
		});
*/
		//this.entryFileList = context.tsConfig.fileNames;
	}
	/*
	public get toObject() {
		return dox.serialise.serialiseTsReference(this);
	}
*/
	public discoverDeclarations = () =>
		this.filesMap.forEach((file) => file.discoverDeclarations());

	public buildRelationships = () =>
		this.filesMap.forEach((file) => file.buildRelationships());

	public discoverFiles = this.discoverFilesRecursively;
	private discoverFilesRecursively(fileList = this.entryFileList) {
		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;
			const fileSource = this.program.getSourceFile(fileName);

			if (!fileSource)
				return log.error(
					log.identifier(this),
					'No source file was found:',
					fileName,
				);

			const doxSourceFile = new TsSourceFile(
				this,
				fileSource,
				this.checker!,
			);
			this.filesMap.set(fileName, doxSourceFile);

			this.discoverFilesRecursively(doxSourceFile.childFiles);
		});
	}
	public static getDeclarationRoots = (sourceFiles: TsSourceFile[]) => {
		return this.getAllDeclarations(sourceFiles).filter(
			(declaration) => !declaration.parents.length,
		);
	};

	private static getAllDeclarations = (sourceFiles: TsSourceFile[]) => {
		return sourceFiles
			.map((fileSource) => [...fileSource.declarationsMap.values()])
			.flat();
	};
}
