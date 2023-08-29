import * as ts from 'typescript';
import * as dox from '../typedox';

export default class Serialiser {
	public static root(tree: dox.tree.treePackage) {
		/*
		const { referenceName: packageName, version } = tree;
		const branch = Serialiser.branch(tree);
		return { packageName, version, ...branch };
		*/
	}
	public static branch(branch: dox.tree.Branch): {
		nameSpaces: Record<string, ReturnType<typeof Serialiser.branch>>;
		variables: ReturnType<typeof Serialiser.variables>;
		functions: ReturnType<typeof Serialiser.functions>;
	} {
		const nameSpaces = Serialiser.nameSpaces(branch);
		const variables = Serialiser.variables(branch);
		const functions = Serialiser.functions(branch);
		return { nameSpaces, variables, functions };
	}
	public static nameSpaces(branch: dox.tree.Branch) {
		const nameSpaces: Record<
			string,
			ReturnType<typeof Serialiser.branch>
		> = {};
		branch.nameSpaces.forEach((branch, name) => {
			nameSpaces[name] = Serialiser.branch(branch);
		});
		return nameSpaces;
	}
	public static variables(branch: dox.tree.Branch) {
		const variables: Record<string, any> = {};
		branch.variables.forEach((declaration, name) => {
			variables[name] = ts.SyntaxKind[declaration.tsKind!];
		});
		return variables;
	}
	public static functions(branch: dox.tree.Branch) {
		const functions: Record<string, any> = {};
		branch.functions.forEach((declaration, name) => {
			functions[name] = ts.SyntaxKind[declaration.tsKind!];
		});
		return functions;
	}
}
