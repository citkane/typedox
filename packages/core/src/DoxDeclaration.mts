import ts, { __String } from 'typescript';
import {
	CategoryKind,
	DeclarationFlags,
	DoxLocation,
	DoxSourceFile,
} from './index.mjs';
import { Dox } from './Dox.mjs';
import { Relate } from './declarationUtils/Relate.mjs';
import { Declare } from './declarationUtils/Declare.mjs';
import { getCategoryKind } from './declarationUtils/libCategory.mjs';
import { log } from '@typedox/logger';
import { TsWrapper } from '@typedox/wrapper';
import { notices } from './declarationUtils/libNotices.mjs';

const __filename = log.getFilename(import.meta.url);
const count = new Map<string, number>();

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
	public children = new Set<DoxDeclaration>();
	public parents = new Set<DoxDeclaration>();
	public localDeclarations = new Map<__String, DoxDeclaration>();
	public doxSourceFile!: DoxSourceFile;
	public flags!: DeclarationFlags;
	public location!: DoxLocation;
	public nameSpace?: string;
	public parent!: DoxSourceFile | DoxDeclaration;
	public valueNode!: ts.Node;
	public wrappedItem!: TsWrapper;
	public escapedName!: __String;
	public escapedAlias?: __String;
	public kind!: ts.SyntaxKind;
	public error = false;
	public categoryTsKind!: ts.SyntaxKind;

	constructor(
		parent: DoxSourceFile | DoxDeclaration,
		item: ts.Symbol,
		isLocal: boolean,
	) {
		super();
		this.parent = parent;
		this.doxSourceFile = this.getDoxSourceFile(parent);

		try {
			this.wrappedItem = this.tsWrap(item);
			if (this.wrappedItem.error) throw Error();
			((declare) => {
				this.escapedName = this.wrappedItem.escapedName;
				this.escapedAlias = this.wrappedItem.escapedAlias;
				this.kind = this.wrappedItem.kind;

				declare.declare(this.wrappedItem, false);

				this.valueNode = declare.valueNode;
				this.categoryTsKind = declare.categoryTsKind;
				this.flags = declare.flags;
				this.nameSpace = declare.nameSpace;
				isLocal && (this.flags.isLocal = true);

				this.location = DoxDeclaration.makeLocation(this);
				DoxDeclaration.setScopeFlag(this.flags, this.valueNode);
			})(new Declare(this));
		} catch (err) {
			this.errored(err);
		}
	}
	public get name() {
		return this.wrappedItem.kind === ts.SyntaxKind.ExportDeclaration
			? 'export*'
			: this.wrappedItem.name;
	}
	public get category() {
		return getCategoryKind(this);
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
	public relate = (item: TsWrapper) => {
		try {
			new Relate(this).relate(item);
		} catch (err) {
			this.errored(err);
		}
	};
	public engender = (child: DoxDeclaration) => {
		child.parents.add(this);
		this.localDeclarations.set(child.escapedName, child);
	};
	public adopt = (child: DoxDeclaration) => {
		if (!this.shouldAdopt(child)) return;
		child.parents.add(this);
		this.children.add(child);
	};
	public static flushCounter() {
		count.clear();
	}
	public static functionFactory(
		this: Declare | Relate,
		prefix: 'relate' | 'declare',
		key: keyof typeof ts.SyntaxKind,
	) {
		return ((fnc) => {
			if (!fnc) {
				notices.report.call(this.declaration, prefix, __filename);
			}
			return fnc;
		})((this as any)[`${prefix}${key}`]);
	}
	public static getValueNode(node: ts.Node): ts.Node {
		if (ts.isSourceFile(node.parent)) return node;
		return DoxDeclaration.getValueNode(node.parent);
	}
	private shouldAdopt = (child: DoxDeclaration) => {
		return this.kind === ts.SyntaxKind.ExportDeclaration
			? DoxDeclaration.isEncapsulated(child)
			: true;
	};
	private getDoxSourceFile(
		item: DoxSourceFile | DoxDeclaration,
	): DoxSourceFile {
		return this.isDoxSourceFile(item)
			? item
			: this.getDoxSourceFile(item.parent);
	}
	private errored(err?: unknown) {
		this.error = true;
		this.children.forEach((child) => child.parents.delete(this));
		if (err) log.error(err);
	}
	private static isEncapsulated(declaration: DoxDeclaration) {
		return (
			!Dox.isImportSpecifierKind(declaration.kind) &&
			!Dox.defaultKeys.includes(declaration.escapedName) &&
			!!declaration.doxSourceFile.fileSymbol.exports?.has(
				declaration.escapedName,
			)
		);
	}
	private static setScopeFlag(flags: DeclarationFlags, node: ts.Node) {
		setFlag(flags, getScopeNode(node));

		function setFlag(
			flags: DeclarationFlags,
			node?: ts.Node,
			{ LetKeyword, ConstKeyword, VarKeyword } = ts.SyntaxKind,
		) {
			if (!node) return;
			switch (node.kind) {
				case LetKeyword:
					flags.scopeKeyword = 'let';
					break;
				case ConstKeyword:
					flags.scopeKeyword = 'const';
					break;
				case VarKeyword:
					flags.scopeKeyword = 'var';
					break;
			}
			return !!flags.scopeKeyword;
		}
		function getScopeNode(node: ts.Node) {
			return node
				.getChildren()
				.find(
					(node) =>
						node.kind === ts.SyntaxKind.VariableDeclarationList,
				)
				?.getChildAt(0);
		}
	}
	private static makeLocation(
		declaration: DoxDeclaration,
		hash = '',
	): DoxLocation {
		return ((query, hash) => ({ query, hash }))(
			makeQueryString(declaration),
			hash,
		);

		function makeQueryString({
			doxPackage,
			doxReference,
			kind,
			category,
			flags,
			name,
		}: DoxDeclaration) {
			return numberQuery(
				`${doxPackage.name}.${doxReference.name}.${kind}.${category}.${
					flags.isDefault ? 'default' : name
				}`,
			);
		}
		function numberQuery(query: string) {
			if (count.has(query)) return query + `_${counter(query)}`;
			count.set(query, 0);
			return query;
		}
		function counter(query: string) {
			count.set(query, count.get(query)! + 1);
			return count.get(query);
		}
	}
}
