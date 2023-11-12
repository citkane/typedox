import ts from 'typescript';
import * as utils from './wrapperUtils.mjs';
import { TsWrapper, wrap } from './Wrapper.mjs';

export type tsItem = ts.Node | ts.Symbol;
export { wrappedCache } from './WrapperCache.mjs';
export { wrap, TsWrapper, utils };
export function isSymbol(item: any): item is ts.Symbol {
	return item.constructor && item.constructor.name === 'SymbolObject';
}
export function isNode(item: any): item is ts.Node {
	if (!item.constructor) return false;
	return (
		item.constructor.name === 'NodeObject' ||
		item.constructor.name === 'IdentifierObject'
	);
}
export function isTypeNode(item: any): item is ts.Type {
	return item.constructor && item.constructor.name === 'TypeObject';
}
export function isNodeOrSymbol(item: any): item is ts.Node | ts.Symbol {
	return isSymbol(item) || isNode(item);
}
export function isExportStar(symbol: ts.Symbol) {
	return symbol.flags === ts.SymbolFlags.ExportStar;
}
export function isSpecifierKind(kind: ts.SyntaxKind) {
	const syntax = ts.SyntaxKind;

	const specifiers = [
		syntax.ExportAssignment,
		syntax.ExportDeclaration,
		syntax.ExportSpecifier,
		syntax.ImportClause,
		syntax.ImportEqualsDeclaration,
		syntax.ImportSpecifier,
		syntax.ModuleDeclaration,
		syntax.NamespaceExport,
		syntax.NamespaceImport,
		//syntax.InterfaceDeclaration,
		//syntax.BindingElement,
		//syntax.ObjectLiteralExpression,
	];

	return specifiers.includes(kind);
}

export function isLiteral(expression: ts.Expression) {
	return !![
		ts.isLiteralExpression,
		ts.isArrayLiteralExpression,
		ts.isObjectLiteralExpression,
		ts.isStringLiteralOrJsxExpression,
		ts.isCallExpression,
		ts.isArrowFunction,
		ts.isFunctionExpression,
		ts.isNewExpression,
		ts.isClassExpression,
	].find((fnc) => fnc(expression));
}

const wrapper = {
	isSymbol,
	isNode,
	isTypeNode,
	isNodeOrSymbol,
	isExportStar,
	isSpecifierKind,
	isLiteral,
	wrapperUtils: utils,
	wrap,
	declared: utils.declared,
	TsWrapper,
};

export default wrapper;
