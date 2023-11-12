import ts, { __String } from 'typescript';
import { CategoryKind, Dox, DoxDeclaration, DoxSourceFile } from '../index.mjs';
import { notices } from './notices.mjs';
import { log } from '@typedox/logger';
import wrapper, { TsWrapper, isSpecifierKind } from '@typedox/wrapper';
import path from 'path';

const __filename = log.getFilename(import.meta.url);

export class Relate extends Dox {
	public declaration: DoxDeclaration;
	private debug = notices.parse.debug.bind(this);
	private done: (isTarget?: boolean) => void;

	constructor(
		declaration: DoxDeclaration,
		done: (isTarget?: boolean) => void,
	) {
		super();
		this.declaration = declaration;
		this.done = done.bind(this.declaration);
	}
	public relate = (wrapped: TsWrapper, localDeclaration = false) => {
		if (!isSpecifierKind(wrapped.kind)) return;
		const key = ts.SyntaxKind[wrapped.kind] as keyof ReturnType<
			typeof functionFactory
		>;
		const relateFunction = functionFactory.call(this)[key];

		relateFunction
			? relateFunction(wrapped, localDeclaration)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(
					this.declaration,
					wrapped,
					'relate',
					localDeclaration,
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
				InterfaceDeclaration: this.relateInterfaceDeclaration,
			};
		}
	};

	/**
	 * export default clause;
	 * export = nameSpace;
	 * export = nameSpace.clause;
	 * export = {foo:'foo, bar:'bar'}
	 */
	private relateExportAssignment = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ExportAssignment');

		const expression = (wrapped.tsNode as ts.ExportAssignment).expression;

		if (wrapper.isLiteral(expression)) return;
		const expressionWrap = this.declaration.tsWrap(expression);
		const target =
			wrapped.target || expressionWrap?.target || expressionWrap;
		target
			? this.relate(target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target') &&
			  this.declaration.destroy();
	};
	/**
	 * export * from './child/child
	 */
	private relateExportDeclaration = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ExportDeclaration');

		const { targetFileName } = wrapped;
		const file =
			!!targetFileName &&
			this.declaration.doxFilesMap.get(targetFileName);
		if (!!targetFileName && !file) {
			this.declaration.flags.isExternal = true;
			return;
		}
		if (!file) {
			this.fileNotFound(wrapped, targetFileName);
			this.declaration.destroy();
			return;
		}

		this.extractLocalSpace(file);
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

		const {
			adopt,
			findRelatedDeclaration: findChildDeclaration,
			done,
		} = this;

		wrapped.moduleSpecifier
			? parseModule.call(this.declaration, wrapped.moduleSpecifier)
			: parseLocal.call(this.declaration);

		const relation = this;
		function parseModule(this: DoxDeclaration, expression: ts.Expression) {
			//const { targetFileName: fileName } = tsWrap(expression);
			const child = findChildDeclaration(wrapped, expression);
			/* istanbul ignore next: soft error for debugging */
			if (!child) return done();

			adopt(child);
		}

		function parseLocal(this: DoxDeclaration) {
			wrapped.target
				? this.relate(wrapped.target)
				: /* istanbul ignore next: soft error for debugging */
				  notices.throw.call(relation, wrapped, 'target');
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

		const parent = this.findRelatedDeclaration(
			wrapped,
			wrapped.moduleSpecifier!,
			this.defaultStrings,
		);
		/* istanbul ignore next: soft error for debugging */
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
		localDeclaration = false,
	) => {
		this.debug('ImportEqualsDeclaration');
		wrapped.target
			? this.relate(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target') &&
			  this.declaration.destroy();
	};
	/**
	 * import { grandchild, childSpace } from './grandchild/grandchild'
	 */
	private relateImportSpecifier = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ImportSpecifier');

		const parent = this.findRelatedDeclaration(
			wrapped,
			wrapped.moduleSpecifier!,
		);
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
	private relateModuleDeclaration = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('ModuleDeclaration');

		wrapped.declaredModuleSymbols?.forEach((symbol) => {
			const wrapped = this.declaration.tsWrap(symbol);
			if (wrapped.error) return;

			let child: DoxDeclaration | undefined;
			const aliasedSymbol = wrapped.immediatelyAliasedSymbol;

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
				child.relate(child.wrappedItem);
			}
			this.adopt(child);
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
			/* istanbul ignore next: soft error for debugging */

			this.fileNotFound(wrapped, targetFileName);
			this.declaration.destroy();
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
	private relateInterfaceDeclaration = (
		wrapped: TsWrapper,
		localDeclaration = false,
	) => {
		this.debug('InterfaceDeclaration');
	};

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
				: this.adopt(child, true);
		});
		reExports.forEach((reExport) => this.relate(reExport, true));
	}
	private fileNotFound = (wrapped: TsWrapper, fileName?: string) => {
		notices.throw.call(this, wrapped, fileName);
	};
	/**
	 * Finds and returns the typedox doxDeclaration that has been referenced in a relationship.
	 * 1. Identify the target file name.
	 * 2. Retrieve the target doxSourceFile from the fileMap.
	 * 3. Retrieve the doxDeclaration from the doxSourceFile
	 * @param source the wrapped node from the ts.SourceFile AST.
	 * @param expression
	 * @param names could be just a [name], or the unforeseeable option ['export=','default']
	 * @returns the related doxDeclaration
	 */
	private findRelatedDeclaration = (
		source: TsWrapper,
		expression: ts.Expression,
		names = [source.escapedAlias || source.escapedName],
	): DoxDeclaration | undefined => {
		const { checker, doxFilesMap } = this.declaration;
		const location = checker.getSymbolAtLocation(expression);
		if (!location) return;

		let declaration: DoxDeclaration | undefined;
		names.forEach((name) => {
			if (declaration) return;

			const targetFile = getFilename(name, location);
			if (!targetFile) return;
			const declarationsMap =
				doxFilesMap.get(targetFile)?.declarationsMap;
			declaration = declarationsMap?.get(name);
		});

		return declaration;

		function getFilename(
			name: __String,
			locationSymbol: ts.Symbol,
		): string | undefined {
			const { exports } = locationSymbol;
			let tsDeclarations = exports?.get(name as any)?.declarations;
			let declaration = tsDeclarations && tsDeclarations[0];
			let targetFile = declaration?.getSourceFile().fileName;
			targetFile = targetFile && path.resolve(targetFile);

			if (targetFile) return targetFile;

			tsDeclarations = exports?.get('__export' as any)?.declarations;
			declaration = tsDeclarations && tsDeclarations[0];
			const moduleSpecifier = (declaration as any)?.moduleSpecifier;
			const exportLocation =
				moduleSpecifier && checker.getSymbolAtLocation(moduleSpecifier);

			return exportLocation
				? getFilename(name, exportLocation)
				: undefined;
		}
	};

	private get adopt() {
		return this.declaration.adopt;
	}
}
