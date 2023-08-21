import * as dox from '../typedox';

export default class Branch {
	nameSpaces: Map<string, Branch>;
	declarations: Map<string, dox.Declaration>;
	constructor(
		nameSpaces: Map<string, Branch> = new Map(),
		declarations: Map<string, dox.Declaration> = new Map(),
	) {
		this.nameSpaces = nameSpaces;
		this.declarations = declarations;
	}
}
