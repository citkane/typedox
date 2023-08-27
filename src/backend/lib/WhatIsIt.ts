import * as dox from '../typedox';
import * as ts from 'typescript';
import Logger from './Logger';
import { Dox } from './Dox';

export default class WhatIsIt extends Logger {
	public name?: string;
	public alias?: string;

	private objectClass: objectClasses;
	private tsItem?: dox.whatIsIt;
	private checker: ts.TypeChecker;
	private kind?: ts.SyntaxKind;
	private tsKindString?: nodeKindString;
	private symbolFlag?: ts.SymbolFlags;
	private symbolFlagString?: symbolFlagString;
	private typeFlag?: ts.TypeFlags;
	private typeFlagString?: typeFlagString;
	private hasDeclarations?: boolean | number;
	private hasValueDeclaration?: boolean | nodeKindString;
	private isExportSpecifier?: boolean;
	private isIdentifer?: boolean;

	private _node?: ts.Node;
	private _symbol?: ts.Symbol;
	private _type?: ts.Type;
	private _localTargetDeclaration?: ts.Declaration;
	private _moduleSpecifier?: ts.Expression;

	constructor(checker: ts.TypeChecker, tsItem?: dox.whatIsIt) {
		super();
		this.checker = checker;
		this.objectClass = tsItem
			? (tsItem.constructor.name as objectClasses)
			: undefined;
		if (!tsItem) return;
		this.tsItem = tsItem;
		if (this.isNode) {
			this._node = tsItem as ts.Node;
			this.parseNode(this._node);
		}
		if (this.isSymbol) {
			this._symbol = tsItem as ts.Symbol;
			this.parseSymbol(this._symbol);
		}
		if (this.isType) {
			this._type = tsItem as ts.Type;
			this.parseType(this._type);
		}
		if (!this.isNode && !this.isSymbol && !this.isType)
			this.error(
				this.class,
				'ts object class not implemented:',
				this.objectClass,
			);
	}
	private get isNode() {
		return ['NodeObject', 'SourceFileObject'].includes(this.objectClass!);
	}
	private get isSymbol() {
		return this.objectClass === 'SymbolObject';
	}
	private get isType() {
		return this.objectClass === 'TypeObject';
	}

	get tsNode() {
		if (this._node !== undefined) return this._node;
		const { getTsNodeFromSymbol, getTsNodeFromType } = WhatIsIt;
		const node = this.isNode
			? (this.tsItem as ts.Node)
			: this.isSymbol
			? getTsNodeFromSymbol(this.tsItem as ts.Symbol)
			: this.isType
			? getTsNodeFromType(this.tsItem as ts.Type)
			: false;
		if (!node) this.error(this.class, 'No ts.Node found', this.report);
		this._node = node as ts.Node;
		return this._node!;
	}
	get tsSymbol() {
		if (this._symbol !== undefined) return this._symbol;
		const symbol = this.isType ? this.tsType?.getSymbol() : false;
		this._symbol = symbol as ts.Symbol;
		return this._symbol || undefined;
	}
	get tsType() {
		if (this._type !== undefined) return this._type;
		return undefined;
	}
	get moduleSpecifier() {
		if (this._moduleSpecifier !== undefined) return this._moduleSpecifier;
		const moduleSpecifier = this.getModuleSpecifier(this.tsNode) || false;
		this._moduleSpecifier = moduleSpecifier as ts.Expression;
		return this._moduleSpecifier || undefined;
	}
	get localTargetDeclaration() {
		if (!(this.isExportSpecifier || this.isIdentifer)) return undefined;
		if (this._localTargetDeclaration !== undefined)
			return this._localTargetDeclaration;
		const localTargetSymbol =
			WhatIsIt.getLocalTargetDeclaration(
				this.checker,
				this.tsNode as ts.Identifier | ts.ExportSpecifier,
			) || false;
		this._localTargetDeclaration = localTargetSymbol as ts.Declaration;
		return this._localTargetDeclaration || undefined;
	}

	get kindString() {
		return ts.SyntaxKind[this.tsNode.kind] as keyof typeof ts.SyntaxKind;
	}
	get nodeText() {
		return this.tsNode.getText();
	}

	get report() {
		const report: Partial<Record<keyof WhatIsIt, any>> = {};
		Object.keys(this).forEach((k) => {
			const key = k as keyof WhatIsIt;

			if (
				key.startsWith('_') ||
				!!super[k as keyof Logger] ||
				[
					...Object.keys(new Logger()),
					'tsItem',
					'checker',
					'isExportSpecifier',
					'isIdentifier',
					'getModuleSpecifier',
				].includes(key)
			)
				return;
			const value = this[key];
			value ? (report[key] = value) : null;
		});
		return report;
	}

	private getModuleSpecifier = (node: ts.Node): ts.Expression | undefined => {
		if ('moduleSpecifier' in node)
			return node.moduleSpecifier as ts.Expression;
		if (!!node.parent) return this.getModuleSpecifier(node.parent);
		return undefined;
	};

	private parseNode(node: ts.Node) {
		this.kind = node.kind;
		this.tsKindString = ts.SyntaxKind[this.kind] as nodeKindString;

		if (ts.isExportSpecifier(node)) {
			this.isExportSpecifier = true;
			this.name = node.name.getText();
			this.alias = node.propertyName?.getText();
		}
		if (ts.isIdentifier(node)) {
			this.isIdentifer = true;
			this.name = node.getText();
		}
	}
	private parseSymbol(symbol: ts.Symbol) {
		this.name = symbol.getName();
		this.symbolFlag = symbol.getFlags();
		this.symbolFlagString = ts.SymbolFlags[
			this.symbolFlag
		] as typeFlagString;
		this.hasDeclarations = !!symbol.declarations
			? symbol.declarations.length
			: false;
		this.hasValueDeclaration = symbol.valueDeclaration
			? (ts.SyntaxKind[symbol.valueDeclaration.kind] as nodeKindString)
			: false;
		this.parseNode(this.tsNode);
	}
	private parseType(type: ts.Type) {
		this.typeFlag = type.getFlags();
		this.symbolFlagString = ts.TypeFlags[this.typeFlag] as symbolFlagString;

		const symbol = type.getSymbol();
		symbol
			? this.parseSymbol(symbol)
			: this.warn(
					this.class,
					'Symbol not found on a ts.Type',
					this.report,
			  );
	}
	private static getTsNodeFromSymbol(symbol: ts.Symbol) {
		const declarations = symbol.getDeclarations();
		return declarations && declarations.length === 1
			? declarations[0]
			: undefined;
	}
	private static getTsNodeFromType(type: ts.Type) {
		const symbol = type.getSymbol();
		return symbol ? WhatIsIt.getTsNodeFromSymbol(symbol) : undefined;
	}

	private static getLocalTargetDeclaration(
		checker: ts.TypeChecker,
		declaration: ts.ExportSpecifier | ts.Identifier,
	) {
		const declarations = checker
			.getExportSpecifierLocalTargetSymbol(declaration)
			?.getDeclarations();

		return declarations && declarations.length > 1
			? (Dox.warn(
					`[${this.name}]`,
					'Expected only one declaration in a local target symbol',
			  ) as undefined)
			: !!declarations
			? declarations[0]
			: undefined;
	}
}

type symbolFlagString = keyof typeof ts.SymbolFlags;
type typeFlagString = keyof typeof ts.SymbolFlags;
type nodeKindString = keyof typeof ts.SyntaxKind;
type objectClasses =
	| 'NodeObject'
	| 'SourceFileObject'
	| 'TypeObject'
	| 'SymbolObject'
	| undefined;
