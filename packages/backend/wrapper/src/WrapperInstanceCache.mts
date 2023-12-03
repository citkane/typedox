import ts, { __String } from 'typescript';
import notices from './notices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper } from './Wrapper.mjs';
import {
	declared,
	getModuleSpecifier,
	getNodesAndTypeFromSymbol,
	getTsSymbolFromNodes,
} from './wrapperUtils.mjs';
import path from 'path';

const __filename = log.getFilename(import.meta.url);

export class TsWrapperInstanceCache {
	private instanceCache = {} as wrappedCache;
	protected program: ts.Program;
	protected checker: ts.TypeChecker;

	constructor(checker: ts.TypeChecker, program: ts.Program) {
		this.checker = checker;
		this.program = program;
	}

	protected cacheSet = (
		key: keyof wrappedCache,
		value: ts.Node[] | ts.Symbol,
	) => {
		this.instanceCache[key] === undefined
			? (this.instanceCache[key] = value as any)
			: notices.cacheSet.call(this, key);
	};

	protected cacheGetter = (wrapper: TsWrapper, key: keyof wrappedCache) => {
		return (this.instanceCache[key] ??= cacheCallbacks[key].bind({
			wrapper,
			checker: this.checker,
			program: this.program,
		})() as any);
	};
}

export type wrappedCache = {
	[K in keyof typeof cacheCallbacks]: ReturnType<(typeof cacheCallbacks)[K]>;
};
type wrapContainer = {
	wrapper: TsWrapper;
	checker: ts.TypeChecker;
	program: ts.Program;
};

const cacheCallbacks = {
	tsNodes: function (this: wrapContainer): ts.Node[] {
		const { wrapper, checker } = this;
		const { nodes, type } = getNodesAndTypeFromSymbol(
			checker,
			wrapper.tsSymbol,
		);

		if (!nodes?.length && !type) {
			notices.throw.wrapError.call(
				wrapper,
				wrapper.tsSymbol,
				'No declarations found on symbol',
			);
		}

		return nodes || [declared(wrapper.tsSymbol).typeAlias!];
	},
	tsNode: function (this: wrapContainer): ts.Node {
		const { wrapper } = this;
		const node = wrapper.tsSymbol.valueDeclaration || wrapper.tsNodes[0];

		return node;
	},
	tsSymbol: function (this: wrapContainer): ts.Symbol {
		const { wrapper, checker } = this;
		const symbol = getTsSymbolFromNodes(checker, wrapper.tsNodes);
		//wrappers.set(symbol, wrapper);

		return symbol;
	},
	tsType: function (this: wrapContainer): ts.Type {
		const { wrapper, checker } = this;
		const type = getNodesAndTypeFromSymbol(checker, wrapper.tsSymbol).type;
		//wrappers.set(type, wrapper);

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
		return getModuleSpecifier(wrapper.tsNode);
	},
	targetFileName: function (this: wrapContainer) {
		const { wrapper, checker, program } = this;
		const { tsNode, target } = wrapper;

		const moduleSpecifier = getModuleSpecifier(tsNode);

		if (moduleSpecifier) {
			const symbol = checker.getSymbolAtLocation(moduleSpecifier);
			let fileName = symbol?.valueDeclaration?.getSourceFile().fileName;
			fileName = fileName && path.resolve(fileName);
			if (fileName) return fileName;

			const { text } = moduleSpecifier as any;
			fileName =
				ts.resolveModuleName(
					text as string,
					moduleSpecifier.getSourceFile().fileName,
					program.getCompilerOptions(),
					ts.sys,
				).resolvedModule?.resolvedFileName || (text as string);

			fileName = fileName && path.resolve(fileName);
			return fileName;
		}
		if (target) return path.resolve(target.fileName);
		if (ts.isSourceFile(tsNode)) return path.resolve(tsNode.fileName);
	},
	fileName: function (this: wrapContainer) {
		const { wrapper } = this;
		const fileName = wrapper.tsNode.getSourceFile().fileName as string;
		return path.resolve(fileName);
	},
	callSignatures: function (this: wrapContainer) {
		const { wrapper } = this;
		return wrapper.tsType.getCallSignatures();
	},
	nodeDeclarationText: function (this: wrapContainer) {
		const { wrapper } = this;

		return rootNode(wrapper.tsNode).getText();

		function rootNode(node: ts.Node): ts.Node {
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
			const symbol = checker.getImmediateAliasedSymbol(wrapper.tsSymbol);
			return symbol;
		} catch (err) {
			return undefined;
		}
	},

	localSymbol: function (this: wrapContainer): ts.Symbol | undefined {
		const { wrapper, checker } = this;

		const fileSource = wrapper.tsNode.getSourceFile();
		const locals = (fileSource as any).locals as
			| Map<string, ts.Symbol>
			| undefined;

		if (!locals) return undefined;
		const localSymbol = locals.get(wrapper.name);
		return !!localSymbol?.valueDeclaration ? localSymbol : undefined;
	},
	target: function (this: wrapContainer): ts.Symbol | undefined {
		const { wrapper, checker, program } = this;
		const target =
			wrapper.localSymbol ||
			wrapper.immediatelyAliasedSymbol ||
			wrapper.aliasedSymbol;

		return target ? target : undefined;
	},

	declaredModuleSymbols: function (this: wrapContainer) {
		const { wrapper, checker } = this;
		if (!ts.isModuleDeclaration(wrapper.tsNodes[0])) return undefined;

		const exportSymbols = Array.from(
			wrapper.tsSymbol.exports?.values() || [],
		);
		const expressionSymbols = wrapper.tsNodes.reduce(
			(accumulator, node) => {
				const statements: ts.ExpressionStatement[] =
					(node as any).body?.statements || [];
				statements.forEach((statement) => {
					const { expression } = statement;
					const symbol =
						expression && checker.getSymbolAtLocation(expression);
					symbol && accumulator.push(symbol);
				});
				return accumulator;
			},
			[] as ts.Symbol[],
		);
		const symbols = [...exportSymbols, ...expressionSymbols];

		return symbols;
	},
};
