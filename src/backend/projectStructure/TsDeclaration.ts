import { DoxConfig } from '../config/DoxConfig';
import {
	DeclarationGroup,
	DoxProject,
	TsSourceFile,
	TscWrapper,
	declarationMap,
	logger as log,
} from '../typedox';
import * as ts from 'typescript';

/**
 * A container for typescript declarations:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- **TsDeclaration**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...**TsDeclaration**...
 *
 *
 */
export class TsDeclaration extends DoxConfig {
	parent: TsSourceFile;
	name: string;
	tsKind: ts.SyntaxKind;
	tsNode: ts.Node;
	tsSymbol: ts.Symbol;
	tsType: ts.Type;
	nameSpace?: string;
	parents: TsDeclaration[] = [];
	children: declarationMap = new Map();
	aliasName?: string;
	get: TscWrapper;

	constructor(
		parent: TsSourceFile,
		item: ts.Symbol | ts.Node,
		checker: ts.TypeChecker,
	) {
		super(parent.projectOptions, checker);
		this.parent = parent;

		this.get = this.tsWrap(item);
		this.name = this.get.name;
		this.tsKind = this.get.kind;
		this.tsNode = this.get.tsNode;
		this.tsSymbol = this.get.tsSymbol;
		this.tsType = this.get.tsType;

		if (!this.get.isExportStarChild && !this.isSpecifierKind(this.tsKind))
			return;

		log.debug(log.identifier(this), this.get.nodeDeclarationText);

		this.parser(this.get.tsNode);
	}
	public get kind() {
		const { SyntaxKind } = ts;

		if (this.get.isExportStarChild) return DeclarationGroup.ExportStar;

		const tsKind = TsDeclaration.resolveTsKind(this);

		const isModule =
			tsKind === SyntaxKind.ModuleDeclaration ||
			tsKind === SyntaxKind.NamespaceExport;

		const kind =
			tsKind === SyntaxKind.VariableDeclaration
				? DeclarationGroup.Variable
				: isModule
				? DeclarationGroup.Module
				: tsKind === SyntaxKind.ClassDeclaration
				? DeclarationGroup.Class
				: tsKind === SyntaxKind.FunctionDeclaration
				? DeclarationGroup.Function
				: tsKind === SyntaxKind.EnumDeclaration
				? DeclarationGroup.Enum
				: DeclarationGroup.unknown;

		if (kind === DeclarationGroup.unknown)
			log.error(
				log.identifier(this),
				'Did not discover a kind:',
				SyntaxKind[tsKind],
				this.get.report,
			);
		return kind;
	}

	private parser(node: ts.Node, get = this.get, isLocalTarget = false) {
		if (!this.isSpecifierKind(node.kind)) return;

		const reportType = isLocalTarget ? 'localTargetNode' : 'node';
		const reportMessage = `Did not parse a ${reportType}`;

		ts.isModuleDeclaration(node)
			? this.parseModuleDeclaration(node)
			: ts.isNamespaceExport(node)
			? this.parseNamespaceExport()
			: ts.isExportSpecifier(node)
			? this.parseExportSpecifier()
			: get.isExportStarChild
			? this.parseReExporter(get)
			: DoxProject.deepReport.call(
					this,
					__filename,
					'error',
					reportMessage,
					get,
					isLocalTarget,
			  );
	}
	private parseReExporter(get: TscWrapper) {
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
			return log.error(
				log.identifier(this),
				'No local target found:',
				this.get.report,
			);
		const get = this.tsWrap(localTarget);
		this.parser(get.tsNode, get, true);
	}
	private static resolveTsKind(declaration: TsDeclaration) {
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
