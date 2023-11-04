import { log, loggerUtils } from '@typedox/logger';
import { CategoryKind, Dox, DoxDeclaration, DoxReference } from '../index.mjs';

const __filename = log.getFilename(import.meta.url);

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
export class DoxBranch extends Dox {
	public parent: DoxReference | DoxBranch;

	public reExports: Map<string, DoxDeclaration> = new Map();
	public nameSpaces: Map<string, DoxBranch> = new Map();
	public classes: Map<string, DoxDeclaration> = new Map();
	public variables: Map<string, DoxDeclaration> = new Map();
	public functions: Map<string, DoxDeclaration> = new Map();
	public enums: Map<string, DoxDeclaration> = new Map();
	public types: Map<string, DoxDeclaration> = new Map();
	public default?: DoxDeclaration;
	public doxReference: DoxReference;

	private branchDeclarations: Map<DoxDeclaration, string> = new Map();

	constructor(
		parent: DoxReference | DoxBranch,
		declarations: DoxDeclaration[],
	) {
		super();
		this.parent = parent;
		this.doxReference = this.getDoxReference(parent);
		declarations.forEach(this.bundleDeclaration);
		this.reExports.forEach(this.mergeReExportIntoDeclarations);

		Array.from(this.branchDeclarations.keys()).forEach(
			this.registerDeclaration,
		);
	}

	public get doxPackage() {
		return this.doxReference.doxPackage;
	}
	public get doxProject() {
		return this.doxReference.doxProject;
	}

	private getDoxReference(item: DoxReference | DoxBranch): DoxReference {
		return Dox.isDoxReference(item)
			? item
			: this.getDoxReference(item.parent);
	}
	private bundleDeclaration = (declaration: DoxDeclaration) => {
		if (declaration.error) return;
		const { category, flags } = declaration;
		flags.isDefault && (this.default = declaration);
		category === CategoryKind.reExport
			? this.bundleReExport(declaration)
			: this.branchDeclarations.set(declaration, declaration.name);
	};
	private mergeReExportIntoDeclarations = (declaration: DoxDeclaration) => {
		if (this.branchDeclarations.has(declaration)) return;
		this.branchDeclarations.set(declaration, declaration.name);
	};
	private registerDeclaration = (declaration: DoxDeclaration) => {
		const { category, name } = declaration;
		switch (category) {
			case CategoryKind.Namespace:
				this.registerNameSpace(declaration);
				break;
			case CategoryKind.Class:
				this.classes.set(name, declaration);
				break;
			case CategoryKind.Function:
				this.functions.set(name, declaration);
				break;
			case CategoryKind.Variable:
				this.variables.set(name, declaration);
				break;
			case CategoryKind.Enum:
				this.enums.set(name, declaration);
				break;
			case CategoryKind.Type:
				this.types.set(name, declaration);
				break;
			default:
				log.error(
					log.identifier(this),
					'Did not find a category for a declaration: ',
					`${CategoryKind[category]}\n`,
					declaration.wrappedItem.report,
				);
				break;
		}
	};
	private bundleReExport = (declaration: DoxDeclaration) => {
		const { name, category, children } = declaration;
		const reReExport = category === CategoryKind.reExport;
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
			(declaration) => !this.branchDeclarations.has(declaration),
		);
		const newBranch = new DoxBranch(this, values);
		nameSpaces.set(declaration.name, newBranch);
	};
}

const seenNameSpaces: string[] = [];
const notices = {
	registerNameSpace: {
		warn: (branch: DoxBranch, declaration: DoxDeclaration) => {
			const { wrappedItem } = declaration;
			const {
				nodeDeclarationText,
				fileName,
				tsNodes: tsNode,
			} = wrappedItem;

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