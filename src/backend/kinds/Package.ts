import * as dox from '../typedox';

export default class Package extends dox.lib.Dox {
	name = 'todo';
	version = 'todo';
	kind = dox.Kind.Package;
	filesMap: dox.fileMap = new Map();
	tree: dox.tree.Tree;

	constructor(context: dox.lib.Context, entryFileList: string[]) {
		super(context);
		super.package = this;

		this.addEntryFiles(entryFileList);
		this.filesMap.forEach((file) => file.buildRelationships());
		this.tree = new dox.tree.Tree(this);

		//dox.log.info(this.tree.toObject());
	}

	public addEntryFiles = (fileNames: string[]) => {
		fileNames = this.deDupeFilelist(fileNames);
		this.makeSourceFiles(fileNames);
	};

	private makeSourceFiles(fileList: string[]) {
		const context = { ...this.context, package: this };
		const { program } = context;

		const fileSources = fileList
			.map((fileName) => program.getSourceFile(fileName)!)
			.filter((source, i) => (!!source ? source : warning(i)));
		fileSources.forEach((source) => {
			const sourceFile = new dox.SourceFile(context, source);
			this.filesMap.set(sourceFile.fileName, sourceFile);
			this.addEntryFiles(sourceFile.childFiles);
		});

		function warning(i: number) {
			const message = `No source file was found for "${fileList[i]}"`;
			dox.log.warn(message);
			return false;
		}
	}
	private deDupeFilelist(fileList: string[]) {
		return fileList.filter((file) => !this.filesMap.has(file));
	}
}
