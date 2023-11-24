import ts from 'typescript';
import { CategoryKind } from '../index.mjs';
import { notices } from './libNotices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper } from '@typedox/wrapper';

const __filename = log.getFilename(import.meta.url);

export function getCategoryKind(
	valueNode: ts.Node,
	wrappedItem: TsWrapper,
	categoryTsKind: ts.SyntaxKind,
	checker: ts.TypeChecker,
) {
	const categoryKind = parseCategory(
		categoryTsKind,
		isArrowFunction(valueNode, checker),
	);
	if (categoryKind === CategoryKind.unknown) {
		notices.categoryKind(categoryTsKind, wrappedItem, __filename);
	}

	return categoryKind;
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
	const isVariable = valueNode && ts.isVariableDeclaration(valueNode);
	const type = isVariable && checker.getTypeAtLocation(valueNode!);
	return type ? !!type.getCallSignatures().length : false;
}
