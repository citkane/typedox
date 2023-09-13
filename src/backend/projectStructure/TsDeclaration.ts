import * as ts from 'typescript';
import {
	DeclarationGroup,
	DoxConfig,
	DoxProject,
	TsSourceFile,
	TscWrapper,
	declarationMap,
	logger as log,
} from '../typedox';

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

	constructor(parent: TsSourceFile, item: ts.Symbol | ts.Node) {
		super(parent.checker);
		this.parent = parent;

		this.get = this.tsWrap(item);

		this.name = this.get.name;
		this.tsKind = this.get.kind;
		this.tsNode = this.get.tsNode;
		this.tsSymbol = this.get.tsSymbol;
		this.tsType = this.get.tsType;

		if (!this.get.isExportStarChild && !this.isSpecifierKind(this.tsKind))
			return;

		this.parser(this.get.tsNode);
	}
	public get kind() {
		const { SyntaxKind } = ts;

		if (this.get.isExportStarChild) return DeclarationGroup.ExportStar;

		const tsKind = TsDeclaration.resolveTsKind(this);

		const isModule =
			tsKind === SyntaxKind.ModuleDeclaration ||
			tsKind === SyntaxKind.NamespaceExport ||
			tsKind === SyntaxKind.NamespaceImport;
		const isType =
			tsKind === SyntaxKind.TypeAliasDeclaration ||
			tsKind === SyntaxKind.InterfaceDeclaration;

		const kind = isModule
			? DeclarationGroup.Module
			: isType
			? DeclarationGroup.Type
			: tsKind === SyntaxKind.ImportSpecifier
			? DeclarationGroup.ReExporter
			: tsKind === SyntaxKind.VariableDeclaration
			? DeclarationGroup.Variable
			: tsKind === SyntaxKind.ClassDeclaration
			? DeclarationGroup.Class
			: tsKind === SyntaxKind.FunctionDeclaration
			? DeclarationGroup.Function
			: tsKind === SyntaxKind.EnumDeclaration
			? DeclarationGroup.Enum
			: tsKind === SyntaxKind.ExportAssignment
			? DeclarationGroup.Default
			: DeclarationGroup.unknown;

		kind === DeclarationGroup.unknown && notices.kind(tsKind, this.get);

		return kind;
	}

	private parser(node: ts.Node, get = this.get, isTarget = false) {
		if (!this.isSpecifierKind(node.kind)) return;

		ts.isModuleDeclaration(node)
			? this.parseModuleDeclaration(node)
			: ts.isNamespaceExport(node)
			? this.parseNamespaceExport()
			: ts.isExportSpecifier(node)
			? this.parseExportSpecifier()
			: ts.isImportSpecifier(node)
			? this.parseImportSpecifier()
			: get.isExportStarChild
			? this.parseReExporter(get)
			: ts.isExportAssignment(node)
			? this.parseExportAssignment(get)
			: ts.isNamespaceImport(node)
			? this.parseNamespaceImport(get)
			: notices.parser.deepreport.call(this, isTarget, get);
	}

	private parseExportAssignment(get: TscWrapper) {
		notices.parse.debug.call(this, 'parseExportAssignment');
		//log.inspect(get.tsNode, true, ['parent']);
	}
	private parseReExporter(get: TscWrapper) {
		notices.parse.debug.call(this, 'parseReExporter');
		//this.info(get.tsSymbol.exports);
	}
	private parseModuleDeclaration(module: ts.ModuleDeclaration) {
		notices.parse.debug.call(this, 'parseModuleDeclaration');

		this.nameSpace = module.name.getText();
	}
	private parseNamespaceExport = () => {
		notices.parse.debug.call(this, 'parseNamespaceExport');

		this.nameSpace = this.name;
	};
	private parseNamespaceImport = (get: TscWrapper) => {
		notices.parse.debug.call(this, 'parseNamespaceImport');

		this.nameSpace = this.name;
	};
	private parseImportSpecifier() {
		notices.parse.debug.call(this, 'parseImportSpecifier');

		const target = this.get.immediatelyAliasedSymbol;
		const get = this.tsWrap(target!);

		//this.parser(get.tsNode, get, true);
	}
	private parseExportSpecifier() {
		notices.parse.debug.call(this, 'parseExportSpecifier');

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
		if (ts.isImportSpecifier(get.tsNode)) {
		}
		if (ts.isExportSpecifier(get.tsNode)) {
			log.info('---------------------------------------------');
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

const notices = {
	kind: function (tsKind: ts.SyntaxKind, get: TscWrapper) {
		log.error(
			log.identifier(__filename),
			'Did not discover a kind:',
			ts.SyntaxKind[tsKind],
			get.report,
		);
	},
	parser: {
		deepreport: function (
			this: TsDeclaration,
			isLocalTarget: boolean,
			get: TscWrapper,
		) {
			const reportType = isLocalTarget ? 'localTargetNode' : 'node';
			const reportMessage = `Did not parse a ${reportType}`;
			DoxProject.deepReport.call(
				this,
				__filename,
				'error',
				reportMessage,
				get,
				isLocalTarget,
			);
		},
	},
	parse: {
		debug: function (this: TsDeclaration, fncName: string) {
			log.debug(
				log.identifier(this),
				`[${fncName}]`,
				`[${log.toLine(this.get.nodeText)}]`,
				log.toLine(this.get.nodeDeclarationText),
			);
		},
	},
};
