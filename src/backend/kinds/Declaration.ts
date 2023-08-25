import * as dox from '../typedox';
import * as ts from 'typescript';

export default class Declaration extends dox.lib.Dox {
	kind = dox.Kind.Declaration;
	tsKind?: ts.SyntaxKind;
	name: string;
	nameSpace?: string;
	fileName: string;
	symbol: ts.Symbol;
	parents: Declaration[] = [];
	children: dox.declarationMap = new Map();
	type: ts.Type;
	node?: ts.Node;
	aliasName?: string;
	private _alias?: Declaration;

	constructor(context: dox.lib.Context, symbol: ts.Symbol) {
		super(context);

		const { checker } = context;
		this.symbol = symbol;
		this.name = symbol.getName();
		this.fileName = this.sourceFile?.fileName!;
		this.node = symbol.valueDeclaration;
		this.type = this.checker.getTypeOfSymbol(symbol);
		this.tsKind = this.node?.kind;

		if (Declaration.isIgnored(this.node)) return;

		this.node && ts.isExportSpecifier(this.node)
			? this.parseExportSpecifier(this.node!)
			: this.node && ts.isModuleDeclaration(this.node)
			? this.parseModuleDeclaration(this.node!)
			: !!this.node
			? dox.log.object(this).warn('Unexpected node in a dox.Declaration:')
			: this.symbol.flags === ts.SymbolFlags.AliasExcludes
			? this.parseAlias()
			: dox.log
					.object(this)
					.warn('Unexpected dox.Declaration was not processed:');

		/*
		if (this.symbol.flags === ts.SymbolFlags.AliasExcludes) {
			const aliasSymbol = this.checker.getAliasedSymbol(this.symbol);
			const node = aliasSymbol.valueDeclaration;

			node && ts.isModuleDeclaration(node)
				? this.parseAliasModuleDeclaration(aliasSymbol)
				: this.parseAlias();
		} else {
			this.node && ts.isModuleDeclaration(this.node)
				? this.parseModuleDeclaration()
				: Declaration.isIgnored(this.node)
				? null
				: dox.log
						.object(this)
						.error('Unknown kind encountered in a dox.Declaration');
		}
		*/
	}

	private parseAlias() {
		//dox.log.object(this).info();
		this.symbol.getDeclarations()?.forEach((declaration) => {
			ts.isExportSpecifier(declaration)
				? this.parseExportSpecifier(declaration)
				: null;
		});
		/*
		const { getLocalNamespace } = dox.SourceFile;
		//const localNamespace = getLocalNamespace(this.checker, )
		const declaration = Declaration.findAliasDeclarationFromSymbol(
			this.symbol,
		);

		if (!declaration)
			return dox.log.warn(
				'Did not find an alias in dox.Declaration:',
				this.symbol.name,
			);

		ts.isNamespaceExport(declaration)
			? this.parseNamespaceExport(declaration)
			: ts.isExportSpecifier(declaration)
			? this.parseExportSpecifier(declaration)
			: ts.isExportDeclaration(declaration)
			? this.parseExportDeclaration(declaration)
			: dox.log.error(
					'Unknown alias encounter in a dox.Declaration: ',
					declaration,
			  );
			  */
	}
	/*
	private parseAliasModuleDeclaration(aliasSymbol: ts.Symbol) {
		this.nameSpace = this.name;
		this.tsKind = ts.SyntaxKind.ModuleDeclaration;
		//this._alias = new Declaration(this.context, aliasSymbol);
		//this.parseModuleDeclaration(this._alias);
	}
	*/
	private parseModuleDeclaration(module: ts.ModuleDeclaration) {
		this.nameSpace = module.name.getText();
		this.tsKind = module.kind;
	}
	/*
	private parseModuleDeclaration(self: dox.Declaration = this) {
		self.nameSpace = self.symbol.name;
		self.tsKind = ts.SyntaxKind.ModuleDeclaration;
	}
	*/
	private parseNamespaceImport = (declaration: ts.NamespaceImport) => {
		this.nameSpace = this.name;
		this.tsKind = declaration.kind;
	};
	private parseNamespaceExport = (declaration: ts.NamespaceExport) => {
		this.nameSpace = this.name;
		this.tsKind = declaration.kind;
	};

	private parseExportSpecifier(declaration: ts.ExportSpecifier) {
		const { getLocalTargetSymbol } = dox.SourceFile;
		const localTarget = getLocalTargetSymbol(this.checker, declaration);

		this.aliasName = declaration.propertyName?.getText();
		if (localTarget) {
			ts.isModuleDeclaration(localTarget)
				? this.parseModuleDeclaration(localTarget!)
				: localTarget && ts.isNamespaceImport(localTarget)
				? this.parseNamespaceImport(localTarget)
				: (this.tsKind = localTarget.kind);
		} else {
			dox.log
				.object(this)
				.warn('Unprocessed ts.ExportSpecifier in dox.Declaration');
		}
	}
	private parseExportDeclaration(declaration: ts.ExportDeclaration) {
		this.tsKind = declaration.kind;
	}

	private static findAliasDeclarationFromSymbol(symbol: ts.Symbol) {
		const name = symbol.getName();
		return symbol.getDeclarations()?.find((declaration) => {
			return (
				(ts.isExportSpecifier(declaration) ||
					ts.isNamespaceExport(declaration) ||
					ts.isExportDeclaration(declaration) ||
					ts.isModuleDeclaration(declaration)) &&
				declaration.name?.getText() === name
			);
		});
	}

	/*
	public get alias(): Declaration | undefined {
		if (this._alias) return this._alias;
		if (!!this.node) return undefined;
		if (this.aliasName && this.children.has(this.aliasName))
			return this.children.get(this.aliasName);
		const aliasSymbol = this.checker.getAliasedSymbol(this.symbol);
		this._alias = new Declaration(this.context, aliasSymbol);
		return this._alias;
	}
*/
	private static isIgnored = (node?: ts.Node) =>
		node &&
		(ts.isEnumDeclaration(node) ||
			ts.isClassDeclaration(node) ||
			ts.isVariableDeclaration(node) ||
			ts.isSourceFile(node) ||
			ts.isFunctionDeclaration(node));
}
