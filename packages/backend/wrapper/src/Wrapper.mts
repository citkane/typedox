import ts from 'typescript';
import {
	TsWrapperInstanceCache,
	wrappedCache,
} from './WrapperInstanceCache.mjs';
import { isNodeOrSymbol, isSymbol, tsItem, utils } from './index.mjs';
import notices from './notices.mjs';
import { log } from '@typedox/logger';
import {
	nodeKindString,
	parseReportKey,
	reportKeys,
	symbolFlagString,
	tsWrapperReport,
	typeFlagString,
} from './wrapperUtils.mjs';

const __filename = log.getFilename(import.meta.url);
let cachedWrappers = new Map<ts.Node[], TsWrapper>();

/**
 * Provides a convenience dox API wrapper around the typescript compiler API.
 */
export class TsWrapper extends TsWrapperInstanceCache {
	error = false;
	constructor(checker: ts.TypeChecker, program: ts.Program, tsItem: tsItem) {
		super(checker, program);
		const { wrongType, unsuccessful } = notices.throw;

		if (!isNodeOrSymbol(tsItem)) wrongType.call(this, log.stackTracer());

		!isSymbol(tsItem) && this.cacheSet('tsNodes', tsItem);
		isSymbol(tsItem) && this.cacheSet('tsSymbol', tsItem);

		if (!this.tsNode || !this.tsNodes || !this.tsSymbol || !this.tsType) {
			unsuccessful.call(this, log.stackTracer(), tsItem);
		}
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
	public get escapedName() {
		return this.tsSymbol.escapedName;
	}
	/** The name alias, if any, of a `ts.Node` */
	public get alias(): wrappedCache['alias'] {
		return this.cacheGet('alias');
	}
	public get escapedAlias() {
		return this.alias ? ts.escapeLeadingUnderscores(this.alias) : undefined;
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
	/**
	 * The symbol (if any) within the same file for the declaration of a reference symbol
	 */
	public get localSymbol(): wrappedCache['localSymbol'] {
		return this.cacheGet('localSymbol');
	}
	/**
	 * The first symbol (if any) within or outside the file of a reference symbol chain
	 */
	public get immediatelyAliasedSymbol(): wrappedCache['immediateAliasedSymbol'] {
		return this.cacheGet('immediateAliasedSymbol');
	}
	public get target(): TsWrapper | undefined {
		const target = this.cacheGet('target') as ts.Symbol | undefined;
		if (!target || !target.name || target.name === 'unknown')
			return undefined;

		return TsWrapper.wrap(this.checker, this.program, target);
	}
	/**
	 * The last symbol (if any) within or outside the file of a reference symbol chain
	 */
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
	public get isSpecifierKind() {
		return utils.isSpecifierKind(this.kind);
	}
	public get isBindingElement() {
		return ts.isBindingElement(this.tsNode);
	}

	/** A pre-formatted simple report on the wrapped item. */
	public get report() {
		if (this.error) return undefined;
		const report: tsWrapperReport = {};
		reportKeys.forEach((key) => {
			const value = parseReportKey.call(this, key);
			value !== undefined && (report[key] = value);
		});

		return report;
	}
	private get cacheGet() {
		return this.cacheGetter.bind(null, this);
	}
	public static flushCache = () => {
		cachedWrappers.clear();
	};
	public static wrap(
		checker: ts.TypeChecker,
		program: ts.Program,
		tsItem: tsItem,
	): TsWrapper {
		const keyRef = getRef(tsItem);
		if (cachedWrappers.has(keyRef)) return cachedWrappers.get(keyRef)!;
		let wrapped: TsWrapper | undefined;
		try {
			wrapped = new TsWrapper(checker, program, keyRef);
			cachedWrappers.set(keyRef, wrapped);
		} catch (error: any) {
			wrapped ??= { error: true } as TsWrapper;
			//error.message && log.error(error);
			abort(checker, tsItem);
		}

		return wrapped;
		function getRef(item: tsItem) {
			if (isSymbol(item)) {
				return item.declarations! || [item.valueDeclaration!];
			} else {
				return item;
			}
		}
		function abort(checker: ts.TypeChecker, item: tsItem) {
			const symbol = getRef(item);
			symbol && cachedWrappers.delete(symbol);
		}
	}
}
