import * as dox from '../typedox';
import * as ts from 'typescript';
import TsWrapperCache from './TsWrapperCache';

const log = dox.logger;

/**
 * Provides a convenience dox API wrapper around the typescript compiler API.
 */
export class TscWrapper {
	private objectClass: string;
	private cacheGet: TsWrapperCache['cacheGet'];

	constructor(
		checker: ts.TypeChecker,
		tsItem: ts.Node | ts.Symbol | ts.Type,
	) {
		this.objectClass = tsItem.constructor.name;
		const { cacheGet, cacheSet } = new TsWrapperCache(this, checker);
		this.cacheGet = cacheGet;

		this.isNode && cacheSet<ts.Node>('tsNode', tsItem as ts.Node);
		this.isSymbol && cacheSet<ts.Symbol>('tsSymbol', tsItem as ts.Symbol);
		this.isType && cacheSet<ts.Type>('tsType', tsItem as ts.Type);
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
	public get tsNode() {
		return this.cacheGet<ts.Node>('tsNode');
	}
	public get tsSymbol() {
		return this.cacheGet<ts.Symbol>('tsSymbol');
	}
	public get tsType() {
		return this.cacheGet<ts.Type>('tsType');
	}
	/** The name of the `ts.Symbol` in scope */
	public get name() {
		return this.tsSymbol.name;
	}
	/** The name alias, if any, of a `ts.Node` */
	public get alias() {
		return <string | undefined>this.cacheGet('alias');
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
		return ts.SymbolFlags[this.symbolFlag] as dox.tsc.symbolFlagString;
	}
	public get typeFlag() {
		return this.tsType.getFlags();
	}
	public get typeFlagString() {
		return ts.TypeFlags[this.typeFlag] as dox.tsc.typeFlagString;
	}
	public get moduleSpecifier() {
		return <ts.Expression | undefined>this.cacheGet('moduleSpecifier');
	}
	public get targetFileName() {
		return <string | undefined>this.cacheGet('targetFileName');
	}

	/** The file path of the declaration in scope */
	public get fileName() {
		return <string>this.cacheGet('fileName');
	}
	public get localTargetDeclaration() {
		return <ts.Declaration | undefined>(
			this.cacheGet('localTargetDeclaration')
		);
	}

	public get callSignatures() {
		return <ts.Signature[]>this.cacheGet('callSignatures');
	}
	public get hasDeclarations() {
		const { declarations } = this.tsSymbol;
		return declarations ? declarations.length : false;
	}
	public get hasValueDeclaration() {
		const { valueDeclaration } = this.tsSymbol;
		return valueDeclaration
			? (ts.SyntaxKind[valueDeclaration.kind] as dox.tsc.nodeKindString)
			: false;
	}

	/** The string representation of the part of a declaration that is scope */
	public get nodeText() {
		return this.tsNode.getText();
	}
	/** The full string representation of a declaration ancestor where it is a direct child of the sourceFile. */
	public get nodeDeclarationText() {
		return <string>this.cacheGet('nodeDeclarationText');
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
		const report: dox.tsc.tscWrapperReport = {};

		dox.tsc.reportKeys.forEach((key) => {
			const value = dox.tsc.parseReportKey.call(this, key);
			value !== undefined && (report[key] = value);
		});

		return report;
	}
}
