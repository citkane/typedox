import ts from 'typescript';
import { CategoryKind, DoxDeclaration } from '../index.mjs';
import { notices } from './libNotices.mjs';
import { log } from '@typedox/logger';

const __filename = log.getFilename(import.meta.url);

export function getCategoryKind({
	valueNode,
	wrappedItem,
	categoryTsKind,
	checker,
}: DoxDeclaration) {
	return ((categoryKind) => {
		if (categoryKind === CategoryKind.unknown) {
			notices.categoryKind(categoryTsKind, wrappedItem, __filename);
		}
		return categoryKind;
	})(parseCategory(categoryTsKind, isArrowFunction(valueNode, checker)));
}
function parseCategory(kind: ts.SyntaxKind, isArrowFunction: boolean) {
	const { SyntaxKind: syntax } = ts;

	if (kind === syntax.ExportDeclaration) {
		return CategoryKind.Export;
	}
	if (kind === syntax.ClassDeclaration || kind === syntax.ClassExpression) {
		return CategoryKind.Class;
	}
	if (
		(!isArrowFunction && kind === syntax.VariableDeclaration) ||
		kind === syntax.StringLiteral ||
		kind === syntax.ArrayLiteralExpression ||
		kind === syntax.ObjectLiteralExpression ||
		kind === syntax.CallExpression ||
		kind === syntax.NewExpression
	) {
		return CategoryKind.Variable;
	}
	if (
		isArrowFunction ||
		kind === syntax.FunctionExpression ||
		kind === syntax.ArrowFunction ||
		kind === syntax.FunctionDeclaration
	) {
		return CategoryKind.Function;
	}
	if (
		kind === syntax.ModuleDeclaration ||
		kind === syntax.NamespaceExport ||
		kind === syntax.NamespaceImport
	) {
		return CategoryKind.Namespace;
	}
	if (
		kind === syntax.TypeAliasDeclaration ||
		kind === syntax.InterfaceDeclaration
	) {
		return CategoryKind.Type;
	}
	if (kind === syntax.EnumDeclaration) {
		return CategoryKind.Enum;
	}

	return CategoryKind.unknown;
}
function isArrowFunction(valueNode: ts.Node, checker: ts.TypeChecker) {
	return ((type) => {
		return type ? !!type.getCallSignatures().length : false;
	})(
		((isVariable) => isVariable && checker.getTypeAtLocation(valueNode))(
			ts.isVariableDeclaration(valueNode),
		),
	);
}
