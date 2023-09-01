import * as dox from '../typedox';
import { Dox } from './Dox';

export class TsReference extends Dox {
	parent: dox.NpmPackage;
	name: string;
	filesMap: dox.fileMap = new Map();
	treeBranches: Map<string, dox.Branch> = new Map();
	entryFileList: string[];
	constructor(
		parent: dox.NpmPackage,
		context: dox.lib.DoxContext,
		name: string,
	) {
		super(context);
		this.context = { ...this.context, tsReference: this };

		this.parent = parent;
		this.name = name;
		this.entryFileList = context.tsConfig.fileNames;

		//this.discoverFiles(entryFileList);

		/*
		this.filesMap.forEach((file) => file.triggerRelationships());
		const rootDeclarations = Package.getDeclarationRoots(this);
		const tree = new dox.tree.Root(rootDeclarations, this);
		dox.log.info(JSON.stringify(tree.toObject(), null, 4));
		*/
	}

	public get toObject() {
		return dox.lib.serialiseTsReference(this);
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
				return this.error(
					this.classIdentifier,
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
