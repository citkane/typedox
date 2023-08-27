import * as dox from '../typedox';
import Branch from './Branch';

export default class Root extends Branch {
	referenceName: string;
	version?: string;

	constructor(declarations: dox.Declaration[], Reference: dox.Reference) {
		super(declarations);
		this.referenceName = Reference.name;
	}
	public toObject() {
		return dox.serialiser.Serialise.root(this);
	}
}
