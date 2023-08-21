import * as ts from 'typescript';
import * as dox from '../typedox';

export default class Serialiser {
	/*
	declaration: dox.Declaration;
	node: ts.VariableDeclaration;
	type: ts.Type;
	symbol: ts.Symbol;
	checker: ts.TypeChecker;
	constructor(declaration: dox.Declaration) {
		const { type, symbol, checker, node } = declaration;
		this.declaration = declaration;
		this.type = type;
		this.symbol = symbol;
		this.node = node as ts.VariableDeclaration;
		this.checker = checker;
	}
	*/
	public static tree(tree: dox.tree.Tree) {
		const { packageName, version } = tree;
		const branch = Serialiser.branch(tree);
		return { packageName, version, ...branch };
	}
	public static branch(branch: dox.tree.Branch): {
		nameSpaces: Map<string, ReturnType<typeof Serialiser.branch>>;
		declarations: ReturnType<typeof Serialiser.declarations>;
	} {
		const nameSpaces = Serialiser.nameSpaces(branch);
		const declarations = Serialiser.declarations(branch);
		return { nameSpaces, declarations };
	}
	public static nameSpaces(branch: dox.tree.Branch) {
		const nameSpaces = new Map<
			string,
			ReturnType<typeof Serialiser.branch>
		>();
		branch.nameSpaces.forEach((branch, name) => {
			nameSpaces.set(name, Serialiser.branch(branch));
		});
		return nameSpaces;
	}
	public static declarations(branch: dox.tree.Branch) {
		const declarations = new Map<string, any>();
		branch.declarations.forEach((declaration, name) => {
			declarations.set(name, {});
		});
		return declarations;
	}
	/*
	get isLiteral() {
		return (
			this.type.isLiteral() ||
			this.type.getFlags() === ts.TypeFlags.BooleanLiteral
		);
	}
	get isObjectLiteral() {
		return this.type.getFlags() === ts.TypeFlags.Object;
	}
	get isNewExpression() {
		return !!this.nodeLastChild && ts.isNewExpression(this.nodeLastChild);
	}

	get isNewMap() {
		return (
			!!this.nodeLastChild &&
			ts.isNewExpression(this.nodeLastChild) &&
			this.nodeLastChild.expression.getText() === 'Map'
		);
	}

	get nodeLastChild() {
		if (!this.node) return undefined;
		const count = this.node.getChildCount() - 1;
		return this.node.getChildAt(count);
	}
	serialise() {
		return {};
	}
	getTypesFromArguments(args?: ts.NodeArray<ts.ArrayLiteralExpression>) {
		if (!args || !args.length) return [];
		const argValues = args.at(0)!;
	}
	walk(node: ts.Node) {
		//const typeNode = 'name' in node ? (node.name as ts.Node) : node;
		let type: ts.Type | undefined;
		try {
			type = this.checker.getTypeAtLocation(node);
			if ('name' in node) {
				type = this.checker.getTypeAtLocation(node.name as ts.Node);
			}
		} catch (err) {}

		dox.log.info(
			ts.SyntaxKind[node.flags],
			node.getText(),
			!!type ? ts.TypeFlags[type.getFlags()] : undefined,
		);
		node.forEachChild((node) => this.walk(node));
	}
	*/
}
