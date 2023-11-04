import ts from 'typescript';
import { DeclarationFlags, DoxSourceFile, declarationsMap } from '../index.mjs';
import { Dox } from './Dox.mjs';
import { Relate } from '../declarationUtils/Relate.mjs';
import { Declare } from '../declarationUtils/Declare.mjs';
import getCategoryKind from '../declarationUtils/category.mjs';
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
	public children: declarationsMap = new Map();
	public doxSourceFile: DoxSourceFile;
	public flags!: DeclarationFlags;
	public localDeclarationMap: declarationsMap = new Map();
	public nameSpace?: string;
	public parent: DoxSourceFile | DoxDeclaration;
	public parents: Map<DoxDeclaration, boolean> = new Map();
	public valueNode!: ts.Node;
	public wrappedItem!: TsWrapper;
	public name: string;
	public error = false;

	private categoryTsKind!: ts.SyntaxKind;
	private _done?: boolean;

	constructor(
		parent: DoxSourceFile | DoxDeclaration,
		item: ts.Symbol,
		notExported: boolean = false,
	) {
		super();

		this.parent = parent;
		this.doxSourceFile = this.getDoxSourceFile(parent);
		this.wrappedItem = this.tsWrap(item)!;

		this.name = this.wrappedItem?.name || '';

		if (this.wrappedItem && !this.isExternalTarget()) {
			this.events.once(
				'core.declarations.findRootDeclarations',
				this.events.api['core.declarations.findRootDeclarations'].bind(
					this,
				),
			);
			this.events.emit('core.declaration.begin', this);

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
			notExported && (this.flags.notExported = true);
			this.declarationsMap.set(item.name, this);

			this.events.emit('core.declaration.declared', this);
		} else {
			this.errored();
		}
	}

	public get category() {
		return getCategoryKind(
			this.valueNode,
			this.wrappedItem,
			this.categoryTsKind,
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
	public get doxOptions() {
		return this.doxProject.options;
	}
	public isExternalTarget(wrapped = this.wrappedItem) {
		const { targetFileName, fileName } = wrapped;
		const _fileName = targetFileName || fileName;
		return (
			!_fileName.startsWith(this.doxOptions.projectRootDir) ||
			_fileName!.includes('node_modules')
		);
	}
	public relate = (wrappedItem: TsWrapper) => {
		try {
			new Relate(this, this.done).relate(wrappedItem);
		} catch (err) {
			this.errored();
		}
	};
	public destroy() {
		this.children.forEach((child) => child.parents.delete(this));
		this.error = true;
		this.events.off(
			'core.declarations.findRootDeclarations',
			this.events.api['core.declarations.findRootDeclarations'].bind(
				this,
			),
		);
	}
	private errored(err?: unknown) {
		if (err) log.error(err);
		this.destroy();
		this.done();
	}
	private done(isTarget?: boolean) {
		if (isTarget || this._done) return;
		this.events.emit('core.declaration.end', this);
		this._done = true;
	}
	private getDoxSourceFile(
		item: DoxSourceFile | DoxDeclaration,
	): DoxSourceFile {
		return this.isDoxSourceFile(item)
			? item
			: this.getDoxSourceFile(item.parent);
	}
}
