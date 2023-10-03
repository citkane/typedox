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
type wrapper = { wrapper: TscWrapper; checker: ts.TypeChecker };
const wrappers = new Map<ts.Node | ts.Symbol | ts.Type, TscWrapper>();

const cacheCallbacks = {
	tsNode: function (this: wrapper): ts.Node {
		const { wrapper, checker } = this;
		const node = tsc.getNodeAndTypeFromSymbol(
			checker,
			wrapper.tsSymbol,
		).node;
		wrappers.set(node, wrapper);

		return node;
	},
	tsSymbol: function (this: wrapper): ts.Symbol {
		const { wrapper, checker } = this;
		const symbol = tsc.getTsSymbolFromNode(checker, wrapper.tsNode);
		wrappers.set(symbol, wrapper);

		return symbol;
	},
	tsType: function (this: wrapper): ts.Type {
		const { wrapper, checker } = this;
		const type = tsc.getNodeAndTypeFromSymbol(
			checker,
			wrapper.tsSymbol,
		).type;
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
		if (target && ts.isSourceFile(target)) return target.fileName;
		const get = target ? wrap(checker, target) : wrapper;
		if (!get.moduleSpecifier) return undefined;

		return checker
			.getSymbolAtLocation(get.moduleSpecifier)
			?.valueDeclaration!.getSourceFile().fileName;
	},
	fileName: function (this: wrapper) {
		const { wrapper } = this;
		return wrapper.tsNode.getSourceFile().fileName as string;
	},
	localTargetDeclaration: function (this: wrapper) {
		const { wrapper, checker } = this;
		if (!wrapper.isIdentifier && !wrapper.isExportSpecifier)
			return undefined;
		return tsc.getLocalTargetDeclaration(
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
		try {
			return checker.getAliasedSymbol(wrapper.tsSymbol);
		} catch (err) {
			return undefined;
		}
	},
	immediateAliasedSymbol: function (this: wrapper) {
		const { wrapper, checker } = this;
		try {
			return checker.getImmediateAliasedSymbol(wrapper.tsSymbol);
		} catch (err) {
			return undefined;
		}
	},
	declaredModuleSymbols: function (this: wrapper) {
		const { wrapper, checker } = this;
		const exportSymbols = Array.from(
			wrapper.tsSymbol.exports?.values() || [],
		);
		const expressionSymbols = Array.from(
			(wrapper.tsNode as any).body?.statements || [],
		)
			.map((_node) => {
				const node = _node as ts.ExpressionStatement;
				return node.expression
					? checker.getSymbolAtLocation(node.expression)
					: undefined;
			})
			.filter((symbol) => !!symbol) as ts.Symbol[];
		const symbols = [...exportSymbols, ...expressionSymbols];
		return symbols;
	},
};

export function wrap(checker: ts.TypeChecker, item: tsItem): TscWrapper {
	const wrapped = !wrappers.has(item)
		? new TscWrapper(checker, item)
		: wrappers.get(item)!;
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
};
