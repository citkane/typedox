import * as dox from '../typedox';
import * as ts from 'typescript';

export default class Declaration extends dox.lib.Dox {
	kind = dox.Kind.Declaration;
	tsKind?: ts.SyntaxKind;
	name: string;
	alias?: dox.referencedExport;
	nameSpace?: string;
	fileName: string;
	symbol: ts.Symbol;
	parents: dox.Declaration[] = [];
	children: dox.declarationMap = new Map();
	type: ts.Type;
	node?: ts.Node;

	//serialise = () => new Object();
	constructor(context: dox.lib.Context, symbol: ts.Symbol) {
		super(context);
		this.name = symbol.getName();
		this.fileName = this.sourceFile?.fileName!;
		this.node = symbol.valueDeclaration;
		this.symbol = symbol;
		this.type = this.checker.getTypeOfSymbol(symbol);
		this.tsKind = this.node?.kind;
		if (symbol.flags === ts.SymbolFlags.AliasExcludes) {
			const alias = symbol.declarations?.find((alias) =>
				Declaration.isDeclarationTheAlias(alias, this.symbol),
			);
			dox.log.info({
				node: ts.SyntaxKind[alias!.kind],
				type: ts.TypeFlags[this.type.flags],
				symbol: ts.SymbolFlags[this.symbol.flags],
				text: alias?.parent.getText(),
			});
			/*
			dox.log.info(
				ts.isExportDeclaration(alias!),
				ts.isExportSpecifier(alias!),
				ts.isNamespaceExport(alias!),
			);
			*/
			if (!!alias && ts.isExportDeclaration(alias)) {
				//dox.log.info(this.symbol);
				this.isExportDeclaration(alias);
				return;
			}
			if (!!alias && ts.isExportSpecifier(alias)) {
				this.isExportSpecifier(alias);
				return;
			}

			if (!!alias && ts.isNamespaceExport(alias)) {
				this.isNamespaceExport(alias);
				return;
			}

			dox.log.error(
				'No ts.SymbolFlags.AliasExcludes was found for a dox.declaration:',
				this.symbol.name,
			);
			return;
		}
		if (!symbol.valueDeclaration) {
			dox.log.error(
				'No ts.Symbol.valueDeclaration was found for a dox.declaration:',
				this.symbol.name,
			);
		}

		//this.setSerialiser();
	}
	isExportSpecifier(alias: ts.ExportSpecifier) {
		//dox.log.info(alias.parent.parent.getText());
		this.alias = alias;
		this.tsKind = ts.SyntaxKind.ExportSpecifier;
	}
	isNamespaceExport(alias: ts.NamespaceExport) {
		this.alias = alias;
		this.nameSpace = this.name;
		this.tsKind = ts.SyntaxKind.NamespaceExport;
	}
	isExportDeclaration(alias: ts.ExportDeclaration) {
		//dox.log.info(alias.parent.getText());
		this.tsKind = ts.SyntaxKind.ExportDeclaration;
	}

	private static isDeclarationTheAlias(
		alias: ts.Declaration,
		symbol: ts.Symbol,
	) {
		const name = symbol.getName();
		if (
			ts.isExportSpecifier(alias) ||
			ts.isNamespaceExport(alias) ||
			ts.isExportDeclaration(alias)
		)
			return alias.name?.getText() === name;

		return false;
	}

	/*
	setSerialiser() {
		if (!this.node || !this.tsKind) return;
		if (ts.isVariableDeclaration(this.node)) {
			this.serialise = new dox.serialiser.VariableDeclaration(
				this,
			).serialise;
			return;
		}
		dox.log.warn(
			'Serialiser not been implemented :',
			ts.SyntaxKind[this.tsKind],
		);
	}
	*/
}
