import ts, { __String } from 'typescript';
import { CategoryKind, Dox, DoxDeclaration, DoxSourceFile } from '../index.mjs';
import { notices } from './libNotices.mjs';
import { log } from '@typedox/logger';
import wrapper, { TsWrapper } from '@typedox/wrapper';
import path from 'path';

const __filename = log.getFilename(import.meta.url);

export class Relate extends Dox {
	public declaration: DoxDeclaration;
	private debug = notices.parse.debug.bind(this);

	constructor(declaration: DoxDeclaration) {
		super();
		this.declaration = declaration;
	}
	public relate = (wrapped: TsWrapper, repeat = false) => {
		if (!wrapped.isSpecifierKind) {
			return;
		}

		const key = ts.SyntaxKind[wrapped.kind] as keyof ReturnType<
			typeof functionFactory
		>;
		const relateFunction = functionFactory.call(this)[key];

		relateFunction
			? relateFunction(wrapped, repeat)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(
					this.declaration,
					wrapped,
					'relate',
					repeat,
					__filename,
			  );

		function functionFactory(this: Relate) {
			return {
				ExportAssignment: this.relateExportAssignment,
				ExportDeclaration: this.relateExportDeclaration,
				ExportSpecifier: this.relateExportSpecifier,
				ImportClause: this.relateImportClause,
				ImportEqualsDeclaration: this.relateImportEqualsDeclaration,
				ImportSpecifier: this.relateImportSpecifier,
				ModuleDeclaration: this.relateModuleDeclaration,
				NamespaceExport: this.relateNamespaceExport,
				NamespaceImport: this.relateNamespaceImport,
				BindingElement: this.relateBindingElement,
			};
		}
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
	private relateExportDeclaration = (wrapped: TsWrapper, repeat = false) => {
		this.debug('ExportDeclaration');

		const reExports = [] as TsWrapper[];
		wrapped.tsSymbol.declarations?.forEach((declaration) => {
			const targetFile = this.declaration.tsWrap([
				declaration,
			]).targetFileName;
			const targetSourceFile = !!targetFile
				? this.declaration.doxReference.filesMap.get(targetFile)
				: undefined;

			targetSourceFile?.declarationsMap.forEach((child) => {
				const { exports } = targetSourceFile.fileSymbol;
				const { escapedName, wrappedItem } = child;
				const isReExport =
					wrappedItem.kind === ts.SyntaxKind.ExportDeclaration;
				if (
					isReExport ||
					!exports?.has(escapedName) ||
					this.defaultStrings.includes(escapedName)
				) {
					isReExport && reExports.push(wrappedItem);
					return;
				}
				this.declaration.adopt(child);
			});
		});
		reExports.forEach((wrapped) =>
			this.relateExportDeclaration(wrapped, true),
		);
	};
	/**
	 * export { child } from './child/child;
	 * export { localVar, grandchild, grandchildSpace };
	 */
	private relateExportSpecifier = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ExportSpecifier');

		if (!!wrapped.alias) return;
		const { findRelatedDeclaration } = this;

		wrapped.moduleSpecifier
			? parseModule.call(this)
			: parseLocal.call(this.declaration);

		const relation = this;
		function parseModule(this: Relate) {
			const child = findRelatedDeclaration(wrapped);
			if (!child) return;
			this.declaration.adopt(child);
		}

		function parseLocal(this: DoxDeclaration) {
			wrapped.target
				? this.relate(wrapped.target)
				: notices.throw.call(relation, wrapped, 'target');
		}
	};
	/**
	 * import TypeScript from 'typescript';
	 * import clause from './child/child';
	 */
	private relateImportClause = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ImportClause');

		const child = this.findRelatedDeclaration(wrapped);

		if (!child) {
			this.declaration.flags.isExternal = true;
			return;
		}

