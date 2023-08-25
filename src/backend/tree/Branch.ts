import * as dox from '../typedox';
import * as ts from 'typescript';

export default class Branch {
	nameSpaces: Map<string, Branch> = new Map();
	classes: Map<string, dox.Declaration> = new Map();
	variables: Map<string, dox.Declaration> = new Map();
	functions: Map<string, dox.Declaration> = new Map();
	enums: Map<string, dox.Declaration> = new Map();
	constructor(declarations: dox.Declaration[]) {
		const {
			nameSpaceDeclarations,
			functionDeclarations,
			enumDeclarations,
			variableDeclarations,
			classDeclarations,
			aliasDeclarations,
			remainder,
		} = dox.tree.partitionDeclarations(declarations);

		aliasDeclarations.forEach((d) => this.registerAlias(d));
		nameSpaceDeclarations.forEach((d) => this.registerNameSpace(d));
		variableDeclarations.forEach((d) => this.registerVariable(d));
		classDeclarations.forEach((d) => this.registerClass(d));
		functionDeclarations.forEach((d) => this.registerFunction(d));

		remainder.forEach(Branch.logRemainderError);
	}
	private registerAlias = (declaration: dox.Declaration) => {
		//const { alias } = declaration;
		const alias = declaration;
		if (!alias)
			return dox.log
				.object(declaration)
				.error(
					'Could not find an alias for a declaration in dox.Branch:',
				);
		alias.tsKind === ts.SyntaxKind.ModuleDeclaration
			? this.registerNameSpace(alias, declaration.name)
			: alias.tsKind === ts.SyntaxKind.VariableDeclaration
			? this.registerVariable(alias, declaration.name)
			: alias.tsKind === ts.SyntaxKind.FunctionDeclaration
			? this.registerFunction(alias, declaration.name)
			: alias.tsKind === ts.SyntaxKind.ClassDeclaration
			? this.registerClass(alias, declaration.name)
			: dox.log
					.object(alias)
					.error('Did not register an alias in dox.Branch:');
	};
	private registerNameSpace = (
		declaration: dox.Declaration,
		nameSpace?: string,
	) => {
		const { children } = declaration;
		nameSpace = nameSpace ? nameSpace : declaration.nameSpace;

		if (!nameSpace) {
			dox.log.error('Namespace string was not found :', nameSpace);
			return;
		}
		const newBranch = new Branch(Branch.getChildDeclarations(children));
		this.nameSpaces.set(nameSpace, newBranch);
	};

	private registerVariable = (
		declaration: dox.Declaration,
		name?: string,
	) => {
		name = name ? name : declaration.name;
		this.variables.set(name, declaration);
	};
	private registerClass = (declaration: dox.Declaration, name?: string) => {
		name = name ? name : declaration.name;
		this.classes.set(name, declaration);
	};
	private registerFunction = (
		declaration: dox.Declaration,
		name?: string,
	) => {
		name = name ? name : declaration.name;
		this.functions.set(name, declaration);
	};
	private static getChildDeclarations(children: dox.declarationMap) {
		const values = children.values();
		return !!values ? [...values] : [];
	}

	private static logRemainderError = (declaration: dox.Declaration) =>
		dox.log
			.object(declaration)
			.error('A declaration was not registered in the dox.tree.Branch:');
}
