import ts from 'typescript';
import notices from './notices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper, wrap } from './TsWrapper.mjs';
import {
	declared,
	getModuleSpecifier,
	getNodesAndTypeFromSymbol,
	getTsSymbolFromNodes,
} from './tsWrapperUtils.mjs';

const __filename = log.getFilename(import.meta.url);

export class TsWrapperCache {
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
		const { tsNode, localDeclaration, target } = wrapper;
		if (target) return target.fileName;

		const targetNode: ts.Node =
			localDeclaration?.valueDeclaration || tsNode;

		if (ts.isSourceFile(targetNode)) return targetNode.fileName;

		const wrapped = wrap(checker, program, targetNode);
		const moduleSpecifier = wrapped?.moduleSpecifier;

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
		const { wrapper } = this;

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
			const symbol = checker.getImmediateAliasedSymbol(wrapper.tsSymbol);
			return symbol;
		} catch (err) {
			return undefined;
		}
	},
	localDeclaration: function (this: wrapContainer): ts.Symbol | undefined {
		const { wrapper, checker, program } = this;
		const { tsNode } = wrapper;
		const { name, moduleReference } = tsNode as ts.ImportEqualsDeclaration;

		const symbol = ts.isExportSpecifier(tsNode)
			? declaration(tsNode)
			: ts.isImportEqualsDeclaration(tsNode)
			? declaration(moduleReference as ts.Identifier)
			: ts.isShorthandPropertyAssignment(tsNode) ||
			  ts.isPropertyAssignment(tsNode)
			? local(tsNode)
			: undefined;

		const wrapped = symbol && wrap(checker, program, symbol);
		return wrapped?.tsSymbol;

		function local(
			assignment: ts.ShorthandPropertyAssignment | ts.PropertyAssignment,
		) {
			const name = assignment.name.getText();
			const file = assignment.getSourceFile();
			const { locals } = file as any;
			const symbol = (locals as Map<string, ts.Symbol>)?.get(name);

			return symbol;
		}
		function declaration(identifier: ts.Identifier | ts.ExportSpecifier) {
			let symbol: ts.Symbol | undefined;
			try {
				symbol =
					checker.getExportSpecifierLocalTargetSymbol(identifier);
			} catch (error) {
				return undefined;
			}
			return symbol;
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
