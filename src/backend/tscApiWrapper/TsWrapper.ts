import * as ts from 'typescript';
import { TsWrapperCache } from './TsWrapperCache';
import { logger as log, tsc } from '../typedox';

/**
 * Provides a convenience dox API wrapper around the typescript compiler API.
 */
export class TscWrapper extends TsWrapperCache {
	private objectClass: string;

	constructor(
		checker: ts.TypeChecker,
		tsItem: ts.Node | ts.Symbol | ts.Type,
	) {
		super(checker);
		this.objectClass = tsItem.constructor.name;

		this.isNode && this.cacheSet('tsNode', tsItem as ts.Node);
		this.isSymbol && this.cacheSet('tsSymbol', tsItem as ts.Symbol);
		this.isType && this.cacheSet('tsType', tsItem as ts.Type);
	}
	public get cacheGet() {
		return this.cacheGetter.bind(null, this);
	}
	public get isNode() {
		return this.objectClass === 'NodeObject';
	}
	public get isSymbol() {
		return this.objectClass === 'SymbolObject';
	}
	public get isType() {
		return this.objectClass === 'TypeObject';
	}
	public get tsNode(): tsc.cache['tsNode'] {
		return this.cacheGet('tsNode');
	}
	public get tsSymbol(): tsc.cache['tsSymbol'] {
		return this.cacheGet('tsSymbol') as tsc.cache['tsSymbol'];
	}
	public get tsType(): tsc.cache['tsType'] {
		return this.cacheGet('tsType');
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
	public get localTargetDeclaration(): tsc.cache['localTargetDeclaration'] {
		return this.cacheGet('localTargetDeclaration');
	}
	public get aliasedSymbol(): tsc.cache['aliasedSymbol'] {
		return this.cacheGet('aliasedSymbol');
	}
	public get immediatelyAliasedSymbol(): tsc.cache['immediateAliasedSymbol'] {
		return this.cacheGet('immediateAliasedSymbol');
	}
	public get callSignatures(): tsc.cache['callSignatures'] {
		return this.cacheGet('callSignatures');
	}
	public get hasDeclarations() {
		const { declarations } = this.tsSymbol;
		return declarations ? declarations.length : false;
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

	public get isExportStarChild() {
		return (
			this.moduleSpecifier &&
			this.symbolFlag === ts.SymbolFlags.ValueModule &&
			this.kind === ts.SyntaxKind.StringLiteral
		);
	}

	public get isExportSpecifier() {
		return ts.isExportSpecifier(this.tsNode);
	}
	public get isIdentifier() {
		return ts.isIdentifier(this.tsNode);
	}

	/** A pre-formatted simple report on the scope. */
	public get report() {
		const report: tsc.tscWrapperReport = {};

		tsc.reportKeys.forEach((key) => {
			const value = tsc.parseReportKey.call(this, key);
			value !== undefined && (report[key] = value);
		});

		return report;
	}
}

const notices = {};
