import ts from 'typescript';
import { TsWrapperCache, wrappedCache } from './TsWrapperCache.mjs';
import { isNode, isNodeOrSymbol, isSymbol, tsItem } from './index.mjs';
import notices from './notices.mjs';
import { log } from '@typedox/logger';
import {
	nodeKindString,
	parseReportKey,
	reportKeys,
	symbolFlagString,
	tsWrapperReport,
	typeFlagString,
} from './tsWrapperUtils.mjs';

const __filename = log.getFilename(import.meta.url);
let cachedWrappers = new Map<ts.Symbol | ts.Node, TsWrapper>();

/**
 * Provides a convenience dox API wrapper around the typescript compiler API.
 */
export class TsWrapper extends TsWrapperCache {
	constructor(checker: ts.TypeChecker, program: ts.Program, tsItem: tsItem) {
		super(checker, program);
		const { wrongType, unsuccessful } = notices.throw;

		if (!isNodeOrSymbol(tsItem)) wrongType(this, log.stackTracer());

		isNode(tsItem) && this.cacheSet('tsNodes', [tsItem]);
		isSymbol(tsItem) && this.cacheSet('tsSymbol', tsItem);

		if (!this.tsNodes || !this.tsSymbol || !this.tsType) {
			unsuccessful(this, log.stackTracer(), tsItem);
		}
	}
	public cacheFlush = () => {
		cachedWrappers = new Map<ts.Symbol | ts.Node, TsWrapper>();
	};
	public get cacheGet() {
		return this.cacheGetter.bind(null, this);
	}
	public get tsNodes(): wrappedCache['tsNodes'] {
		return this.cacheGet('tsNodes');
	}
	public get tsNode(): wrappedCache['tsNode'] {
		return this.cacheGet('tsNode');
	}
	public get tsSymbol(): wrappedCache['tsSymbol'] {
		return this.cacheGet('tsSymbol') as wrappedCache['tsSymbol'];
	}
	public get tsType(): wrappedCache['tsType'] {
		return this.cacheGet('tsType');
	}
	public get nodeExpression() {
		return 'expression' in this.tsNode
			? (this.tsNode.expression as ts.Expression)
			: undefined;
	}
	public get nodeName() {
		return 'name' in this.tsNode
			? (this.tsNode.name as ts.Identifier)
			: undefined;
	}
	/** The name of the `ts.Symbol` in scope */
	public get name() {
		return this.tsSymbol.name;
	}
	/** The name alias, if any, of a `ts.Node` */
	public get alias(): wrappedCache['alias'] {
		return this.cacheGet('alias');
	}

	public get kind() {
		return this.tsNode.kind;
	}
	/** String name of the `ts.Node` `ts.SyntaxKind` in scope */
	public get kindString() {
		return ts.SyntaxKind[this.tsNode.kind] as keyof typeof ts.SyntaxKind;
	}
	public get nodeFlag() {
		return this.tsNode.flags;
	}
	public get nodeFlagString() {
		return ts.NodeFlags[this.tsNode.flags];
	}
	public get symbolFlag() {
		return this.tsSymbol.flags;
	}
	public get symbolFlagString() {
		return ts.SymbolFlags[this.symbolFlag] as symbolFlagString;
	}
	public get typeFlag() {
		return this.tsType.getFlags();
	}
	public get typeFlagString() {
		return ts.TypeFlags[this.typeFlag] as typeFlagString;
	}
	public get moduleSpecifier(): wrappedCache['moduleSpecifier'] {
		return this.cacheGet('moduleSpecifier');
	}
	public get targetFileName(): wrappedCache['targetFileName'] {
		return this.cacheGet('targetFileName');
	}
	/** The file path of the declaration in scope */
	public get fileName(): wrappedCache['fileName'] {
		return this.cacheGet('fileName');
	}
	public get localDeclaration(): wrappedCache['localDeclaration'] {
		return this.cacheGet('localDeclaration');
	}
	public get immediatelyAliasedSymbol(): wrappedCache['immediateAliasedSymbol'] {
		return this.cacheGet('immediateAliasedSymbol');
	}
	public get target(): TsWrapper | undefined {
		const target = this.cacheGet('target');
		return target ? wrap(this.checker, this.program, target) : undefined;
	}
	public get aliasedSymbol(): wrappedCache['aliasedSymbol'] {
		return this.cacheGet('aliasedSymbol');
	}
	public get declaredModuleSymbols(): wrappedCache['declaredModuleSymbols'] {
		return this.cacheGet('declaredModuleSymbols');
	}
	public get callSignatures(): wrappedCache['callSignatures'] {
		return this.cacheGet('callSignatures');
	}

	public get hasValueDeclaration() {
		const { valueDeclaration } = this.tsSymbol;
		return valueDeclaration
			? (ts.SyntaxKind[valueDeclaration.kind] as nodeKindString)
			: false;
	}

	/** The string representation of the part of a declaration that is scope */
	public get nodeText() {
		return this.tsNodes.length === 1
			? this.tsNode.getText()
			: this.tsNodes.reduce((accumulator, node) => {
					accumulator += `${node.getText()}\n`;
					return accumulator;
			  }, '');
	}
	/** The full string representation of a declaration ancestor where it is a direct child of the sourceFile. */
	public get nodeDeclarationText(): wrappedCache['nodeDeclarationText'] {
		return this.cacheGet('nodeDeclarationText');
	}
	public get isExportSpecifier() {
		return ts.isExportSpecifier(this.tsNode);
	}
	public get isIdentifier() {
		return ts.isIdentifier(this.tsNode);
	}

	/** A pre-formatted simple report on the wrapped item. */
	public get report() {
		const report: tsWrapperReport = {};

		reportKeys.forEach((key) => {
			const value = parseReportKey.call(this, key);
			value !== undefined && (report[key] = value);
		});

		return report;
	}
}
export function wrap(
	checker: ts.TypeChecker,
	program: ts.Program,
	tsItem: tsItem,
): TsWrapper | undefined {
	const keyRef = getRef(checker, tsItem);
	if (cachedWrappers.has(keyRef)) return cachedWrappers.get(keyRef)!;
	let wrapped: TsWrapper | undefined;
	try {
		wrapped = new TsWrapper(checker, program, keyRef);
		cachedWrappers.set(keyRef, wrapped);
	} catch (error: any) {
		error.message && log.error(error);
		abort(checker, tsItem);
		wrapped = undefined;
	}

	return wrapped;
}
function getRef(checker: ts.TypeChecker, item: tsItem) {
	if (isNode(item)) {
		const symbol =
			'symbol' in item
				? (item.symbol as ts.Symbol)
				: checker.getSymbolAtLocation(item);
		return symbol || item;
	} else {
		return item;
	}
}
function abort(checker: ts.TypeChecker, item: tsItem) {
	const symbol = getRef(checker, item);
	symbol && cachedWrappers.delete(symbol);
}
