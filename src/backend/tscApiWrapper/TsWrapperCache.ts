import * as ts from 'typescript';
import { TscWrapper, logger as log, tsItem, tsc } from '../typedox';

export class TsWrapperCache {
	private _cache = {} as cache;
	protected checker: ts.TypeChecker;

	constructor(checker: ts.TypeChecker) {
		this.checker = checker;
	}

	protected cacheSet = (
		key: keyof cache,
		value: ts.Node | ts.Symbol | ts.Type,
	) => {
		this._cache[key] === undefined
			? (this._cache[key] = value as any)
			: notices.cacheSet.call(this, key);
	};

	protected cacheGetter = (wrapper: TscWrapper, key: keyof cache) => {
		return (this._cache[key] ??= cacheCallbacks[key].bind({
			wrapper,
			checker: this.checker,
		})() as any);
	};
}

export type cache = {
	[K in keyof typeof cacheCallbacks]: ReturnType<(typeof cacheCallbacks)[K]>;
};
const wrappers = new Map<ts.Node | ts.Symbol | ts.Type, TscWrapper>();
type wrapper = { wrapper: TscWrapper; checker: ts.TypeChecker };
const cacheCallbacks = {
	tsNode: function (this: wrapper): ts.Node {
		const { wrapper } = this;
		const node = tsc.getTsNodeFromSymbol.call(wrapper, wrapper.tsSymbol);
		wrappers.set(node, wrapper);

		return node;
	},
	tsSymbol: function (this: wrapper): ts.Symbol {
		const { wrapper, checker } = this;
		const symbol = wrapper.isType
			? tsc.getTsSymbolFromType.call(wrapper, wrapper.tsType)
			: wrapper.isNode
			? tsc.getTsSymbolFromNode.call(wrapper, wrapper.tsNode, checker)
			: notices.cacheCallbacks.tsSymbol.throw();
		wrappers.set(symbol, wrapper);

		return symbol;
	},
	tsType: function (this: wrapper): ts.Type {
		const { wrapper, checker } = this;
		const type = checker.getTypeOfSymbol(wrapper.tsSymbol);
		wrappers.set(type, wrapper);

		return type;
	},
	alias: function (this: wrapper) {
		const { wrapper } = this;
		return ts.isImportOrExportSpecifier(wrapper.tsNode)
			? wrapper.tsNode.propertyName?.getText()
			: undefined;
	},
	moduleSpecifier: function (this: wrapper) {
		const { wrapper } = this;
		return tsc.getModuleSpecifier(wrapper.tsNode);
	},
	targetFileName: function (this: wrapper) {
		const { wrapper, checker } = this;
		const target = wrapper.localTargetDeclaration;
		const get = target ? wrap(checker, target) : wrapper;

		if (!get.moduleSpecifier) return undefined;
		return checker
			.getSymbolAtLocation(get.moduleSpecifier)
			?.valueDeclaration?.getSourceFile().fileName;
	},
	fileName: function (this: wrapper) {
		const { wrapper } = this;
		return wrapper.tsNode.getSourceFile().fileName as string;
	},
	localTargetDeclaration: function (this: wrapper) {
		const { wrapper, checker } = this;
		if (!wrapper.isIdentifier && !wrapper.isExportSpecifier)
			return undefined;
		return tsc.getLocalTargetDeclaration.call(
			wrapper,
			wrapper.tsNode as ts.Identifier | ts.ExportSpecifier,
			checker,
		);
	},
	callSignatures: function (this: wrapper) {
		const { wrapper } = this;

		return wrapper.tsType.getCallSignatures();
	},
	nodeDeclarationText: function (this: wrapper) {
		const { wrapper, checker } = this;

		return rootNode(wrapper.tsNode).getText();

		function rootNode(node: ts.Node) {
			if (ts.isSourceFile(node.parent)) return node;
			return rootNode(node.parent);
		}
	},
	aliasedSymbol: function (this: wrapper) {
		const { wrapper, checker } = this;

		return checker.getAliasedSymbol(wrapper.tsSymbol);
	},
	immediateAliasedSymbol: function (this: wrapper) {
		const { wrapper, checker } = this;

		return checker.getImmediateAliasedSymbol(wrapper.tsSymbol);
	},
};

export function wrap(checker: ts.TypeChecker, item: tsItem): TscWrapper {
	const wrapped = wrappers.get(item) || new TscWrapper(checker, item);
	!wrappers.has(item) && wrappers.set(item, wrapped);

	return wrapped;
}

const notices = {
	cacheSet: function (this: TsWrapperCache, key: string) {
		log.error(
			log.identifier(this),
			'Tried to set existing cache key:',
			key,
		);
	},
	cacheCallbacks: {
		tsSymbol: {
			throw: function () {
				return log.throwError(
					log.identifier(__filename),
					'Could not find ts.Symbol',
				);
			},
		},
	},
};
