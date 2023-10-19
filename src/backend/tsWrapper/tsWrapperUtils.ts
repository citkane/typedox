import * as ts from 'typescript';
import { TsWrapper, logger as log, loggerUtils } from '../typedox';

export type symbolFlagString = keyof typeof ts.SymbolFlags;
export type typeFlagString = keyof typeof ts.SymbolFlags;
export type nodeKindString = keyof typeof ts.SyntaxKind;
export type tsWrapperReport = Partial<Record<keyof TsWrapper, any>>;
export const reportKeys: (keyof TsWrapper)[] = [
	'fileName',
	'targetFileName',
	'nodeText',
	'nodeDeclarationText',
	'localDeclaration',
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
	key === 'localDeclaration' &&
		value &&
		(value = loggerUtils.shortenString((value as ts.Node).getText(), 200));
	(key == 'nodeText' || key == 'nodeDeclarationText') &&
		value &&
		(value = loggerUtils.shortenString(value as string, 80));

	return value;
}

export function getNodeAndTypeFromSymbol(
	checker: ts.TypeChecker,
	symbol: ts.Symbol,
) {
	let type: ts.Type;
	let node = symbol.declarations?.find(
		(declaration) => !ts.isTypeAliasDeclaration(declaration),
	);
	symbol.declarations?.forEach((declaration) => {
		if (ts.isTypeAliasDeclaration(declaration)) {
			type = checker.getTypeAtLocation(declaration);
			node ??= declaration;
		}
	});
	node ??= symbol.valueDeclaration!;
	type ??= checker.getTypeOfSymbol(symbol);

	return { node, type };
}

export function getTsSymbolFromNode(
	checker: ts.TypeChecker,
	node: ts.Node,
): ts.Symbol {
	const seen = new Map<ts.Node, ts.Symbol>();
	let symbol = checker.getSymbolAtLocation(node);

	symbol = symbol
		? symbol
		: 'name' in node
		? checker.getSymbolAtLocation(node.name as ts.Identifier)
		: 'expression' in node
		? checker.getSymbolAtLocation(node.expression as ts.Expression)
		: 'symbol' in node && !!node.symbol
		? (node.symbol as ts.Symbol)
		: notFound(node);

	return symbol!;

	function mapNodes(symbol: ts.Symbol) {
		symbol.declarations!.forEach((declaration) => {
			!seen.has(declaration) && seen.set(declaration, symbol);
		});
	}
	function notFound(node: ts.Node) {
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
	function parseClause(clause: ts.NamedExportBindings | undefined) {
		/* istanbul ignore if */
		if (!clause) return undefined;

		if (seen.has(clause)) return seen.get(clause);
		const elements = (clause as any).elements as ts.Node[] | undefined;

		const has = elements?.find((element: ts.Node) => seen.has(element));

		return has ? seen.get(has) : undefined;
	}
}

/*

export function isExportEquals(symbol: ts.Symbol) {
	return symbol.valueDeclaration?.kind === ts.SyntaxKind.ExportAssignment;
}

export function parseReExport(symbol: ts.Symbol) {
	const reExports = symbol.declarations
		?.map((declaration) => {
			return ts.isExportDeclaration(declaration)
				? declaration.moduleSpecifier
				: undefined;
		})
		.filter((expression) => !!expression);
	return (reExports || []) as ts.Expression[];
}
*/
export function isReExport(symbol: ts.Symbol) {
	return symbol.flags === ts.SymbolFlags.ExportStar;
}

export function getModuleSpecifier(
	node: ts.Node,
	//seen = new Map<object, true>(),
): ts.Expression | undefined {
	//if (seen.has(node)) return undefined;
	//seen.set(node, true);
	if ('moduleSpecifier' in node) return node.moduleSpecifier as ts.Expression;
	if (!!node.parent) return getModuleSpecifier(node.parent); //,seen);
	return undefined;
}

const notices = {
	getTsSymbolFromNode: {
		throw: (node: ts.Node): undefined => {
			log.debug({
				text: node.getText(),
				kind: ts.SyntaxKind[node.kind],
				parentKind: ts.SyntaxKind[node.parent.kind],
				file: node.getSourceFile().fileName,
				node,
			});
			log.throwError(
				log.identifier(__filename),
				'Invalid node for conversion to symbol',
				log.stackTracer(),
			);
		},
	},
};
