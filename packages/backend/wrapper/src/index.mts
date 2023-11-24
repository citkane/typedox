import ts from 'typescript';
import * as utils from './wrapperUtils.mjs';
import { TsWrapper, wrap } from './Wrapper.mjs';
import { log } from '@typedox/logger';

export type tsItem = ts.Node[] | ts.Symbol;
export { wrappedCache } from './WrapperCache.mjs';
export { wrap, TsWrapper, utils };
export function isSymbol(item: any): item is ts.Symbol {
	return item.constructor && item.constructor.name === 'SymbolObject';
}
export function isNode(item: any): item is ts.Node {
	if (!item.constructor) return false;
	const constructor = item.constructor.name;
	return (
		constructor === 'NodeObject' ||
		constructor === 'IdentifierObject' ||
		constructor === 'SourceFileObject'
	);
}
export function isTypeNode(item: any): item is ts.Type {
	return item.constructor && item.constructor.name === 'TypeObject';
}
export function isNodeOrSymbol(item: any): item is ts.Node[] | ts.Symbol {
	if (Array.isArray(item) && item.find((node) => !isNode(node))) {
		log.info(item.map((node) => node.constructor.name));
	}
	return (
		isSymbol(item) ||
		(Array.isArray(item) && !item.find((node) => !isNode(node)))
	);
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
		syntax.BindingElement,
		//syntax.InterfaceDeclaration,

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
