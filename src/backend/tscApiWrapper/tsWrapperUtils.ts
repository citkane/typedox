import * as ts from 'typescript';
import { Relation, TsSourceFile, TscWrapper, logger as log } from '../typedox';

export type symbolFlagString = keyof typeof ts.SymbolFlags;
export type typeFlagString = keyof typeof ts.SymbolFlags;
export type nodeKindString = keyof typeof ts.SyntaxKind;
export type tscWrapperReport = Partial<Record<keyof TscWrapper, any>>;
export const reportKeys: (keyof TscWrapper)[] = [
	'fileName',
	'targetFileName',
	'nodeText',
	'nodeDeclarationText',
	'localTargetDeclaration',
	'name',
	'alias',
	'kindString',
	'nodeFlagString',
	'symbolFlagString',
	'typeFlagString',
	'moduleSpecifier',
	'hasDeclarations',
	'hasValueDeclaration',
];
export function parseReportKey(this: TscWrapper, key: keyof TscWrapper) {
	let value = this[key];

	key === 'moduleSpecifier' &&
		value &&
		(value = (value as ts.Node).getText());
	key === 'localTargetDeclaration' &&
		value &&
		(value = (value as ts.Node).getText());

	return value;
}

export function getLocalTargetDeclaration(
	this: TscWrapper,
	declaration: ts.Identifier | ts.ExportSpecifier,
	checker: ts.TypeChecker,
) {
	const declarations = checker
		.getExportSpecifierLocalTargetSymbol(declaration)
		?.getDeclarations();
	if (declarations && declarations.length > 1)
		log.throwError(
			log.identifier(__filename),
			'Expected only one declaration in a local target symbol',
		);
	return !!declarations ? declarations[0] : undefined;
}

export function getTsNodeFromSymbol(this: TscWrapper, symbol: ts.Symbol) {
	const declarations = symbol.getDeclarations();
	return declarations && declarations.length === 1
		? (declarations[0] as ts.Node)
		: !!symbol.valueDeclaration
		? symbol.valueDeclaration
		: log.throwError(
				log.identifier(__filename),
				'Unexpected error while getting a ts.Node from a ts.Symbol',
		  );
}

export function getTsSymbolFromType(this: TscWrapper, type: ts.Type) {
	const symbol = type.getSymbol();
	return symbol
		? symbol
		: log.throwError(
				log.identifier(__filename),
				'Unexpected error while getting a ts.Symbol from a ts.Type',
		  );
}

export function getTsSymbolFromNode(
	this: TscWrapper,
	node: ts.Node,
	checker: ts.TypeChecker,
	fromName = false,
): ts.Symbol {
	if ('symbol' in node && !!node.symbol) return node.symbol as ts.Symbol;
	let symbol;
	try {
		symbol = checker.getSymbolAtLocation(node);
		if (!symbol)
			throw new Error(
				fromName
					? 'Could not get a ts.Symbol from the ts.Node'
					: 'Trying to get a ts.Symbol from tsNode.name',
			);
	} catch (error) {
		log.debug(log.identifier(this), (error as Error).message);
		if (!fromName && 'name' in node)
			return getTsSymbolFromNode.call(
				this,
				(node as any)['name'],
				checker,
				true,
			);
	}
	return !!symbol
		? (symbol as ts.Symbol)
		: log.throwError('Could not create a ts.Symbol from a ts.Node');
}

export function isStarExport(symbol: ts.Symbol) {
	return symbol.flags === ts.SymbolFlags.ExportStar;
}

export function parseExportStars(
	this: TsSourceFile | Relation,
	symbol: ts.Symbol,
) {
	return symbol
		.declarations!.map((declaration) => {
			return ts.isExportDeclaration(declaration)
				? declaration.moduleSpecifier
				: logError.call(this, declaration);
		})
		.filter((symbol) => !!symbol) as ts.Expression[];

	function logError(this: Object, declaration: ts.Declaration) {
		log.error(
			log.identifier(this),
			`Expected a ts.ExportDeclaration but got ts.${
				ts.SyntaxKind[declaration.kind]
			}`,
		);
	}
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
