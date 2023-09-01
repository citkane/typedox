import * as ts from 'typescript';
import * as dox from '../typedox';
import { Logger } from '../lib/Logger';

export class Dox extends Logger {
	protected context: dox.lib.DoxContext;
	checker: ts.TypeChecker;
	protected reference?: dox.TsReference;
	protected package: dox.NpmPackage;
	sourceFile?: dox.TsSourceFile;
	fileName?: string;
	constructor(context: dox.lib.DoxContext) {
		super();
		this.context = context;
		this.checker = context.checker;
		this.package = context.npmPackage;
		this.reference = context.tsReference;
		this.sourceFile = context.tsSourceFile;
		this.fileName = context.tsSourceFile?.fileName;
	}

	public tsWrap = (item: dox.whatIsIt) =>
		new dox.TscWrapper(this.checker, item);
}
export function isStarExport(symbol: ts.Symbol) {
	return symbol.flags === ts.SymbolFlags.ExportStar;
}
export function parseExportStars(
	this:
		| dox.TsSourceFile
		| dox.TsDeclaration
		| dox.lib.Relation
		| dox.TscWrapper,
	symbol: ts.Symbol,
) {
	const _this = this;
	return symbol
		.declarations!.map((declaration) => {
			return ts.isExportDeclaration(declaration)
				? declaration.moduleSpecifier
				: logError(declaration);
		})
		.filter((symbol) => !!symbol) as ts.Expression[];

	function logError(declaration: ts.Declaration) {
		Dox.error(
			_this.classIdentifier,
			`Expected a ts.ExportDeclaration but got ts.${
				ts.SyntaxKind[declaration.kind]
			}`,
		);
	}
}
export const isSpecifierKind = (kind: ts.SyntaxKind) => {
	const {
		NamespaceExport,
		NamespaceImport,
		ModuleDeclaration,
		ExportDeclaration,
		ExportSpecifier,
		ExportAssignment,
		ImportClause,
		ImportSpecifier,
	} = ts.SyntaxKind;
	const specifiers = [
		NamespaceExport,
		NamespaceImport,
		ModuleDeclaration,
		ExportDeclaration,
		ExportSpecifier,
		ExportAssignment,
		ImportClause,
		ImportSpecifier,
	];
	return specifiers.includes(kind);
};
