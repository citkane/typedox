import * as ts from 'typescript';
import * as dox from '../typedox';
import { TscWrapper } from './TsWrapper';

type cacheKeys = keyof typeof cacheCallbacks;

export default class TsWrapperCache {
	private wrapper: TscWrapper;
	private checker: ts.TypeChecker;
	private _cache = new Map<cacheKeys, any>();

	constructor(wrapper: TscWrapper, checker: ts.TypeChecker) {
		this.wrapper = wrapper;
		this.checker = checker;
	}

	public cacheGet = <T>(key: cacheKeys) => this.cacheSet<T>(key);
	public cacheSet = <T>(key: cacheKeys, knownValue?: T) => {
		if (this._cache.has(key)) return this._cache.get(key) as T;

		const value: T = knownValue
			? knownValue
			: (cacheCallbacks[key].bind(this.wrapper)(this.checker) as T);

		this._cache.set(key, value);

		return value;
	};
}

const cacheCallbacks = {
	tsNode: function (this: TscWrapper) {
		return dox.tsc.getTsNodeFromSymbol.call(this, this.tsSymbol);
	},
	tsSymbol: function (this: TscWrapper, checker: ts.TypeChecker) {
		return this.isType
			? dox.tsc.getTsSymbolFromType.call(this, this.tsType)
			: this.isNode
			? dox.tsc.getTsSymbolFromNode.call(this, this.tsNode, checker)
			: (null as unknown as ts.Symbol);
	},
	tsType: function (this: TscWrapper, checker: ts.TypeChecker) {
		return checker.getTypeOfSymbol(this.tsSymbol);
	},
	alias: function (this: TscWrapper) {
		return ts.isImportOrExportSpecifier(this.tsNode)
			? this.tsNode.propertyName?.getText()
			: undefined;
	},
	moduleSpecifier: function (this: TscWrapper) {
		return dox.tsc.getModuleSpecifier(this.tsNode);
	},
	targetFileName: function (this: TscWrapper, checker: ts.TypeChecker) {
		const target = this.localTargetDeclaration;
		const get = target ? new TscWrapper(checker, target) : this;

		return get.moduleSpecifier
			? checker
					.getSymbolAtLocation(get.moduleSpecifier)
					?.valueDeclaration?.getSourceFile().fileName
			: undefined;
	},
	fileName: function (this: TscWrapper) {
		return this.tsNode.getSourceFile().fileName;
	},
	localTargetDeclaration: function (
		this: TscWrapper,
		checker: ts.TypeChecker,
	) {
		if (!(this.isExportSpecifier || this.isIdentifier)) return undefined;
		return dox.tsc.getLocalTargetDeclaration.call(
			this,
			this.tsNode as ts.Identifier | ts.ExportSpecifier,
			checker,
		);
	},
	callSignatures: function (this: TscWrapper) {
		return this.tsType.getCallSignatures();
	},
	nodeDeclarationText: function (this: TscWrapper) {
		const text = isRoot(this.tsNode).getText();
		return text;

		function isRoot(node: ts.Node) {
			if (ts.isSourceFile(node.parent)) return node;
			return isRoot(node.parent);
		}
	},
};
