import * as dox from '../typedox';

const log = dox.logger;

/**
 * The highest level container of the project structure, after which the tree is recursive:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- **Branch**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 *
 *
 */
export class Branch {
	parent: dox.TsReference | dox.Branch;
	_declarationBundle: Map<string, dox.TsDeclaration> = new Map();
	_exportStarBundle: Map<string, dox.TsDeclaration> = new Map();
	nameSpaces: Map<string, Branch> = new Map();
	classes: Map<string, dox.TsDeclaration> = new Map();
	variables: Map<string, dox.TsDeclaration> = new Map();
	functions: Map<string, dox.TsDeclaration> = new Map();
	enums: Map<string, dox.TsDeclaration> = new Map();
	constructor(
		parent: dox.TsReference | dox.Branch,
		declarations: dox.TsDeclaration[],
	) {
		this.parent = parent;
		declarations.forEach(this.bundleDeclaration);
		this.reExports.forEach(this.mergeReExportIntoDeclarations);
		this.declarationBundle.forEach(this.registerDeclaration);
	}
	private get reExports() {
		return [...this._exportStarBundle.values()];
	}
	private get declarationBundle() {
		return [...this._declarationBundle.values()];
	}

	private bundleDeclaration = (declaration: dox.TsDeclaration) => {
		const { kind, name } = declaration;
		const { DeclarationGroup: DeclarationKind } = dox;
		kind === DeclarationKind.ExportStar
			? this.bundleExportStar(declaration)
			: this._declarationBundle.set(declaration.name, declaration);
	};
	private mergeReExportIntoDeclarations = (
		declaration: dox.TsDeclaration,
	) => {
		if (this._declarationBundle.has(declaration.name)) return;
		this._declarationBundle.set(declaration.name, declaration);
	};
	private registerDeclaration = (declaration: dox.TsDeclaration) => {
		const { kind, name } = declaration;
		const { DeclarationGroup: DeclarationKind } = dox;

		kind === DeclarationKind.Module
			? this.registerNameSpace(declaration)
			: kind === DeclarationKind.Class
			? this.classes.set(name, declaration)
			: kind === DeclarationKind.Function
			? this.functions.set(name, declaration)
			: kind === DeclarationKind.Variable
			? this.variables.set(name, declaration)
			: kind === DeclarationKind.Enum
			? this.enums.set(name, declaration)
			: log.error(
					log.identifier(this),
					'Did not find a kind for a declaration: ',
					`${DeclarationKind[kind]}\n`,
					declaration.get.report,
			  );
	};
	private bundleExportStar = (declaration: dox.TsDeclaration) => {
		[...(declaration.children.values() || [])].forEach((declaration) => {
			if (this._exportStarBundle.has(declaration.name)) return;
			this._exportStarBundle.set(declaration.name, declaration);
		});
	};
	private registerNameSpace = (declaration: dox.TsDeclaration) => {
		if (this.nameSpaces.has(declaration.name)) return;
		const children = Branch.getChildDeclarations(declaration.children);
		const newBranch = new Branch(this, children);
		this.nameSpaces.set(declaration.name, newBranch);
	};

	private static getChildDeclarations(children: dox.declarationMap) {
		const values = children.values();
		return !!values ? [...values] : [];
	}
}
