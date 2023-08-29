import * as dox from '../typedox';
import * as ts from 'typescript';
import Logger from './Logger';
import { Dox } from './Dox';

type cacheKeys =
	| 'tsNode'
	| 'tsSymbol'
	| 'tsType'
	| 'moduleSpecifier'
	| 'targetFileName'
	| 'localTargetDeclaration'
	| 'nodeDeclarationText';

export default class WhatIsIt extends Logger {
	private objectClass: objectClasses;

	private tsItem?: dox.whatIsIt;
	private checker: ts.TypeChecker;

	private _cache = new Map<cacheKeys, any>();

	constructor(checker: ts.TypeChecker, tsItem: dox.whatIsIt) {
		super();
		this.checker = checker;
		this.objectClass = tsItem.constructor.name as objectClasses;
		this.tsItem = tsItem;
		if (this.isNode) {
			this._cache.set('tsNode', this.tsItem);
			this.parseNode(this.tsNode);
		}

		if (this.isSymbol) {
			this._cache.set('tsSymbol', this.tsItem);
		}

		if (this.isType) {
			this._cache.set('tsType', this.tsItem);
		}
		if (!this.isNode && !this.isSymbol && !this.isType)
			this.error(
				this.class,
				'ts object class not implemented:',
				this.objectClass,
			);
	}
	/** The name of the `ts.Symbol`, if any, or named `ts.Node` in scope */
	public get name() {
		return this.tsSymbol
			? this.tsSymbol.getName()
			: ts.isImportOrExportSpecifier(this.tsNode)
			? this.tsNode.name.getText()
			: ts.isIdentifier(this.tsNode)
			? this.tsNode.getText()
			: undefined;
	}
	/** The name alias, if any, of a `ts.Node` */
	public get alias() {
		return ts.isImportOrExportSpecifier(this.tsNode)
			? this.tsNode.propertyName?.getText()
			: undefined;
	}
	/** The `ts.Node` in scope */
	public get tsNode() {
		if (this._cache.has('tsNode'))
			return this._cache.get('tsNode') as ts.Node;

		const node = WhatIsIt.getTsNodeFromSymbol(this.tsSymbol);
		this.parseNode(node);
		this._cache.set('tsNode', node);

		return node as ts.Node;
	}
	/** The `ts.Symbol` in scope */
	public get tsSymbol() {
		if (this._cache.has('tsSymbol'))
			return this._cache.get('tsSymbol') as ts.Symbol;

		if (this.isType)
			this._cache.set(
				'tsSymbol',
				WhatIsIt.getTsSymbolFromType(this.tsType),
			);
		if (this.isNode)
			this._cache.set(
				'tsSymbol',
				WhatIsIt.getTsSymbolFromNode(this.tsNode, this.checker),
			);
		return this._cache.get('tsSymbol') as ts.Symbol;
	}
	/** The `ts.Type` in scope */
	public get tsType() {
		if (this._cache.has('tsType'))
			return this._cache.get('tsType') as ts.Type;

		this._cache.set('tsType', this.checker.getTypeOfSymbol(this.tsSymbol!));
		return this._cache.get('tsType') as ts.Type;
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

	/** The `ts.ModuleSpecifier`, if any, of the ts.Node in scope */
	public get moduleSpecifier() {
		if (this._cache.has('moduleSpecifier'))
			return this._cache.get('moduleSpecifier') as ts.Expression;
		const moduleSpecifier = this.getModuleSpecifier(this.tsNode);
		this._cache.set('moduleSpecifier', moduleSpecifier);
		return moduleSpecifier;
	}
	/** The file path of the declaration in scope */
	public get fileName() {
		return this.tsNode.getSourceFile().fileName;
	}
	/** The file path, if any, referenced by an import or export declaration in scope */
	public get targetFileName(): string | undefined {
		if (this._cache.has('targetFileName'))
			return this._cache.get('targetFileName') as string;
		const get = !this.localTargetDeclaration
			? this
			: new WhatIsIt(this.checker, this.localTargetDeclaration);
		const targetFileName = get.moduleSpecifier
			? get.checker
					.getSymbolAtLocation(get.moduleSpecifier)
					?.valueDeclaration?.getSourceFile().fileName
			: undefined;
		this._cache.set('targetFileName', targetFileName);
		return targetFileName;
	}
	/** The local `ts.Declaration`, if any, referenced by an export declaration in scope */
	public get localTargetDeclaration() {
		if (this._cache.has('localTargetDeclaration'))
			return this._cache.get('localTargetDeclaration') as ts.Declaration;
		if (!(this.isExportSpecifier || this.isIdentifier)) {
			this._cache.set('localTargetDeclaration', undefined);
			return undefined;
		}
		const localTargetSymbol = WhatIsIt.getLocalTargetDeclaration(
			this.tsNode as ts.Identifier | ts.ExportSpecifier,
			this.checker,
		);
		this._cache.set('localTargetDeclaration', localTargetSymbol);
		return localTargetSymbol;
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
		if (this._cache.has('nodeDeclarationText'))
			return this._cache.get('nodeDeclarationText') as string;

		const text = isRoot(this.tsNode).getText();
		this._cache.set('nodeDeclarationText', text);
		return text;

		function isRoot(node: ts.Node) {
			if (ts.isSourceFile(node.parent)) return node;
			return isRoot(node.parent);
		}
	}

	/** A pre-formatted simple report on the scope. */
	public get report() {
		const keys: (keyof WhatIsIt)[] = [
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
		const report: Partial<Record<keyof WhatIsIt, any>> = {};
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
	private get isNode() {
		return this.objectClass === 'NodeObject';
	}
	private get isSymbol() {
		return this.objectClass === 'SymbolObject';
	}
	private get isType() {
		return this.objectClass === 'TypeObject';
	}
	private getModuleSpecifier = (node: ts.Node): ts.Expression | undefined => {
		if ('moduleSpecifier' in node)
			return node.moduleSpecifier as ts.Expression;
		if (!!node.parent) return this.getModuleSpecifier(node.parent);
		return undefined;
	};

	private get isExportSpecifier() {
		return ts.isExportSpecifier(this.tsNode);
	}
	private get isIdentifier() {
		return ts.isIdentifier(this.tsNode);
	}
	private parseNode = (node: ts.Node) => {
		if (ts.isSourceFile(node))
			this.throwError(this.class, 'A `ts.SourceFile` is not allowed.');
	};

	private static getTsSymbolFromNode = (
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
			WhatIsIt.debug(WhatIsIt.class, (error as Error).message);
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
	private static getTsSymbolFromType = (type: ts.Type) => {
		const symbol = type.getSymbol();
		return symbol
			? symbol
			: WhatIsIt.throwError(
					WhatIsIt.class,
					'Unexpected error while getting a ts.Symbol from a ts.Type',
			  );
	};
	private static getTsNodeFromSymbol(symbol: ts.Symbol) {
		const declarations = symbol.getDeclarations();
		return declarations && declarations.length === 1
			? declarations[0]
			: this.throwError(
					this.class,
					'Unexpected error while getting a ts.Node form a ts.Symbol',
			  );
	}

	private static getLocalTargetDeclaration(
		declaration: ts.ExportSpecifier | ts.Identifier,
		checker: ts.TypeChecker,
	) {
		const declarations = checker
			.getExportSpecifierLocalTargetSymbol(declaration)
			?.getDeclarations();

		if (declarations && declarations.length > 1)
			WhatIsIt.throwError(
				WhatIsIt.class,
				'Expected only one declaration in a local target symbol',
			);
		return !!declarations ? declarations[0] : undefined;
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
