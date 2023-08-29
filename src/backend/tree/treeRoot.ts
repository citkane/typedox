import * as dox from '../typedox';

export default class treeRoot extends dox.lib.Logger {
	treePackages: Map<string, dox.tree.treePackage> = new Map();
	constructor() {
		super();
	}
}
