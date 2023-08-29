import * as dox from '../typedox';

export default class treeReference extends dox.lib.Logger {
	doxReference: dox.Reference;
	treeBranches: Map<string, dox.tree.Branch> = new Map();
	constructor(doxReference: dox.Reference) {
		super();
		this.doxReference = doxReference;
	}
}
