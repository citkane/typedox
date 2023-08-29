import * as dox from '../typedox';
const { Logger } = dox.lib;

export default class treePackage extends Logger {
	parent: dox.tree.treeRoot;
	treeReferences: Map<string, dox.tree.treeReference> = new Map();
	doxPackage: dox.Package;
	name: string;
	version: string;

	constructor(docsRoot: dox.tree.treeRoot, doxPackage: dox.Package) {
		super();
		this.parent = docsRoot;
		this.doxPackage = doxPackage;

		this.name = doxPackage.name;
		this.version = doxPackage.version;
	}
}
