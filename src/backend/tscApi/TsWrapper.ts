import * as dox from '../typedox';
import * as ts from 'typescript';
import TsWrapperCache from './TsWrapperCache';

export class TscWrapper extends dox.lib.Logger {
	private objectClass: string;
	private checker: ts.TypeChecker;
	private cacheGet: TsWrapperCache['cacheGet'];

	public tsNode: ts.Node;
	public tsSymbol: ts.Symbol;
	public tsType: ts.Type;

	constructor(
		checker: ts.TypeChecker,
		tsItem: ts.Node | ts.Symbol | ts.Type,
	) {
		super();
		this.checker = checker;
		this.objectClass = tsItem.constructor.name;

		const { cacheGet } = new TsWrapperCache(this, checker);
		const { tsNode, tsSymbol, tsType } = this.makeTsObjects(tsItem);

		this.cacheGet = cacheGet;
		this.tsNode = tsNode;
		this.tsSymbol = tsSymbol;
		this.tsType = tsType;
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
		return ts.SymbolFlags[this.symbolFlag] as symbolFlagString;
	}
	public get typeFlag() {
		return this.tsType.getFlags();
	}
	public get typeFlagString() {
		return ts.TypeFlags[this.typeFlag] as typeFlagString;
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
			? (ts.SyntaxKind[valueDeclaration.kind] as nodeKindString)
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

	/** A pre-formatted simple report on the scope. */
	public get report() {
		const keys: (keyof TscWrapper)[] = [
			'fileName',
			'targetFileName',
			'nodeText',
			'nodeDeclarationText',
			'localTargetDeclaration',
			'name',
			'alias',
			'kindString',
			'nodeFlagString',
			'symbolFlagString',
			'typeFlagString',
			'moduleSpecifier',
			'hasDeclarations',
			'hasValueDeclaration',
		];
		const report: Partial<Record<keyof TscWrapper, any>> = {};
		keys.forEach((key) => {
			let value = this[key];

			if (key === 'moduleSpecifier' && !!value)
				value = (value as ts.Node).getText();
			if (key === 'localTargetDeclaration' && !!value)
				value = (value as ts.Node).getText();
			value !== undefined ? (report[key] = value) : null;
		});
		return report;
	}
	public get isExportStarChild() {
		return (
			this.moduleSpecifier &&
			this.symbolFlag === ts.SymbolFlags.ValueModule &&
			this.kind === ts.SyntaxKind.StringLiteral
		);
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
	public static getModuleSpecifier = (
		node: ts.Node,
	): ts.Expression | undefined => {
		if ('moduleSpecifier' in node)
			return node.moduleSpecifier as ts.Expression;
		if (!!node.parent) return this.getModuleSpecifier(node.parent);
		return undefined;
	};

	public get isExportSpecifier() {
		return ts.isExportSpecifier(this.tsNode);
	}
	public get isIdentifier() {
		return ts.isIdentifier(this.tsNode);
	}

	private makeTsObjects(tsItem: ts.Node | ts.Symbol | ts.Type) {
		let tsNode!: ts.Node, tsSymbol!: ts.Symbol, tsType!: ts.Type;
		if (this.isNode) {
			tsNode = tsItem as ts.Node;
			tsSymbol = TscWrapper.getTsSymbolFromNode(tsNode, this.checker);
			tsType = this.checker.getTypeOfSymbol(tsSymbol);
		} else if (this.isSymbol) {
			tsSymbol = tsItem as ts.Symbol;
			tsNode = TscWrapper.getTsNodeFromSymbol(tsSymbol);
			tsType = this.checker.getTypeOfSymbol(tsSymbol);
		} else if (this.isType) {
			tsType = tsItem as ts.Type;
			tsSymbol = TscWrapper.getTsSymbolFromType(tsType);
			tsNode = TscWrapper.getTsNodeFromSymbol(tsSymbol);
		} else {
			this.error(
				this.classIdentifier,
				'A disallowed ts object was encountered:',
				this.objectClass,
			);
		}
		return { tsNode, tsSymbol, tsType };
	}
	public static getTsSymbolFromNode = (
		node: ts.Node,
		checker: ts.TypeChecker,
		fromName = false,
	): ts.Symbol => {
		if ('symbol' in node && !!node.symbol) return node.symbol as ts.Symbol;
		let symbol;
		try {
			symbol = checker.getSymbolAtLocation(node);
			if (!symbol)
				throw new Error(
					fromName
						? 'Could not get a ts.Symbol from the ts.Node'
						: 'Trying to get a ts.Symbol from tsNode.name',
				);
		} catch (error) {
			TscWrapper.debug(
				TscWrapper.classString(),
				(error as Error).message,
			);
			if (!fromName && 'name' in node)
				return this.getTsSymbolFromNode(
					(node as any)['name'],
					checker,
					true,
				);
		}
		return !!symbol
			? (symbol as ts.Symbol)
			: this.throwError('Could not create a ts.Symbol from a ts.Node');
	};
	public static getTsSymbolFromType = (type: ts.Type) => {
		const symbol = type.getSymbol();
		return symbol
			? symbol
			: TscWrapper.throwError(
					TscWrapper.classString(),
					'Unexpected error while getting a ts.Symbol from a ts.Type',
			  );
	};

	public static getTsNodeFromSymbol(symbol: ts.Symbol) {
		const declarations = symbol.getDeclarations();
		return declarations && declarations.length === 1
			? (declarations[0] as ts.Node)
			: this.throwError(
					this.classString(),
					'Unexpected error while getting a ts.Node form a ts.Symbol',
			  );
	}

	public static getLocalTargetDeclaration(
		declaration: ts.ExportSpecifier | ts.Identifier,
		checker: ts.TypeChecker,
	) {
		const declarations = checker
			.getExportSpecifierLocalTargetSymbol(declaration)
			?.getDeclarations();

		if (declarations && declarations.length > 1)
			TscWrapper.throwError(
				TscWrapper.classString(),
				'Expected only one declaration in a local target symbol',
			);
		return !!declarations ? declarations[0] : undefined;
	}
}

type symbolFlagString = keyof typeof ts.SymbolFlags;
type typeFlagString = keyof typeof ts.SymbolFlags;
type nodeKindString = keyof typeof ts.SyntaxKind;
