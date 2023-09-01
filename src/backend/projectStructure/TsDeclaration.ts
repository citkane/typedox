import * as dox from '../typedox';
import * as ts from 'typescript';
import { Dox } from './Dox';

export class TsDeclaration extends Dox {
	name: string;
	tsKind: ts.SyntaxKind;
	tsNode: ts.Node;
	tsSymbol: ts.Symbol;
	tsType: ts.Type;
	nameSpace?: string;
	parents: TsDeclaration[] = [];
	children: dox.declarationMap = new Map();
	aliasName?: string;
	get: dox.TscWrapper;

	constructor(context: dox.lib.DoxContext, item: ts.Symbol | ts.Node) {
		super(context);
		this.context = { ...context, tsDeclaration: this };
		dox.Dox.classString.bind(this);

		this.get = this.tsWrap(item);
		this.name = this.get.name;
		this.tsKind = this.get.kind;
		this.tsNode = this.get.tsNode;
		this.tsSymbol = this.get.tsSymbol;
		this.tsType = this.get.tsType;

		if (!this.get.isExportStarChild && !dox.isSpecifierKind(this.tsKind))
			return;

		this.debug(this.classIdentifier, this.get.nodeDeclarationText);

		this.parser(this.get.tsNode);
	}
	public get parent() {
		return this.sourceFile!;
	}
	public get kind() {
		const { SyntaxKind } = ts;
		const { DeclarationKind } = dox;

		if (this.get.isExportStarChild) return DeclarationKind.ExportStar;

		const tsKind = TsDeclaration.resolveTsKind(this);

		const isModule =
			tsKind === SyntaxKind.ModuleDeclaration ||
			tsKind === SyntaxKind.NamespaceExport;

		const kind =
			tsKind === SyntaxKind.VariableDeclaration
				? DeclarationKind.Variable
				: isModule
				? DeclarationKind.Module
				: tsKind === SyntaxKind.ClassDeclaration
				? DeclarationKind.Class
				: tsKind === SyntaxKind.FunctionDeclaration
				? DeclarationKind.Function
				: tsKind === SyntaxKind.EnumDeclaration
				? DeclarationKind.Enum
				: DeclarationKind.unknown;

		if (kind === dox.DeclarationKind.unknown)
			this.error(
				this.classIdentifier,
				'Did not discover a kind:',
				SyntaxKind[tsKind],
				this.get.report,
			);
		return kind;
	}

	private parser(node: ts.Node, get = this.get, isLocalTarget = false) {
		ts.isModuleDeclaration(node)
			? this.parseModuleDeclaration(node)
			: ts.isNamespaceExport(node)
			? this.parseNamespaceExport()
			: ts.isExportSpecifier(node)
			? this.parseExportSpecifier()
			: get.isExportStarChild
			? this.parseReExporter(get)
			: TsDeclaration.deepReport.call(
					this,
					'error',
					`Did not parse a ${
						isLocalTarget ? 'localTargetNode' : 'node'
					}`,
					get,
					isLocalTarget,
			  );
	}
	private parseReExporter(get: dox.TscWrapper) {
		//this.info(get.tsSymbol.exports);
	}
	private parseModuleDeclaration(module: ts.ModuleDeclaration) {
		this.nameSpace = module.name.getText();
	}
	private parseNamespaceExport = () => {
		this.nameSpace = this.name;
	};
	private parseNamespaceImport = () => {
		this.nameSpace = this.name;
	};
	private parseExportSpecifier() {
		const localTarget = this.get.localTargetDeclaration;
		if (!localTarget)
			return this.error(
				this.classIdentifier,
				'No local target found:',
				this.get.report,
			);
		const get = this.tsWrap(localTarget);
		this.parser(get.tsNode, get, true);
	}
	private static resolveTsKind(declaration: dox.TsDeclaration) {
		let tsKind = declaration.tsKind;
		let { get } = declaration;

		if (get.localTargetDeclaration) {
			get = declaration.tsWrap(get.localTargetDeclaration);
			tsKind = get.tsNode.kind;
		}
		if (
			tsKind === ts.SyntaxKind.VariableDeclaration &&
			get.callSignatures.length
		) {
			tsKind = ts.SyntaxKind.FunctionDeclaration;
		}

		return tsKind;
	}
}
