import {
	DeclarationGroup,
	TsDeclaration,
	TsReference,
	declarationMap,
	logger as log,
} from '../typedox';

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
 */
export class Branch {
	parent: TsReference | Branch;
	_declarationBundle: Map<string, TsDeclaration> = new Map();
	reExportBundle: Map<string, TsDeclaration> = new Map();
	nameSpaces: Map<string, Branch> = new Map();
	classes: Map<string, TsDeclaration> = new Map();
	variables: Map<string, TsDeclaration> = new Map();
	functions: Map<string, TsDeclaration> = new Map();
	enums: Map<string, TsDeclaration> = new Map();
	types: Map<string, TsDeclaration> = new Map();
	default?: TsDeclaration;

	constructor(parent: TsReference | Branch, declarations: TsDeclaration[]) {
		this.parent = parent;
		declarations.forEach(this.bundleDeclaration);
		this.reExports.forEach(this.mergeReExportIntoDeclarations);
		this.declarationBundle.forEach(this.registerDeclaration);
	}
	private get reExports() {
		return Array.from(this.reExportBundle.values());
	}
	private get declarationBundle() {
		return Array.from(this._declarationBundle.values());
	}
	private set Default(assignment: TsDeclaration) {
		if (this.default)
			log.throwError(
				log.identifier(this),
				'Can have only one default on a branch',
				log.stackTracer,
			);
		this.default = assignment;
	}
	private bundleDeclaration = (declaration: TsDeclaration) => {
		const { group } = declaration;
		group === DeclarationGroup.ReExport
			? this.bundleReExport(declaration)
			: this._declarationBundle.set(declaration.name, declaration);
	};
	private mergeReExportIntoDeclarations = (declaration: TsDeclaration) => {
		if (this._declarationBundle.has(declaration.name)) return;
		this._declarationBundle.set(declaration.name, declaration);
	};
	private registerDeclaration = (declaration: TsDeclaration) => {
		const { group, name } = declaration;

		group === DeclarationGroup.Module
			? this.registerNameSpace(declaration)
			: group === DeclarationGroup.Class
			? this.classes.set(name, declaration)
			: group === DeclarationGroup.Function
			? this.functions.set(name, declaration)
			: group === DeclarationGroup.Variable
			? this.variables.set(name, declaration)
			: group === DeclarationGroup.Enum
			? this.enums.set(name, declaration)
			: group === DeclarationGroup.Type
			? this.types.set(name, declaration)
			: group === DeclarationGroup.Default
			? (this.Default = declaration)
			: log.error(
					log.identifier(this),
					'Did not find a group for a declaration: ',
					`${DeclarationGroup[group]}\n`,
					declaration.get.report,
			  );
	};
	private bundleReExport = (declaration: TsDeclaration) => {
		Array.from(declaration.children.values()).forEach((declaration) => {
			if (this.reExportBundle.has(declaration.name)) return;
			this.reExportBundle.set(declaration.name, declaration);
		});
	};
	private registerNameSpace = (declaration: TsDeclaration) => {
		if (this.nameSpaces.has(declaration.name)) return;
		const children = Branch.getChildDeclarations(declaration.children);
		const newBranch = new Branch(this, children);
		this.nameSpaces.set(declaration.name, newBranch);
	};

	private static getChildDeclarations(children: declarationMap) {
		return Array.from(children.values());
	}
}
