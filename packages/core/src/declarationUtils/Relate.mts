import ts, { __String } from 'typescript';
import { Dox, DoxDeclaration } from '../index.mjs';
import { notices } from './libNotices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper } from '@typedox/wrapper';

const __filename = log.getFilename(import.meta.url);

export class Relate extends Dox {
	public declaration: DoxDeclaration;
	private debug = notices.parse.debug.bind(this);

	constructor(declaration: DoxDeclaration) {
		super();
		this.declaration = declaration;
	}
	public relate = (wrapped: TsWrapper, repeat = false) => {
		if (!wrapped.isSpecifierKind) return;

		((relateFnc) => relateFnc?.call(this, wrapped, repeat))(
			((key) => DoxDeclaration.functionFactory.call(this, 'relate', key))(
				ts.SyntaxKind[wrapped.kind] as keyof typeof ts.SyntaxKind,
			),
		);
	};

	/**
	 * export default clause;
	 * export = nameSpace;
	 * export = nameSpace.clause;
	 * export = {foo:'foo, bar:'bar'}
	 */
	private relateExportAssignment = (wrapped: TsWrapper, repeat = false) => {
		this.debug('ExportAssignment');

		const expression = (wrapped.tsNode as ts.ExportAssignment).expression;
		const expressionWrap = this.declaration.tsWrap([expression]);
		const target =
			wrapped.target || expressionWrap?.target || expressionWrap;

		target
			? this.relate(target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * export * from './child/child
	 */
	private relateExportDeclaration = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('ExportDeclaration');

		const reExports = [] as TsWrapper[];
		wrapped.tsSymbol.declarations?.forEach((declaration) => {
			((targetFile) =>
				((targetSourceFile) =>
					targetSourceFile?.declarationsMap.forEach((child) => {
						Relate.isReExport(child.wrappedItem)
							? reExports.push(child.wrappedItem)
							: this.declaration.adopt(child);
					}))(
					!!targetFile
						? this.declaration.doxReference.filesMap.get(targetFile)
						: undefined,
				))(this.declaration.tsWrap([declaration]).targetFileName);
		});

		reExports.forEach((wrapped) =>
			this.relateExportDeclaration(wrapped, true),
		);
	};
	/**
	 * export { child } from './child/child;
	 * export { localVar, grandchild, grandchildSpace };
	 */
	private relateExportSpecifier = (wrapped: TsWrapper, repeat = false) => {
		this.debug('ExportSpecifier');

		const child = this.findRelatedDeclaration(wrapped);

		if (!child) return;
		this.declaration.adopt(child);
	};
	/**
	 * import TypeScript from 'typescript';
	 * import clause from './child/child';
	 */
	private relateImportClause = (wrapped: TsWrapper, repeat = false) => {
		this.debug('ImportClause');

		const parent = this.findRelatedDefault(wrapped);

		if (!parent) {
			this.declaration.flags.isExternal = true;
			return;
		}
		parent.adopt(this.declaration);
	};
	/**
	 * export import childSpace = childSpace;
	 * export import bar = local.bar;
	 * export import bar = local.bar;
	 */
	private relateImportEqualsDeclaration = (
		wrapped: TsWrapper,
		repeat = false,
	) => {
		this.debug('ImportEqualsDeclaration');
		wrapped.target
			? this.relate(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import { grandchild, childSpace } from './grandchild/grandchild'
	 */
	private relateImportSpecifier = (wrapped: TsWrapper, repeat = false) => {
		this.debug('ImportSpecifier');

		const parent = this.findRelatedDeclaration(wrapped);
		if (!parent) {
			this.declaration.flags.isExternal = true;
			return;
		}

		parent.adopt(this.declaration);
	};
	/**
	 * export namespace moduleDeclaration { local; childSpace; };
	 * declare namespace local {foo = 'foo'}
	 */
	private relateModuleDeclaration = (wrapped: TsWrapper, repeat = false) => {
		this.debug('ModuleDeclaration');

		const { tsWrap, location, doxFilesMap, escapedName } = this.declaration;
		wrapped.declaredModuleSymbols?.forEach((symbol) => {
			const wrappedChild = tsWrap(symbol);
			if (wrappedChild.error) return;

			let child: DoxDeclaration | undefined;
			const aliasedSymbol = wrappedChild.target?.tsSymbol;

			if (aliasedSymbol) {
				const declarations = aliasedSymbol?.declarations;
				const fileName =
					!!declarations && declarations[0].getSourceFile().fileName;

				const sourceFile = !!fileName
					? doxFilesMap.get(fileName)
					: undefined;
				const declarationMap = sourceFile?.declarationsMap;

				child = !!declarationMap
					? declarationMap.get(escapedName)
					: undefined;
			}
			if (!child) {
				child = new DoxDeclaration(this.declaration, symbol, true);
			}
			this.declaration.engender(child);
		});
	};
	/**
	 * export * as childSpace from './child/child';
	 */
	private relateNamespaceExport = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('NamespaceExport');

		const { targetFileName } = wrapped;
		const targetSourceFile = !!targetFileName
			? this.declaration.doxReference.filesMap.get(targetFileName)
			: undefined;

		if (!!targetFileName && !targetSourceFile) {
			this.declaration.flags.isExternal = true;
			return;
		}
		if (!targetSourceFile) {
			this.fileNotFound(wrapped, targetFileName);
			throw Error();
		}
		const reExports = [] as TsWrapper[];
		targetSourceFile.declarationsMap.forEach((child) => {
			const { exports } = targetSourceFile.fileSymbol;
			const { escapedName, wrappedItem } = child;
			const isReExport =
				wrappedItem.kind === ts.SyntaxKind.ExportDeclaration;
			if (
				isReExport ||
				!exports?.has(escapedName) ||
				Dox.defaultKeys.includes(escapedName)
			) {
				isReExport && reExports.push(wrappedItem);
				return;
			}
			this.declaration.adopt(child);
		});
		reExports.forEach((wrapped) => {
			this.relateNamespaceExport(wrapped, true);
		});
	};
	/**
	 * import * as childSpace from '../child/child';
	 */
	private relateNamespaceImport = (wrapped: TsWrapper, repeat = false) => {
		this.debug('NamespaceImport');
		/*
		const aliasFnc = this.relateNamespaceExport;
		aliasFnc.call(this, wrapped, localDeclaration, true);
		*/
	};
	/**
	 * const {foo} = {foo, bar};
	 * const [bar] = [foo, bar];
	 */
	private relateBindingElement = (wrapped: TsWrapper) => {
		this.debug('BindingElement');
	};

	private findRelatedDefault = (wrapped: TsWrapper) => {
		let defaultDeclaration: DoxDeclaration | undefined;
		Dox.defaultKeys.forEach((defaultKey) => {
			if (defaultDeclaration) return;
			defaultDeclaration = this.findRelatedDeclaration(
				wrapped,
				defaultKey,
			);
		});
		return defaultDeclaration;
	};
	private findRelatedDeclaration = (
		wrapped: TsWrapper,
		defaultKey?: __String,
	): DoxDeclaration | undefined => {
		const { doxReference, escapedName, escapedAlias } = this.declaration;
		const { targetFileName, fileName } = wrapped;
		const filesMap = doxReference.filesMap;
		const targetFile = filesMap.get(targetFileName || fileName);
		if (!targetFile) return undefined;

		const key = defaultKey || escapedAlias || escapedName;
		const exportKey = '__export' as __String;

		const declaration =
			targetFile?.declarationsMap.get(key) ||
			targetFile?.declarationsMap.get(exportKey);

		return declaration;
	};
	/*
	private extractLocalSpace(file: DoxSourceFile) {
		const reExports: TsWrapper[] = [];
		const isLocalFile =
			file.fileName === this.declaration.doxSourceFile.fileName;

		file.declarationsMap.forEach((child) => {
			const { wrappedItem, escapedName, flags } = child;
			const { tsNode } = wrappedItem;
			const isExportDeclaration = ts.isExportDeclaration(tsNode);
			const isNotExported = !isLocalFile && flags.notExported;
			if (
				this.defaultKeys.includes(escapedName) ||
				child === this.declaration ||
				isNotExported
			) {
				return;
			}
			child.flags.reExported = true;
			isExportDeclaration
				? reExports.push(wrappedItem)
				: this.declaration.engender(child);
		});
		//reExports.forEach((reExport) => this.relate(reExport, true));
	}
	*/
	private fileNotFound = (wrapped: TsWrapper, fileName?: string) => {
		notices.throw.call(this, wrapped, fileName);
	};

	private static isReExport(wrappedItem: TsWrapper) {
		return wrappedItem.kind === ts.SyntaxKind.ExportDeclaration;
	}
}
