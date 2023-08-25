import * as dox from '../typedox';
import * as ts from 'typescript';
import Branch from './Branch';

export default class Root extends Branch {
	packageName: string;
	version?: string;

	constructor(declarations: dox.Declaration[], doxPackage: dox.Package) {
		super(declarations);
		this.packageName = doxPackage.name;
		this.version = doxPackage.version;
	}
	public toObject() {
		return dox.serialiser.Serialise.root(this);
	}
}