		this.declaration.adopt(child);
	};
	/**
	 * export import childSpace = childSpace;
	 * export import bar = local.bar;
	 * export import bar = local.bar;
	 */
	private relateImportEqualsDeclaration = (
		wrapped: TsWrapper,
		localDeclaration = false,
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
	private relateImportSpecifier = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ImportSpecifier');

		const child = this.findRelatedDeclaration(wrapped);
		if (!child) {
			this.declaration.flags.isExternal = true;
			return;
		}
		this.declaration.adopt(child);
	};
	/**
	 * export namespace moduleDeclaration { local; childSpace; };
	 * declare namespace local {foo = 'foo'}
	 */
	private relateModuleDeclaration = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ModuleDeclaration');

		wrapped.declaredModuleSymbols?.forEach((symbol) => {
			const wrappedChild = this.declaration.tsWrap(symbol);
			if (wrappedChild.error) return;

			let child: DoxDeclaration | undefined;
			const aliasedSymbol = wrappedChild.target?.tsSymbol;

			if (aliasedSymbol) {
				const declarations = aliasedSymbol?.declarations;
				const fileName =
					!!declarations && declarations[0].getSourceFile().fileName;

				const sourceFile = !!fileName
					? this.declaration.doxFilesMap.get(fileName)
					: undefined;
				const declarationMap = sourceFile?.declarationsMap;

				child = !!declarationMap
					? declarationMap.get(aliasedSymbol!.escapedName)
					: undefined;
			}
			if (!child) {
				child = new DoxDeclaration(this.declaration, symbol, true);
			}
			this.declaration.adopt(child, true);
		});
	};
	/**
	 * export * as childSpace from './child/child';
	 */
	private relateNamespaceExport = (
		wrapped: TsWrapper,
		localDeclaration = false,
		skipNotice = false,
	) => {
		!skipNotice && this.debug('NamespaceExport');

		const { targetFileName } = wrapped;
		const file = !!targetFileName
			? this.declaration.doxReference.filesMap.get(targetFileName)
			: undefined;

		if (!!targetFileName && !file) {
			this.declaration.flags.isExternal = true;
			return;
		}
		if (!file) {
			this.fileNotFound(wrapped, targetFileName);
			this.declaration.errored();
			return;
		}
		this.extractLocalSpace(file);
	};
	/**
	 * import * as childSpace from '../child/child';
	 */
	private relateNamespaceImport = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('NamespaceImport');

		const aliasFnc = this.relateNamespaceExport;
		aliasFnc.call(this, wrapped, localDeclaration, true);
	};
	/**
	 * const {foo} = {foo, bar};
	 * const [bar] = [foo, bar];
	 */
	private relateBindingElement = (wrapped: TsWrapper) => {
		this.debug('BindingElement');
	};

	private extractReExports(declaration: DoxDeclaration) {
		const targetFile = getTargetFile.call(this, declaration);
		if (!targetFile) return;

		const reExports: DoxDeclaration[] = [];
		const localFile = declaration.doxSourceFile;
		const thisFile = this.declaration.doxSourceFile;
		const { declarationsMap: targetDeclarations, fileSymbol } = targetFile;
		const { declarationsMap: localDeclarations } = localFile;
		const { declarationsMap: thisDeclarations } = thisFile;
		const { exports: targetExports } = fileSymbol;

		targetDeclarations.forEach((child) => {
			const { escapedName, valueNode } = child;
			const isReExport = ts.isExportDeclaration(valueNode);
			const notExported =
				!targetExports?.has(escapedName) ||
				localDeclarations.has(escapedName) ||
				thisDeclarations.has(escapedName) ||
				this.defaultStrings.includes(escapedName);

			if (isReExport || notExported) {
				isReExport && reExports.push(child);
				return;
			}

			this.declaration.adopt(child);
		});

		reExports.forEach(this.extractReExports.bind(this));

		function getTargetFile(this: Relate, declaration: DoxDeclaration) {
			const { wrappedItem } = declaration;
			const { targetFileName } = wrappedItem;
			const targetFile =
				!!targetFileName && declaration.doxFilesMap.get(targetFileName);
			if (!!targetFileName && !targetFile) {
				declaration.flags.isExternal = true;
				return undefined;
			}
			if (!targetFile) {
				this.fileNotFound(wrappedItem, targetFileName);
				declaration.errored();
				return undefined;
			}

			return targetFile;
		}
	}
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
				this.defaultStrings.includes(escapedName) ||
				child === this.declaration ||
				isNotExported
			) {
				return;
			}
			child.flags.reExported = true;
			isExportDeclaration
				? reExports.push(wrappedItem)
				: this.declaration.adopt(child, true);
		});
		//reExports.forEach((reExport) => this.relate(reExport, true));
	}
	private fileNotFound = (wrapped: TsWrapper, fileName?: string) => {
		notices.throw.call(this, wrapped, fileName);
	};

	private findRelatedDeclaration = (
		wrapped: TsWrapper,
	): DoxDeclaration | undefined => {
		const { targetFileName } = wrapped;
		const filesMap = this.declaration.doxReference.filesMap;
		const targetFile = targetFileName
			? filesMap.get(targetFileName)
			: undefined;

		return targetFile?.declarationsMap.get(
			wrapped.escapedAlias || wrapped.escapedName,
		);
	};
}
