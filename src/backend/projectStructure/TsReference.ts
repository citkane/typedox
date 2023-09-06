import * as dox from '../typedox';
import * as ts from 'typescript';

const log = dox.logger;

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
export class TsReference extends dox.DoxContext {
	private context: dox.DoxContext;
	name: string;
	filesMap: dox.fileMap = new Map();
	treeBranches: Map<string, dox.Branch> = new Map();
	entryFileList: string[];

	constructor(context: dox.DoxContext, name: string) {
		super(context);
		this.context = this.registerTsReferenceContext(this);

		this.name = name;
		this.entryFileList = context.tsConfig.fileNames;
	}
	public get parent() {
		return this.context.npmPackage;
	}
	public get toObject() {
		return dox.serialise.serialiseTsReference(this);
	}

	public discoverDeclarations = () =>
		this.filesMap.forEach((file) => file.discoverDeclarations());

	public buildRelationships = () =>
		this.filesMap.forEach((file) => file.buildRelationships());

	public discoverFiles = this.discoverFilesRecursively;
	private discoverFilesRecursively(fileList = this.entryFileList) {
		const { tsProgram: program } = this.context;
		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;
			const fileSource = program.getSourceFile(fileName);

			if (!fileSource)
				return log.error(
					log.identifier(this),
					'No source file was found:',
					fileName,
				);

			const doxSourceFile = new dox.TsSourceFile(
				this.context,
				fileSource,
			);
			this.filesMap.set(fileName, doxSourceFile);

			this.discoverFilesRecursively(doxSourceFile.childFiles);
		});
	}
	public static getDeclarationRoots = (sourceFiles: dox.TsSourceFile[]) => {
		return this.getAllDeclarations(sourceFiles).filter(
			(declaration) => !declaration.parents.length,
		);
	};

	private static getAllDeclarations = (sourceFiles: dox.TsSourceFile[]) => {
		return sourceFiles
			.map((fileSource) => [...fileSource.declarationsMap.values()])
			.flat();
	};
}
