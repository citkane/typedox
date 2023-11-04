import ts from 'typescript';
import { CategoryKind } from '../index.mjs';
import { notices } from './notices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper } from '@typedox/wrapper';

const __filename = log.getFilename(import.meta.url);

export default function (
	valueNode: ts.Node,
	wrappedItem: TsWrapper,
	categoryTsKind: ts.SyntaxKind,
	checker: ts.TypeChecker,
) {
	const {
		kind,
		isModule,
		isType,
		isReExport,
		isFunction,
		isClass,
		isVariable,
		isEnum,
	} = parseCategory(categoryTsKind, isArrowFunction(valueNode, checker));

	const categoryKind = isModule
		? CategoryKind.Namespace
		: isVariable
		? CategoryKind.Variable
		: isType
		? CategoryKind.Type
		: isReExport
		? CategoryKind.reExport
		: isFunction
		? CategoryKind.Function
		: isClass
		? CategoryKind.Class
		: isEnum
		? CategoryKind.Enum
		: CategoryKind.unknown;

	if (categoryKind === CategoryKind.unknown) {
		notices.categoryKind(kind, wrappedItem, __filename);
	}

	return categoryKind;
}
function parseCategory(kind: ts.SyntaxKind, isArrowFunction: boolean) {
	const { SyntaxKind: syntax } = ts;

	const isClass =
		kind === syntax.ClassDeclaration || kind === syntax.ClassExpression;
	const isVariable =
		(!isArrowFunction && kind === syntax.VariableDeclaration) ||
		kind === syntax.StringLiteral ||
		kind === syntax.ArrayLiteralExpression ||
		kind === syntax.ObjectLiteralExpression ||
		kind === syntax.CallExpression ||
		kind === syntax.NewExpression;

	const isFunction =
		isArrowFunction ||
		kind === syntax.FunctionExpression ||
		kind === syntax.ArrowFunction ||
		kind === syntax.FunctionDeclaration;
	const isModule =
		kind === syntax.ModuleDeclaration ||
		kind === syntax.NamespaceExport ||
		kind === syntax.NamespaceImport;

	const isType =
		kind === syntax.TypeAliasDeclaration ||
		kind === syntax.InterfaceDeclaration;

	const isReExport =
		kind === syntax.ImportSpecifier || kind === syntax.ExportDeclaration;

	const isEnum = kind === syntax.EnumDeclaration;

	return {
		kind,
		isModule,
		isType,
		isReExport,
		isFunction,
		isClass,
		isVariable,
		isEnum,
	};
}
function isArrowFunction(valueNode: ts.Node, checker: ts.TypeChecker) {
	const isVariable = valueNode && ts.isVariableDeclaration(valueNode);
	const type = isVariable && checker.getTypeAtLocation(valueNode!);
	return type ? !!type.getCallSignatures().length : false;
}
