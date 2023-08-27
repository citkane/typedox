import * as dox from '../typedox';
import * as ts from 'typescript';

export const partitionDeclarations = (declarations: dox.Declaration[]) => {
	const remainder: dox.Declaration[] = [];
	const nameSpaceDeclarations = declarations.filter((declaration) => {
		const isNameSpace =
			declaration.tsKind === ts.SyntaxKind.ModuleDeclaration ||
			declaration.tsKind === ts.SyntaxKind.NamespaceExport ||
			declaration.tsKind === ts.SyntaxKind.NamespaceImport;
		if (!isNameSpace) remainder.push(declaration);
		return isNameSpace;
	});

	return {
		nameSpaceDeclarations,
		...partitionAliasDeclarations(remainder),
	};
};
const partitionAliasDeclarations = (declarations: dox.Declaration[]) => {
	const remainder: dox.Declaration[] = [];
	const aliasDeclarations = declarations.filter((declaration) => {
		const { tsSymbol: symbol } = declaration;
		const isAlias = symbol.flags === ts.SymbolFlags.AliasExcludes;
		if (!isAlias) remainder.push(declaration);
		return isAlias;
	});

	return {
		aliasDeclarations,
		...partitionClassDeclarations(remainder),
	};
};
const partitionClassDeclarations = (declarations: dox.Declaration[]) => {
	const remainder: dox.Declaration[] = [];
	const classDeclarations = declarations.filter((declaration) => {
		const { tsKind } = declaration;
		const isClass = tsKind === ts.SyntaxKind.ClassDeclaration;
		if (!isClass) remainder.push(declaration);
		return isClass;
	});

	return {
		classDeclarations,
		...partitionEnumDeclarations(remainder),
	};
};
const partitionEnumDeclarations = (declarations: dox.Declaration[]) => {
	const remainder: dox.Declaration[] = [];
	const enumDeclarations = declarations.filter((declaration) => {
		const { tsKind } = declaration;
		const isEnum = tsKind === ts.SyntaxKind.EnumDeclaration;
		if (!isEnum) remainder.push(declaration);
		return isEnum;
	});

	return {
		enumDeclarations,
		...partitionFunctionDeclarations(remainder),
	};
};
const partitionFunctionDeclarations = (declarations: dox.Declaration[]) => {
	const remainder: dox.Declaration[] = [];
	const functionDeclarations = declarations.filter((declaration) => {
		const { tsType: type } = declaration;
		const isFunction = !!type.getCallSignatures().length;
		if (!isFunction) remainder.push(declaration);
		return isFunction;
	});

	return {
		functionDeclarations,
		...partitionVariableDeclarations(remainder),
	};
};
const partitionVariableDeclarations = (declarations: dox.Declaration[]) => {
	const remainder: dox.Declaration[] = [];
	const variableDeclarations = declarations.filter((declaration) => {
		const { tsKind } = declaration;
		const isVariable = tsKind === ts.SyntaxKind.VariableDeclaration;
		if (!isVariable) remainder.push(declaration);
		return isVariable;
	});
	return {
		variableDeclarations,
		remainder,
	};
};
