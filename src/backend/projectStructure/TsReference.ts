import * as ts from 'typescript';
import {
	Branch,
	DoxConfig,
	NpmPackage,
	TsSourceFile,
	logger as log,
} from '../typedox';

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
		super(program.getTypeChecker());

		this.name = name;
		this.parent = parent;
		this.entryFileList = files;
		this.program = program;
	}
	/*
	public get toObject() {
		return dox.serialise.serialiseTsReference(this);
	}
*/
	public discoverDeclarations = () => {
		this.filesMap.forEach((file) => file.discoverDeclarations());
	};

	public buildRelationships = () => {
		this.filesMap.forEach((file) => file.buildRelationships());
	};

	public discoverFiles = this.discoverFilesRecursively;
	private discoverFilesRecursively(fileList = this.entryFileList) {
		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;

			const fileSource = this.program.getSourceFile(fileName);

			if (!fileSource)
				return notices.discoverFiles.fileSourceError(fileName);
			const fileSymbol = this.checker?.getSymbolAtLocation(fileSource);

			if (!fileSymbol)
				return notices.discoverFiles.fileSymbolWarning(fileName);

			const doxSourceFile = new TsSourceFile(
				this,
				fileSource,
				fileSymbol,
			);
			this.filesMap.set(fileName, doxSourceFile);

			this.discoverFilesRecursively(doxSourceFile.childFiles);
		});
	}
	public getRootDeclarations = () => {
		return Array.from(this.filesMap.values())
			.map((fileSource) =>
				Array.from(fileSource.declarationsMap.values()),
			)
			.flat()
			.filter((declaration) => !declaration.parents.length);
	};
}
const notices = {
	discoverFiles: {
		fileSourceError: (fileName: string) =>
			log.error(
				log.identifier(__filename),
				'No source file was found:',
				fileName,
			),
		fileSymbolWarning: (fileName: string) =>
			log.warn(
				log.identifier(__filename),
				'File was not included as part of the documentation set:',
				fileName,
			),
	},
};
