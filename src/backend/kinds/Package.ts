import * as dox from '../typedox';

export default class Package extends dox.lib.Dox {
	name = 'todo';
	version = 'todo';
	kind = dox.Kind.Package;
	filesMap: dox.fileMap = new Map();

	constructor(context: dox.lib.Context, entryFileList: string[]) {
		super(context);
		super.package = this;

		this.addEntryFiles(entryFileList);

		this.filesMap.forEach((file) => file.triggerRelationships());
		const rootDeclarations = Package.getDeclarationRoots(this);
		const tree = new dox.tree.Root(rootDeclarations, this);
		dox.log.info(JSON.stringify(tree.toObject(), null, 4));
	}

	public addEntryFiles = (fileNames: string[]) => {
		fileNames = this.deDupeFilelist(fileNames);
		this.makeSourceFiles(fileNames);
	};

	private makeSourceFiles(fileList: string[]) {
		const context = { ...this.context, package: this };
		const { program } = context;

		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;
			const fileSource = program.getSourceFile(fileName);
			if (!fileSource) {
				dox.log.warn('No source file was found:', fileName);
				return;
			}
			const sourceFile = new dox.SourceFile(context, fileSource);
			this.filesMap.set(fileName, sourceFile);
			this.addEntryFiles([...sourceFile.childFiles]);
		});
	}
	private deDupeFilelist = (fileList: string[]) =>
		fileList
			.filter((value, index, array) => array.indexOf(value) === index)
			.filter((value) => !this.filesMap.has(value));

	private static getDeclarationRoots = (pack: dox.Package) =>
		this.getAllDeclarations(pack).filter(
			(declaration) => !declaration.parents.length,
		);

	private static getAllDeclarations = (pack: dox.Package) =>
		[...this.getAllFileSources(pack)]
			.map((fileSource) => [...fileSource.declarationsMap.values()])
			.flat();

	private static getAllFileSources = (pack: dox.Package) =>
		pack.filesMap.values();
}
