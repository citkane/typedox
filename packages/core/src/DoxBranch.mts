import { log, loggerUtils } from '@typedox/logger';
import { CategoryKind, Dox, DoxDeclaration, DoxReference } from './index.mjs';

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
	public doxReference: DoxReference;

	private branchDeclarations: DoxDeclaration[] = [];

	constructor(
		parent: DoxReference | DoxBranch,
		declarations: DoxDeclaration[],
	) {
		super();
		this.parent = parent;
		this.doxReference = this.getDoxReference(parent);
		declarations.forEach(this.bundleDeclaration);

		this.branchDeclarations.forEach(this.registerDeclaration);
		this.reExports.forEach(this.registerDeclaration);
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
		declaration.flags.isReExporter
			? this.bundleReExport(declaration)
			: this.branchDeclarations.push(declaration);
	};

	private registerDeclaration = (declaration: DoxDeclaration) => {
		const { category, name } = declaration;

		switch (category) {
			case CategoryKind.unknown:
				break;
			case CategoryKind.Namespace:
				this.registerNameSpace(declaration);
				break;
			case CategoryKind.Class:
				const { classes } = this;
				!classes.has(name) && classes.set(name, declaration);
				break;
			case CategoryKind.Function:
				const { functions: fncs } = this;
				!fncs.has(name) && fncs.set(name, declaration);
				break;
			case CategoryKind.Variable:
				const { variables: vars } = this;
				!vars.has(name) && vars.set(name, declaration);
				break;
			case CategoryKind.Enum:
				const { enums } = this;
				!enums.has(name) && enums.set(name, declaration);
				break;
			case CategoryKind.Type:
				const { types } = this;
				!types.has(name) && types.set(name, declaration);
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
		declaration.localDeclarationMap.forEach((declaration) => {
			const { name, category, localDeclarationMap, flags } = declaration;
			if (!flags.isReExporter && !this.reExports.has(name)) {
				this.reExports.set(name, declaration);
			}
			if (flags.isReExporter) {
				this.bundleReExport(declaration);
			}
		});
	};

	private registerNameSpace = (declaration: DoxDeclaration) => {
		const { warn } = notices.registerNameSpace;
		const { name, children, localDeclarationMap } = declaration;

		const values = [...children.values(), ...localDeclarationMap.values()];
		if (this.nameSpaces.has(name)) return warn(this, declaration);

		const newBranch = new DoxBranch(this, values);
		this.nameSpaces.set(declaration.name, newBranch);
	};
}

const seenNameSpaces: string[] = [];
const notices = {
	registerNameSpace: {
		warn: (branch: DoxBranch, declaration: DoxDeclaration) => {
			const { wrappedItem, name } = declaration;
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
					`The "${name}" namespace was already registered:`,
					loggerUtils.toLine(nodeDeclarationText, 30),
					fileName,
				);
			seenNameSpaces.push(id);
		},
	},
};
