import ts from 'typescript';
import {
	DeclarationFlags,
	DoxSourceFile,
	TsWrapper,
	declarationsMap,
} from '../typedox.mjs';
import { Dox } from './Dox.mjs';
import { Relate } from './declarationUtils/Relate.mjs';
import { Declare } from './declarationUtils/Declare.mjs';
import getGroupKind from './declarationUtils/group.mjs';
import { log } from 'typedox/logger';

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
	public children: declarationsMap = new Map();
	public doxSourceFile: DoxSourceFile;
	public flags!: DeclarationFlags;
	public localDeclarationMap: declarationsMap = new Map();
	public nameSpace?: string;
	public parent: DoxSourceFile | DoxDeclaration;
	public parents: Map<DoxDeclaration, boolean> = new Map();
	public valueNode!: ts.Node;
	public wrappedItem: TsWrapper;

	private groupTsKind!: ts.SyntaxKind;
	private _done?: boolean;

	constructor(
		parent: DoxSourceFile | DoxDeclaration,
		item: ts.Symbol,
		notExported: boolean = false,
	) {
		super();

		this.parent = parent;
		this.doxSourceFile = this.getDoxSourceFile();
		this.wrappedItem = this.tsWrap(item)!;

		if (this.wrappedItem) {
			this.once(
				'declarations.findRootDeclarations',
				this.eventCb['declarations.findRootDeclarations'].bind(this),
			);
			this.emit('declaration.begin', this);

			const declare = new Declare(this);
			declare.declare(this.wrappedItem);
			this.valueNode = declare.valueNode;
			this.groupTsKind = declare.groupTsKind;
			this.flags = declare.flags;
			this.nameSpace = declare.nameSpace;
			notExported && (this.flags.notExported = true);

			this.emit('declaration.declared', this);
		} else {
			this.destroy();
			this.done();
		}
	}
	public relate = new Relate(this, this.done).relate;
	public destroy() {
		this.children.forEach((child) => child.parents.delete(this));
		this.declarationsMap.delete(this.name);
		this.off(
			'declarations.findRootDeclarations',
			this.eventCb['declarations.findRootDeclarations'].bind(this),
		);
	}
	public get name() {
		return this.wrappedItem.name;
	}
	public get group() {
		return getGroupKind(
			this.valueNode,
			this.wrappedItem,
			this.groupTsKind,
			this.checker,
		);
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

	private done(isTarget?: boolean) {
		if (isTarget || this._done) return;
		this.emit('declaration.finished', this);
		this._done = true;
	}
	private getDoxSourceFile() {
		const getSourcefile = (
			parent: DoxSourceFile | DoxDeclaration,
		): DoxSourceFile => {
			return this.isDoxSourceFile(parent)
				? (parent as DoxSourceFile)
				: getSourcefile((parent as DoxDeclaration).parent);
		};
		return getSourcefile(this.parent);
	}
}
