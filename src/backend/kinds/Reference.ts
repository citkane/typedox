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

	public discoverFiles = this.makeSourceFiles;
	public discoverDeclarations = () => {
		this.filesMap.forEach((file) => file.discoverDeclarations());
	};
	public discoverRelationships = () => {
		this.filesMap.forEach((file) => file.discoverRelationships());
	};

	private makeSourceFiles(fileList = this.entryFileList) {
		const { program } = this.context;
		fileList = this.deDupeFilelist(fileList);
		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;
			const fileSource = program.getSourceFile(fileName);
			if (!fileSource) {
				this.warn(this.class, 'No source file was found:', fileName);
				return;
			}
			const sourceFile = new dox.SourceFile(this.context, fileSource);
			this.filesMap.set(fileName, sourceFile);
			this.makeSourceFiles([...sourceFile.childFiles]);
		});
	}
	private deDupeFilelist = (fileList: string[]) =>
		fileList
			.filter((value, index, array) => array.indexOf(value) === index)
			.filter((value) => !this.filesMap.has(value));

	private static getDeclarationRoots = (pack: dox.Reference) =>
		this.getAllDeclarations(pack).filter(
			(declaration) => !declaration.parents.length,
		);

	private static getAllDeclarations = (pack: dox.Reference) =>
		[...this.getAllFileSources(pack)]
			.map((fileSource) => [...fileSource.declarationsMap.values()])
			.flat();

	private static getAllFileSources = (pack: dox.Reference) =>
		pack.filesMap.values();
}
