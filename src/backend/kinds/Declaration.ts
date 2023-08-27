import { Dox } from '../lib/Dox';
import * as dox from '../typedox';
import * as ts from 'typescript';

export default class Declaration extends Dox {
	tsKind: ts.SyntaxKind;
	name: string;
	nameSpace?: string;
	tsSymbol: ts.Symbol;
	parents: Declaration[] = [];
	children: dox.declarationMap = new Map();
	tsType: ts.Type;
	tsNode: ts.Node;
	aliasName?: string;
	private get: dox.lib.WhatIsIt;

	constructor(context: dox.lib.Context, symbol: ts.Symbol) {
		super(context);
		Dox.class.bind(this);

		this.get = this.getter(symbol);
		this.tsSymbol = symbol;
		this.name = symbol.getName();
		this.tsNode = this.get.tsNode;
		this.tsType = this.checker.getTypeOfSymbol(symbol);
		this.tsKind = this.tsNode.kind;
		this.aliasName = this.get.alias;

		if (Declaration.isDeclared(this.tsNode)) return;

		ts.isModuleDeclaration(this.tsNode)
			? this.parseModuleDeclaration(this.tsNode)
			: ts.isNamespaceExport(this.tsNode)
			? this.parseNamespaceExport(this.tsNode)
			: ts.isExportSpecifier(this.tsNode)
			? this.parseExportSpecifier(this.tsNode)
			: ts.isExportAssignment(this.tsNode)
			? this.parseExportAssignment(this.tsNode)
			: this.warn(
					this.class,
					'Did not parse a node into dox.Declaration',
					this.get.report,
			  );
	}
	private parseExportAssignment(declaration: ts.ExportAssignment) {
		this.tsKind = declaration.kind;
	}
	private parseExportDeclaration(declaration: ts.ExportDeclaration) {
		this.tsKind = declaration.kind;
	}
	private parseModuleDeclaration(module: ts.ModuleDeclaration) {
		this.nameSpace = module.name.getText();
		this.tsKind = module.kind;
	}
	private parseNamespaceExport = (declaration: ts.NamespaceExport) => {
		this.nameSpace = this.name;
		this.tsKind = declaration.kind;
	};
	private parseNamespaceImport = (declaration: ts.NamespaceImport) => {
		this.nameSpace = this.name;
		this.tsKind = declaration.kind;
	};
	private parseImportClause = (declaration: ts.ImportClause) => {
		this.tsKind = declaration.kind;
	};
	private parseExportSpecifier(declaration: ts.ExportSpecifier) {
		const localTarget = this.get.localTargetDeclaration;
		if (!localTarget)
			return this.error(
				this.class,
				'No local target found:',
				this.get.report,
			);

		if (Declaration.isNotNeeded(localTarget)) return;

		ts.isModuleDeclaration(localTarget)
			? this.parseModuleDeclaration(localTarget)
			: ts.isNamespaceImport(localTarget)
			? this.parseNamespaceImport(localTarget)
			: ts.isImportClause(localTarget)
			? this.parseImportClause(localTarget)
			: this.warn(
					this.class,
					'Did not parse a local target:',
					this.getter(localTarget).report,
			  );
	}

	private static isDeclared = (node?: ts.Node) =>
		node &&
		(ts.isEnumDeclaration(node) ||
			ts.isClassDeclaration(node) ||
			ts.isVariableDeclaration(node) ||
			ts.isSourceFile(node) ||
			ts.isFunctionDeclaration(node));
	private static isNotNeeded = Declaration.isDeclared;
}
