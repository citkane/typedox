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
	get: dox.lib.WhatIsIt;

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

		this.parser(this.tsNode);

		this.debug(this.class, this.get.nodeDeclarationText);
	}
	public get parent() {
		return this.reference;
	}
	private parser(node: ts.Node, get = this.get, isLocalTarget = false) {
		if (Declaration.isDeclaredEnough(node)) return;

		ts.isModuleDeclaration(node)
			? this.parseModuleDeclaration(node)
			: ts.isNamespaceExport(node)
			? this.parseNamespaceExport(node)
			: ts.isExportSpecifier(node)
			? this.parseExportSpecifier(node)
			: ts.isExportAssignment(node)
			? this.parseExportAssignment(node)
			: dox.lib.Relationships.fullReport(
					'error',
					this,
					this.class,
					`Did not parse a ${
						isLocalTarget ? 'localTargetNode' : 'node'
					}`,
					get,
					isLocalTarget,
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
		const get = this.getter(localTarget);
		this.parser(get.tsNode, get, true);
		/*
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
			  */
	}

	private static isDeclaredEnough = (node: ts.Node) =>
		Dox.canBeIgnored(node) ||
		ts.isNamespaceImport(node) ||
		ts.isImportClause(node);
}
