import ts from 'typescript';
import {
	TsWrapper,
	log as log,
	tsItem,
	tsc as wrapUtils,
} from '../typedox.mjs';

export class TsWrapperCache {
	private instanceCache = {} as cache;
	protected program: ts.Program;
	protected checker: ts.TypeChecker;

	constructor(checker: ts.TypeChecker, program: ts.Program) {
		this.checker = checker;
		this.program = program;
	}

	protected cacheSet = (
		key: keyof cache,
		value: ts.Node | ts.Symbol | ts.Type,
	) => {
		this.instanceCache[key] === undefined
			? (this.instanceCache[key] = value as any)
			: notices.cacheSet.call(this, key);
	};

	protected cacheGetter = (wrapper: TsWrapper, key: keyof cache) => {
		return (this.instanceCache[key] ??= cacheCallbacks[key].bind({
			wrapper,
			checker: this.checker,
			program: this.program,
		})() as any);
	};
	public cacheFlush = () =>
		(wrappers = new Map<ts.Node | ts.Symbol | ts.Type, TsWrapper>());
}

export type cache = {
	[K in keyof typeof cacheCallbacks]: ReturnType<(typeof cacheCallbacks)[K]>;
};
type wrapContainer = {
	wrapper: TsWrapper;
	checker: ts.TypeChecker;
	program: ts.Program;
};
let wrappers = new Map<ts.Node | ts.Symbol | ts.Type, TsWrapper>();

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
		const { wrapper, checker, program } = this;
		const { tsNode, localDeclaration } = wrapper;
		const target = localDeclaration || tsNode;

		if (ts.isSourceFile(target)) return target.fileName;

		const wrapped = wrap(checker, program, target);
		const { moduleSpecifier } = wrapped;

		if (!moduleSpecifier) return undefined;

		const symbol = checker.getSymbolAtLocation(moduleSpecifier);
		let fileName = symbol?.valueDeclaration?.getSourceFile().fileName;
		if (fileName) return fileName;
		const { text } = moduleSpecifier as any;
		fileName =
			ts.resolveModuleName(
				text as string,
				moduleSpecifier.getSourceFile().fileName,
				program.getCompilerOptions(),
				ts.sys,
			).resolvedModule?.resolvedFileName || (text as string);

		//const badFileName = `${wrapUtils.badFilePrefix}${fileName}`;
		//log.info(badFileName);
		return fileName;
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
			wrapper.localDeclaration || wrapper.immediatelyAliasedSymbol; //||
		//(expression as ts.Expression | undefined);

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

export function wrap(
	checker: ts.TypeChecker,
	program: ts.Program,
	item: tsItem,
): TsWrapper {
	const node = getNode(item);
	if (!node) notices.wrapError(item);
	if (wrappers.has(node)) return wrappers.get(node)!;

	const wrapped = new TsWrapper(checker, program, item);
	wrappers.set(node, wrapped);

	return wrapped;

	function getNode(item: tsItem) {
		return item.constructor.name === 'SymbolObject'
			? (item as ts.Symbol).declarations![0]
			: (item as ts.Node);
	}
}

const notices = {
	cacheSet: function (this: TsWrapperCache, key: string) {
		log.error(
			log.identifier(this),
			'Tried to set existing cache key:',
			key,
		);
	},
	wrapError: function (item: tsItem) {
		log.error(
			log.identifier(TsWrapperCache),
			'Did not get a ts.Node to identify the wrapper',
			item.constructor.name,
		);
	},
};
