import ts, { __String } from 'typescript';
import {
	CategoryKind,
	DeclarationFlags,
	DoxLocation,
	DoxSourceFile,
	events,
} from './index.mjs';
import { Dox } from './Dox.mjs';
import { Relate } from './declarationUtils/Relate.mjs';
import { Declare } from './declarationUtils/Declare.mjs';
import { getCategoryKind } from './declarationUtils/libCategory.mjs';
import { log } from '@typedox/logger';
import { TsWrapper } from '@typedox/wrapper';

const __filename = log.getFilename(import.meta.url);
/**
 * A container for typescript declarations:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- DoxSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- **DoxDeclaration**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...**DoxDeclaration**...
 *
 *
 */
export class DoxDeclaration extends Dox {
	public children = new Map<__String, DoxDeclaration>();
	public doxSourceFile: DoxSourceFile;
	public flags!: DeclarationFlags;
	public location!: DoxLocation;
	public localDeclarationMap = new Map<__String, DoxDeclaration>();
	public nameSpace?: string;
	public parent: DoxSourceFile | DoxDeclaration;
	public parents: Map<DoxDeclaration, boolean> = new Map();
	public valueNode!: ts.Node;
	public wrappedItem!: TsWrapper;
	public escapedName: __String;
	public error = false;

	private categoryTsKind!: ts.SyntaxKind;

	constructor(
		parent: DoxSourceFile | DoxDeclaration,
		item: ts.Symbol,
		notExported: boolean = false,
	) {
		super();

		this.parent = parent;
		this.doxSourceFile = this.getDoxSourceFile(parent);
		this.wrappedItem = this.tsWrap(item);
		this.escapedName = this.wrappedItem.escapedName;

		if (!this.wrappedItem.error) {
			const declare = new Declare(this);

			try {
				declare.declare(this.wrappedItem);
			} catch (err) {
				this.errored();
			}

			this.valueNode = declare.valueNode;
			this.categoryTsKind = declare.categoryTsKind;
			this.flags = declare.flags;
			this.nameSpace = declare.nameSpace;
			this.location = makeLocation(this);

			notExported && (this.flags.notExported = true);
			this.declarationsMap.set(item.escapedName, this);
		} else {
			this.errored();
		}
	}
	public get name() {
		return this.wrappedItem.kind === ts.SyntaxKind.ExportDeclaration
			? 'export*'
			: this.wrappedItem.name;
	}
	public get category() {
		if (this.flags.isExternal) {
			return CategoryKind.unknown;
		}
		return getCategoryKind(
			this.valueNode,
			this.wrappedItem,
			this.categoryTsKind,
			this.checker,
		);
	}
	public get categoryString() {
		return CategoryKind[this.category];
	}
	public get checker() {
		return this.doxSourceFile.checker;
	}
	public get doxProject() {
		return this.doxSourceFile.doxProject;
	}
	public get doxPackage() {
		return this.doxSourceFile.doxPackage;
	}
	public get doxReference() {
		return this.doxSourceFile.doxReference;
	}
	public get tsWrap() {
		return this.doxReference.tsWrap;
	}
	public get doxFilesMap() {
		return this.doxReference.filesMap;
	}
	public get declarationsMap() {
		return this.doxSourceFile.declarationsMap;
	}
	public get doxOptions() {
		return this.doxProject.options;
	}

	public relate = (item = this.wrappedItem) => {
		try {
			if (this.name === 'CategoryKind') {
				log.info(
					'-'.repeat(50),
					CategoryKind[this.category],
					this.wrappedItem.kindString,
				);
			}
			new Relate(this).relate(item);
		} catch (err) {
			this.errored();
		}
	};
	public adopt = (child: DoxDeclaration, localDeclaration = false) => {
		const { children, localDeclarationMap: local } = this;
		const { escapedName } = child;
		const isAdopted =
			(!localDeclaration && children.has(escapedName)) ||
			(localDeclaration && local.has(escapedName));

		if (isAdopted) return;

		child.parents.set(this, true);
		localDeclaration
			? local.set(child.escapedName, child)
			: children.set(child.escapedName, child);
	};

	public errored(err?: unknown) {
		this.error = true;
		this.children.forEach((child) => child.parents.delete(this));
		if (err) log.error(err);
	}

	private getDoxSourceFile(
		item: DoxSourceFile | DoxDeclaration,
	): DoxSourceFile {
		return this.isDoxSourceFile(item)
			? item
			: this.getDoxSourceFile(item.parent);
	}
}

const seen = new Set<string>();
const count = {} as Record<string, number>;
export function makeLocation(declaration: DoxDeclaration): DoxLocation {
	const { doxPackage, doxReference, category, name, flags } = declaration;
	let query = `${doxPackage.name}.${doxReference.name}.${
		CategoryKind[category]
	}.${flags.isDefault ? 'default' : name}`;
	if (seen.has(query)) {
		count[query] ??= 0;
		count[query]++;
		query = query + `_${count[query]}`;
	}
	seen.add(query);
	const hash = '';

	return { query, hash };
}
