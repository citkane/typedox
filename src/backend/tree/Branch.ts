import * as dox from '../typedox';
import * as ts from 'typescript';
const { Logger } = dox.lib;

export default class Branch extends Logger {
	nameSpaces: Map<string, Branch> = new Map();
	classes: Map<string, dox.Declaration> = new Map();
	variables: Map<string, dox.Declaration> = new Map();
	functions: Map<string, dox.Declaration> = new Map();
	enums: Map<string, dox.Declaration> = new Map();
	constructor(declarations: dox.Declaration[]) {
		super();

		const {
			nameSpaceDeclarations,
			functionDeclarations,
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

		remainder.forEach((declaration) =>
			this.error(
				this.class,
				'A declaration was not registered:',
				declaration.name,
			),
		);
	}
	private registerAlias = (declaration: dox.Declaration) => {
		//const { alias } = declaration;
		const alias = declaration;
		if (!alias)
			return this.error(
				this.class,
				'Could not find an alias for a declaration.',
			);

		alias.tsKind === ts.SyntaxKind.ModuleDeclaration
			? this.registerNameSpace(alias, declaration.name)
			: alias.tsKind === ts.SyntaxKind.VariableDeclaration
			? this.registerVariable(alias, declaration.name)
			: alias.tsKind === ts.SyntaxKind.FunctionDeclaration
			? this.registerFunction(alias, declaration.name)
			: alias.tsKind === ts.SyntaxKind.ClassDeclaration
			? this.registerClass(alias, declaration.name)
			: this.error(
					this.class,
					'Did not register an alias',
					declaration.get.report,
			  );
	};
	private registerNameSpace = (
		declaration: dox.Declaration,
		nameSpace?: string,
	) => {
		const { children } = declaration;
		nameSpace = nameSpace ? nameSpace : declaration.nameSpace;

		if (!nameSpace)
			return this.error('Namespace string was not found :', nameSpace);

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
}
