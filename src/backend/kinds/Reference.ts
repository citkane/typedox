import * as dox from '../typedox';
const { Dox } = dox.lib;

export default class Reference extends Dox {
	name: string;
	filesMap: dox.fileMap = new Map();
	entryFileList: string[];
	constructor(
		context: dox.lib.Context,
		name: string,
		entryFileList: string[],
	) {
		super(context);
		this.context = { ...this.context, reference: this };
		this.name = name;
		this.entryFileList = entryFileList;

		//this.discoverFiles(entryFileList);

		/*
		this.filesMap.forEach((file) => file.triggerRelationships());
		const rootDeclarations = Package.getDeclarationRoots(this);
		const tree = new dox.tree.Root(rootDeclarations, this);
		dox.log.info(JSON.stringify(tree.toObject(), null, 4));
		*/
	}
	public get parent() {
		return this.package;
	}
	public get declarationRoots() {
		return Reference.getDeclarationRoots([...this.filesMap.values()]);
	}
	public discoverFiles = this.recurseFiles;
	public discoverDeclarations = () =>
		this.filesMap.forEach((file) => file.discoverDeclarations());
	public discoverRelationships = () =>
		this.filesMap.forEach((file) => file.discoverRelationships());

	private recurseFiles(fileList = this.entryFileList) {
		const { program } = this.context;
		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;
			const fileSource = program.getSourceFile(fileName);

			if (!fileSource)
				return this.error(
					this.class,
					'No source file was found:',
					fileName,
				);

			const doxSourceFile = new dox.SourceFile(this.context, fileSource);
			this.filesMap.set(fileName, doxSourceFile);

			this.recurseFiles(doxSourceFile.childFiles);
		});
	}

	public static getDeclarationRoots = (sourceFiles: dox.SourceFile[]) =>
		this.getAllDeclarations(sourceFiles).filter(
			(declaration) => !declaration.parents.length,
		);

	private static getAllDeclarations = (sourceFiles: dox.SourceFile[]) =>
		sourceFiles
			.map((fileSource) => [...fileSource.declarationsMap.values()])
			.flat();
}
