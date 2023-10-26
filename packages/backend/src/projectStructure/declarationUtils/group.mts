import ts from 'typescript';
import { DeclarationGroup, TsWrapper } from '../../typedox.mjs';
import { notices } from './notices.mjs';
import { log } from 'typedox/logger';

const __filename = log.getFilename(import.meta.url);

export default function (
	valueNode: ts.Node,
	wrappedItem: TsWrapper,
	groupTsKind: ts.SyntaxKind,
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
	} = parseGroup(groupTsKind, isArrowFunction(valueNode, checker));

	const groupKind = isModule
		? DeclarationGroup.Module
		: isVariable
		? DeclarationGroup.Variable
		: isType
		? DeclarationGroup.Type
		: isReExport
		? DeclarationGroup.ReExport
		: isFunction
		? DeclarationGroup.Function
		: isClass
		? DeclarationGroup.Class
		: isEnum
		? DeclarationGroup.Enum
		: DeclarationGroup.unknown;

	if (groupKind === DeclarationGroup.unknown) {
		notices.groupKind(kind, wrappedItem, __filename);
	}

	return groupKind;
}
function parseGroup(kind: ts.SyntaxKind, isArrowFunction: boolean) {
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
