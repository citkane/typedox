import * as ts from 'typescript';
import * as dox from '../typedox';

const log = dox.logger;

export type symbolFlagString = keyof typeof ts.SymbolFlags;
export type typeFlagString = keyof typeof ts.SymbolFlags;
export type nodeKindString = keyof typeof ts.SyntaxKind;
export type tscWrapperReport = Partial<Record<keyof dox.TscWrapper, any>>;
export const reportKeys: (keyof dox.TscWrapper)[] = [
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
export function parseReportKey(
	this: dox.TscWrapper,
	key: keyof dox.TscWrapper,
) {
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
	this: Object,
	declaration: ts.ExportSpecifier | ts.Identifier,
	checker: ts.TypeChecker,
) {
	const declarations = checker
		.getExportSpecifierLocalTargetSymbol(declaration)
		?.getDeclarations();

	if (declarations && declarations.length > 1)
		log.throwError(
			log.identifier(this),
			'Expected only one declaration in a local target symbol',
		);
	return !!declarations ? declarations[0] : undefined;
}

export function getTsNodeFromSymbol(this: Object, symbol: ts.Symbol) {
	const declarations = symbol.getDeclarations();
	return declarations && declarations.length === 1
		? (declarations[0] as ts.Node)
		: log.throwError(
				log.identifier(this),
				'Unexpected error while getting a ts.Node form a ts.Symbol',
		  );
}

export function getTsSymbolFromType(this: Object, type: ts.Type) {
	const symbol = type.getSymbol();
	return symbol
		? symbol
		: log.throwError(
				log.identifier(this),
				'Unexpected error while getting a ts.Symbol from a ts.Type',
		  );
}

export function getTsSymbolFromNode(
	this: object,
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

export function parseExportStars(this: Object, symbol: ts.Symbol) {
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

export function getModuleSpecifier(node: ts.Node): ts.Expression | undefined {
	if ('moduleSpecifier' in node) return node.moduleSpecifier as ts.Expression;
	if (!!node.parent) return getModuleSpecifier(node.parent);
	return undefined;
}
