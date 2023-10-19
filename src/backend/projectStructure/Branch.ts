import {
	DeclarationGroup,
	DoxDeclaration,
	DoxReference,
	declarationsMap,
	logger as log,
	loggerUtils,
} from '../typedox';

/**
 * The highest level container of the project structure, after which the tree is recursive:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- DoxSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- DoxDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- **Branch**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...DoxDeclaration...
 *
 */
export class Branch {
	parent: DoxReference | Branch;
	declarations: Map<DoxDeclaration, string> = new Map();
	reExports: Map<string, DoxDeclaration> = new Map();
	nameSpaces: Map<string, Branch> = new Map();
	classes: Map<string, DoxDeclaration> = new Map();
	variables: Map<string, DoxDeclaration> = new Map();
	functions: Map<string, DoxDeclaration> = new Map();
	enums: Map<string, DoxDeclaration> = new Map();
	types: Map<string, DoxDeclaration> = new Map();
	default?: DoxDeclaration;

	constructor(parent: DoxReference | Branch, declarations: DoxDeclaration[]) {
		this.parent = parent;
		declarations.forEach(this.bundleDeclaration);
		this.reExports.forEach(this.mergeReExportIntoDeclarations);
		Array.from(this.declarations.keys()).forEach(this.registerDeclaration);
	}
	public get doxReference() {
		type parents = DoxReference | Branch;
		const { parent } = this;
		return getReference();
		function getReference(item: parents = parent): DoxReference {
			return item.constructor.name === 'Branch'
				? getReference(item.parent as parents)
				: (item as DoxReference);
		}
	}
	private bundleDeclaration = (declaration: DoxDeclaration) => {
		const { group, flags } = declaration;
		flags.isDefault && (this.default = declaration);
		group === DeclarationGroup.ReExport
			? this.bundleReExport(declaration)
			: this.declarations.set(declaration, declaration.name);
	};
	private mergeReExportIntoDeclarations = (declaration: DoxDeclaration) => {
		if (this.declarations.has(declaration)) return;
		this.declarations.set(declaration, declaration.name);
	};
	private registerDeclaration = (declaration: DoxDeclaration) => {
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
			: log.error(
					log.identifier(this),
					'Did not find a group for a declaration: ',
					`${DeclarationGroup[group]}\n`,
					declaration.wrappedItem.report,
			  );
	};
	private bundleReExport = (declaration: DoxDeclaration) => {
		const { name, group, children } = declaration;
		const reReExport = group === DeclarationGroup.ReExport;
		const isDuplicate = this.reExports.has(name);
		return reReExport
			? children.forEach(this.bundleReExport)
			: !isDuplicate && this.reExports.set(name, declaration);
	};

	private registerNameSpace = (declaration: DoxDeclaration) => {
		const { warn } = notices.registerNameSpace;
		const { name, children } = declaration;
		const { nameSpaces } = this;
		if (nameSpaces.has(name)) return warn(this, declaration);

		const values = [...children.values()].filter(
			(declaration) => !this.declarations.has(declaration),
		);
		const newBranch = new Branch(this, values);
		nameSpaces.set(declaration.name, newBranch);
	};
}

const seenNameSpaces: string[] = [];
const notices = {
	registerNameSpace: {
		warn: (branch: Branch, declaration: DoxDeclaration) => {
			const { wrappedItem } = declaration;
			const { nodeDeclarationText, fileName, tsNode } = wrappedItem;

			const id = nodeDeclarationText + fileName;
			if (!seenNameSpaces.includes(id))
				return log.warn(
					log.identifier(branch),
					`[${branch.doxReference.name}]`,
					'A namespace was already registered:',
					loggerUtils.toLine(nodeDeclarationText, 30),
					fileName,
				);
			seenNameSpaces.push(id);
		},
	},
};
