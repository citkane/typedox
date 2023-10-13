import * as ts from 'typescript';
import {
	TscWrapper,
	logger as log,
	tsItem,
	tsc as wrapUtils,
} from '../typedox';

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
	public cacheFlush = () =>
		(wrappers = new Map<ts.Node | ts.Symbol | ts.Type, TscWrapper>());
}

export type cache = {
	[K in keyof typeof cacheCallbacks]: ReturnType<(typeof cacheCallbacks)[K]>;
};
type wrapContainer = { wrapper: TscWrapper; checker: ts.TypeChecker };
let wrappers = new Map<ts.Node | ts.Symbol | ts.Type, TscWrapper>();

const cacheCallbacks = {
	tsNode: function (this: wrapContainer): ts.Node {
		const { wrapper, checker } = this;
		const node = wrapUtils.getNodeAndTypeFromSymbol(
			checker,
			wrapper.tsSymbol,
		).node;
		wrappers.set(node, wrapper);

		return node;
	},
	tsSymbol: function (this: wrapContainer): ts.Symbol {
		const { wrapper, checker } = this;
		const symbol = wrapUtils.getTsSymbolFromNode(checker, wrapper.tsNode);
		wrappers.set(symbol, wrapper);

		return symbol;
	},
	tsType: function (this: wrapContainer): ts.Type {
		const { wrapper, checker } = this;
		const type = wrapUtils.getNodeAndTypeFromSymbol(
			checker,
			wrapper.tsSymbol,
		).type;
		wrappers.set(type, wrapper);

		return type;
	},
	alias: function (this: wrapContainer) {
		const { wrapper } = this;
		return ts.isImportOrExportSpecifier(wrapper.tsNode)
			? wrapper.tsNode.propertyName?.getText()
			: undefined;
	},
	moduleSpecifier: function (this: wrapContainer) {
		const { wrapper } = this;
		return wrapUtils.getModuleSpecifier(wrapper.tsNode);
	},
	targetFileName: function (this: wrapContainer) {
		const { wrapper, checker } = this;
		const { tsNode, localDeclaration } = wrapper;
		const target = localDeclaration || tsNode;

		if (ts.isSourceFile(target)) return target.fileName;

		const get = wrap(checker, target);
		const { moduleSpecifier } = get;

		if (!moduleSpecifier) return undefined;

		const symbol = checker.getSymbolAtLocation(moduleSpecifier);
		const badFileName = `${
			wrapUtils.badFilePrefix
		}${moduleSpecifier.getText()}`;
		return (
			symbol?.valueDeclaration?.getSourceFile().fileName || badFileName
		);
	},
	fileName: function (this: wrapContainer) {
		const { wrapper } = this;
		return wrapper.tsNode.getSourceFile().fileName as string;
	},

	callSignatures: function (this: wrapContainer) {
		const { wrapper } = this;

		return wrapper.tsType.getCallSignatures();
	},
	nodeDeclarationText: function (this: wrapContainer) {
		const { wrapper, checker } = this;

		return rootNode(wrapper.tsNode).getText();

		function rootNode(node: ts.Node) {
			if (!node.parent || ts.isSourceFile(node.parent)) return node;
			return rootNode(node.parent);
		}
	},
	aliasedSymbol: function (this: wrapContainer) {
		const { wrapper, checker } = this;
		try {
			return checker.getAliasedSymbol(wrapper.tsSymbol);
		} catch (err) {
			return undefined;
		}
	},
	immediateAliasedSymbol: function (this: wrapContainer) {
		const { wrapper, checker } = this;
		try {
			return checker.getImmediateAliasedSymbol(wrapper.tsSymbol);
		} catch (err) {
			return undefined;
		}
	},
	localDeclaration: function (
		this: wrapContainer,
	): ts.Declaration | undefined {
		const { wrapper, checker } = this;
		const { tsNode } = wrapper;
		const { name, moduleReference } = tsNode as ts.ImportEqualsDeclaration;

		return ts.isExportSpecifier(tsNode)
			? declaration(tsNode)
			: ts.isImportEqualsDeclaration(tsNode)
			? declaration(moduleReference as ts.Identifier)
			: ts.isShorthandPropertyAssignment(tsNode) ||
			  ts.isPropertyAssignment(tsNode)
			? local(tsNode)
			: undefined;

		function local(
			assignment: ts.ShorthandPropertyAssignment | ts.PropertyAssignment,
		) {
			const name = assignment.name.getText();
			const file = assignment.getSourceFile();
			const { locals } = file as any;
			const symbol = (locals as Map<string, ts.Symbol>)?.get(name);

			return symbol && (symbol.declarations || [])[0];
		}
		function declaration(identifier: ts.Identifier | ts.ExportSpecifier) {
			const symbol =
				checker.getExportSpecifierLocalTargetSymbol(identifier);

			const declaration = symbol && (symbol.declarations || [])[0];
			const isSameFile =
				declaration &&
				wrapper.fileName === declaration.getSourceFile().fileName;

			return declaration && isSameFile ? declaration : undefined;
		}
	},
	target: function (this: wrapContainer) {
		const { wrapper, checker } = this;
		const { expression } = wrapper.tsNode as any;
		const target =
			wrapper.localDeclaration ||
			wrapper.immediatelyAliasedSymbol ||
			(expression as ts.Expression | undefined);

		return target ? target : undefined;
	},

	declaredModuleSymbols: function (this: wrapContainer) {
		const { wrapper, checker } = this;
		if (!ts.isModuleDeclaration(wrapper.tsNode)) return [];

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
