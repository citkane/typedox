import * as ts from 'typescript';
import { TsWrapperCache } from './TsWrapperCache';
import { logger as log, tsc, tsItem } from '../typedox';

/**
 * Provides a convenience dox API wrapper around the typescript compiler API.
 */
export class TsWrapper extends TsWrapperCache {
	private objectClass: string;

	constructor(checker: ts.TypeChecker, tsItem: tsItem) {
		super(checker);
		this.objectClass = tsItem.constructor.name;

		if (!this.isNode && !this.isSymbol)
			notices.constructor.throw.wrongType(this, log.stackTracer());

		this.isNode && this.cacheSet('tsNode', tsItem as ts.Node);
		this.isSymbol && this.cacheSet('tsSymbol', tsItem as ts.Symbol);

		if (!this.tsNode || !this.tsSymbol || !this.tsType) {
			log.info(tsItem, ts.SyntaxKind[(tsItem as ts.Node).kind]);
			log.info({
				symbol: !!this.tsSymbol,
				node: !!this.tsNode,
				//type: !!this.tsType,
			});
			notices.constructor.throw.unsuccessful(
				this,
				log.stackTracer(),
				tsItem,
			);
		}
	}
	public get cacheGet() {
		return this.cacheGetter.bind(null, this);
	}
	public get isNode() {
		return (
			this.objectClass === 'NodeObject' ||
			this.objectClass === 'IdentifierObject'
		);
	}
	public get isSymbol() {
		return this.objectClass === 'SymbolObject';
	}

	/*
	public get isType() {
		return this.objectClass === 'TypeObject';
	}
	*/
	public get tsNode(): tsc.cache['tsNode'] {
		return this.cacheGet('tsNode');
	}
	public get tsSymbol(): tsc.cache['tsSymbol'] {
		return this.cacheGet('tsSymbol') as tsc.cache['tsSymbol'];
	}
	public get tsType(): tsc.cache['tsType'] {
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
	public get alias(): tsc.cache['alias'] {
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
		return ts.SymbolFlags[this.symbolFlag] as tsc.symbolFlagString;
	}
	public get typeFlag() {
		return this.tsType.getFlags();
	}
	public get typeFlagString() {
		return ts.TypeFlags[this.typeFlag] as tsc.typeFlagString;
	}
	public get moduleSpecifier(): tsc.cache['moduleSpecifier'] {
		return this.cacheGet('moduleSpecifier');
	}
	public get targetFileName(): tsc.cache['targetFileName'] {
		return this.cacheGet('targetFileName');
	}
	/** The file path of the declaration in scope */
	public get fileName(): tsc.cache['fileName'] {
		return this.cacheGet('fileName');
	}
	public get localDeclaration(): tsc.cache['localDeclaration'] {
		return this.cacheGet('localDeclaration');
	}
	public get immediatelyAliasedSymbol(): tsc.cache['immediateAliasedSymbol'] {
		return this.cacheGet('immediateAliasedSymbol');
	}
	public get target(): TsWrapper | undefined {
		const target = this.cacheGet('target');
		return target ? tsc.wrap(this.checker, target) : undefined;
	}
	public get aliasedSymbol(): tsc.cache['aliasedSymbol'] {
		return this.cacheGet('aliasedSymbol');
	}
	public get declaredModuleSymbols(): tsc.cache['declaredModuleSymbols'] {
		return this.cacheGet('declaredModuleSymbols');
	}
	public get callSignatures(): tsc.cache['callSignatures'] {
		return this.cacheGet('callSignatures');
	}

	public get hasValueDeclaration() {
		const { valueDeclaration } = this.tsSymbol;
		return valueDeclaration
			? (ts.SyntaxKind[valueDeclaration.kind] as tsc.nodeKindString)
			: false;
	}

	/** The string representation of the part of a declaration that is scope */
	public get nodeText() {
		return this.tsNode.getText();
	}
	/** The full string representation of a declaration ancestor where it is a direct child of the sourceFile. */
	public get nodeDeclarationText(): tsc.cache['nodeDeclarationText'] {
		return this.cacheGet('nodeDeclarationText');
	}
	/*
	public get isReExport() {
		const { ValueModule, ExportStar } = ts.SymbolFlags;
		const symbolFlags = [ValueModule, ExportStar];
		const { StringLiteral, ExportDeclaration } = ts.SyntaxKind;
		const kinds = [StringLiteral, ExportDeclaration];

		const hasFlags =
			symbolFlags.includes(this.symbolFlag) ||
			!ts.SymbolFlags[this.symbolFlag];

		return !!this.moduleSpecifier && hasFlags && kinds.includes(this.kind);
	}
*/
	public get isExportSpecifier() {
		return ts.isExportSpecifier(this.tsNode);
	}
	public get isIdentifier() {
		return ts.isIdentifier(this.tsNode);
	}

	/** A pre-formatted simple report on the scope. */
	public get report() {
		const report: tsc.tsWrapperReport = {};

		tsc.reportKeys.forEach((key) => {
			const value = tsc.parseReportKey.call(this, key);
			value !== undefined && (report[key] = value);
		});

		return report;
	}
}

const notices = {
	constructor: {
		throw: {
			wrongType: (wrapper: TsWrapper, trace: string) =>
				log.throwError(
					log.identifier(wrapper),
					`Expected a Node or Symbol, got a: ${
						(wrapper as any).objectClass
					}`,
					trace,
				),
			unsuccessful: (
				wrapper: TsWrapper,
				trace: string,
				tsItem: tsItem,
			) => {
				const objectClass = (wrapper as any).objectClass;
				const descriptor =
					objectClass === 'SymbolObject'
						? (tsItem as ts.Symbol).name
						: (tsItem as ts.Node).getText();
				log.throwError(
					log.identifier(wrapper),
					`Did not wrap a ${objectClass}:`,
					descriptor,
					trace,
				);
			},
		},
	},
};
