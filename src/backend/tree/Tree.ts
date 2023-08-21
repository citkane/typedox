import * as dox from '../typedox';
import * as ts from 'typescript';
import Branch from './Branch';

export default class Tree extends Branch {
	packageName: string;
	version?: string;

	constructor(pack: dox.Package) {
		super();
		this.packageName = pack.name;
		this.version = pack.version;
		const declarations = Tree.getDeclarationRoots(pack);

		this.makeTree(declarations, this);
	}
	public toObject() {
		return dox.serialiser.Serialiser.tree(this);
	}
	private makeTree = (
		declarations: dox.Declaration[],
		branch: dox.tree.Branch,
		specifierAlias?: string,
	): Tree => {
		declarations.forEach((declaration) => {
			const { getChildDeclarations } = Tree;
			let { alias, name, nameSpace, children, tsKind, type, symbol } =
				declaration;
			name = specifierAlias || name;
			switch (tsKind) {
				case ts.SyntaxKind.NamespaceExport:
					branch.nameSpaces?.set(
						nameSpace!,
						this.makeTree(
							getChildDeclarations(children),
							new dox.tree.Branch(),
						),
					);
					break;
				case ts.SyntaxKind.ExportSpecifier:
					const aliasName = alias?.name?.getText();
					const child = children.get(aliasName || name);
					const childArray = child ? [child] : [];
					!!alias
						? this.makeTree(childArray, branch, name)
						: this.makeTree(childArray, branch);
					break;
				case ts.SyntaxKind.ExportDeclaration:
					this.makeTree(getChildDeclarations(children), branch);
					break;
				default:
					branch.declarations?.set(name, declaration);
			}
		});
		return branch as Tree;
	};
	private static getChildDeclarations(children: dox.declarationMap) {
		const values = children.values();
		return !!values ? [...values] : [];
	}
	private static getDeclarationRoots = (pack: dox.Package) => {
		return this.getAllDeclarations(pack).filter(
			(declaration) => !declaration.parents.length,
		);
	};

	private static getAllDeclarations = (pack: dox.Package) => {
		return [...this.getAllFileSources(pack)]
			.map((fileSource) => [...fileSource.declarationsMap.values()])
			.flat();
	};
	private static getAllFileSources = (pack: dox.Package) => {
		return pack.filesMap.values();
	};
}
