import ts from 'typescript';
import notices from './notices.mjs';
import { log, loggerUtils } from '@typedox/logger';
import { TsWrapper } from './Wrapper.mjs';
import path from 'path';

const __filename = log.getFilename(import.meta.url);

export type symbolFlagString = keyof typeof ts.SymbolFlags;
export type typeFlagString = keyof typeof ts.SymbolFlags;
export type nodeKindString = keyof typeof ts.SyntaxKind;
export type tsWrapperReport = Partial<Record<keyof TsWrapper, any>>;
export const reportKeys: (keyof TsWrapper)[] = [
	'fileName',
	'targetFileName',
	'nodeText',
	'nodeDeclarationText',
	'localSymbol',
	'name',
	'alias',
	'kindString',
	'nodeFlagString',
	'symbolFlagString',
	'typeFlagString',
	'moduleSpecifier',
	'hasValueDeclaration',
];

export function parseReportKey(this: TsWrapper, key: keyof TsWrapper) {
	let value = this[key];

	key === 'moduleSpecifier' &&
		value &&
		(value = loggerUtils.shortenString((value as ts.Node).getText(), 200));
	key === 'localSymbol' &&
		value &&
		(value = loggerUtils.shortenString(
			(
				(value as ts.Symbol).valueDeclaration ||
				(value as ts.Symbol).declarations![0]
			).getText(),
			200,
		));
	(key == 'nodeText' || key == 'nodeDeclarationText') &&
		value &&
		(value = loggerUtils.shortenString(value as string, 80));

	return value;
}

export function getNodesAndTypeFromSymbol(
	checker: ts.TypeChecker,
	symbol: ts.Symbol,
) {
	let { nodes, typeAlias } = declared(symbol);
	if (!nodes && symbol.valueDeclaration) nodes = [symbol.valueDeclaration];
	const type = typeAlias
		? checker.getTypeAtLocation(typeAlias)
		: checker.getTypeOfSymbol(symbol);

	return { nodes, type };
}

export function getTsSymbolFromNodes(
	checker: ts.TypeChecker,
	nodes: ts.Node[],
): ts.Symbol {
	const seen = new Map<ts.Node, ts.Symbol>();
	const node = nodes[0];
	let symbol =
		'symbol' in node && !!node.symbol
			? (node.symbol as ts.Symbol)
			: checker.getSymbolAtLocation(node);

	symbol ??=
		'name' in node
			? checker.getSymbolAtLocation(node.name as ts.Identifier)
			: 'expression' in node
			  ? checker.getSymbolAtLocation(node.expression as ts.Expression)
			  : stillNoSymbol(node);

	if (!symbol) notices.throw;
	return symbol!;

	function stillNoSymbol(node: ts.Node) {
		const symbol = checker.getSymbolAtLocation(node.parent);
		/* istanbul ignore if */
		if (!symbol) return undefined;

		const type = checker.getTypeOfSymbol(symbol);

		symbol.exports?.forEach((exported) => mapNodes(exported));
		type.getProperties().forEach((property) => mapNodes(property));

		return ts.isExportDeclaration(node)
			? parseClause(node.exportClause)
			: undefined;
	}
	function mapNodes(symbol: ts.Symbol) {
		symbol.declarations!.forEach((declaration) => {
			!seen.has(declaration) && seen.set(declaration, symbol);
		});
	}
	function parseClause(clause: ts.NamedExportBindings | undefined) {
		/* istanbul ignore if */
		if (!clause) return undefined;

		if (seen.has(clause)) return seen.get(clause);
		const elements = (clause as any).elements as ts.Node[] | undefined;

		const has = elements?.find((element: ts.Node) => seen.has(element));

		return has ? seen.get(has) : undefined;
	}
}

export function getModuleSpecifier(node: ts.Node): ts.Expression | undefined {
	if (ts.isSourceFile(node)) return undefined;
	if ('moduleSpecifier' in node) return node.moduleSpecifier as ts.Expression;
	return getModuleSpecifier(node.parent);
}

export function declared(symbol: ts.Symbol) {
	const accumulator = {
		nodes: undefined,
		typeAlias: undefined,
		fileName: undefined,
	} as {
		nodes: ts.Node[] | undefined;
		typeAlias: ts.TypeAliasDeclaration | undefined;
		fileName: string | undefined;
	};

	const { declarations } = symbol;

	if (!declarations) return accumulator;

	const declared = declarations.reduce((accumulator, declaration) => {
		accumulator.fileName ??= path.resolve(
			declaration.getSourceFile().fileName,
		);
		if (ts.isTypeAliasDeclaration(declaration)) {
			if (accumulator.typeAlias)
				log.error(
					log.identifier(__filename),
					`Duplicate type encountered: ${symbol.name}`,
				);
			accumulator.typeAlias = declaration;
		} else {
			accumulator.nodes ??= [];
			accumulator.nodes.push(declaration);
		}
		return accumulator;
	}, accumulator);

	return declared;
}

export function isExportSpecifierKind(kind: ts.SyntaxKind) {
	const specifiers = [
		ts.SyntaxKind.ExportAssignment,
		ts.SyntaxKind.ExportDeclaration,
		ts.SyntaxKind.ExportSpecifier,
		ts.SyntaxKind.NamespaceExport,
	];

	return specifiers.includes(kind);
}
export function isImportSpecifierKind(kind: ts.SyntaxKind) {
	const specifiers = [
		ts.SyntaxKind.ImportClause,
		ts.SyntaxKind.ImportEqualsDeclaration,
		ts.SyntaxKind.ImportSpecifier,
		ts.SyntaxKind.NamespaceImport,
	];

	return specifiers.includes(kind);
}
export function isSpecifierKind(kind: ts.SyntaxKind) {
	const specifiers = [
		ts.SyntaxKind.ModuleDeclaration,
		ts.SyntaxKind.BindingElement,
	];

	return (
		specifiers.includes(kind) ||
		isExportSpecifierKind(kind) ||
		isImportSpecifierKind(kind)
	);
}
