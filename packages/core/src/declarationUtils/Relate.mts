import ts from 'typescript';
import { Dox, DoxDeclaration } from '../index.mjs';
import { notices } from './notices.mjs';
import { log } from '@typedox/logger';
import wrapper, { TsWrapper } from '@typedox/wrapper';

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
	public relate = (wrapped: TsWrapper, isTarget = false) => {
		if (!wrapper.isSpecifierKind(wrapped.kind)) return this.done(isTarget);

		const key = ts.SyntaxKind[wrapped.kind] as keyof ReturnType<
			typeof functionFactory
		>;
		const relateFunction = functionFactory.call(this)[key];

		relateFunction
			? relateFunction(wrapped)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(
					this.declaration,
					wrapped,
					'relate',
					isTarget,
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
			};
		}
	};

	/**
	 * export default clause;
	 * export = nameSpace;
	 * export = nameSpace.clause;
	 * export = {foo:'foo, bar:'bar'}
	 */
	private relateExportAssignment = (wrapped: TsWrapper) => {
		this.debug('ExportAssignment');

		const expression = (wrapped.tsNode as ts.ExportAssignment).expression;

		if (wrapper.isLiteral(expression)) return this.done();
		const expressionWrap = this.declaration.tsWrap(expression);
		const target =
			wrapped.target || expressionWrap?.target || expressionWrap;
		target
			? this.relate(target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target', log.stackTracer()) &&
			  this.declaration.destroy();
	};
	/**
	 * export * from './child/child
	 */
	private relateExportDeclaration = (wrapped: TsWrapper) => {
		this.debug('ExportDeclaration');
		/*
		const { targetFileName } = wrapped;
		const file =
			targetFileName && this.declaration.doxFilesMap.get(targetFileName);

		if (!file) {
			this.fileNotFound(wrapped, targetFileName);
			this.declaration.destroy();
			return;
		}

		const reExports: TsWrapper[] = [];
		file.declarationsMap.forEach((child) => {
			const { wrappedItem, name } = child;
			const { tsNode } = wrappedItem;
			const isExportDeclaration = ts.isExportDeclaration(tsNode);

			if (this.defaultStrings.includes(name)) return;
			isExportDeclaration
				? reExports.push(wrappedItem)
				: this.adopt(child);
		});
		reExports.forEach((reExport) => {
			this.relate(reExport, true);
		});
		*/
		this.done();
	};
	/**
	 * export { child } from './child/child;
	 * export { localVar, grandchild, grandchildSpace };
	 */
	private relateExportSpecifier = (wrapped: TsWrapper) => {
		this.debug('ExportSpecifier');

		const { adopt, findChildDeclaration, done } = this;

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
				  notices.throw.call(
						relation,
						wrapped,
						'target',
						log.stackTracer(),
				  ) && this.destroy();
		}
	};
	/**
	 * import TypeScript from 'typescript';
	 * import clause from './child/child';
	 */
	private relateImportClause = (wrapped: TsWrapper) => {
		this.debug('ImportClause');

		const child = this.findChildDeclaration(
			wrapped,
			wrapped.moduleSpecifier!,
			this.defaultStrings,
		);
		/* istanbul ignore next: soft error for debugging */
		if (!child) return this.done();

		this.adopt(child);
	};
	/**
	 * export import childSpace = childSpace;
	 * export import bar = local.bar;
	 * export import bar = local.bar;
	 */
	private relateImportEqualsDeclaration = (wrapped: TsWrapper) => {
		this.debug('ImportEqualsDeclaration');
		wrapped.target
			? this.relate(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target', log.stackTracer()) &&
			  this.declaration.destroy();
	};
	/**
	 * import { grandchild, childSpace } from './grandchild/grandchild'
	 */
	private relateImportSpecifier = (wrapped: TsWrapper) => {
		this.debug('ImportSpecifier');

		const child = this.findChildDeclaration(
			wrapped,
			wrapped.moduleSpecifier!,
		);
		/* istanbul ignore next: soft error for debugging */
		if (!child) return this.done();

		this.adopt(child);
	};
	/**
	 * export namespace moduleDeclaration { local; childSpace; };
	 * declare namespace local {foo = 'foo'}
	 */
	private relateModuleDeclaration = (wrapped: TsWrapper) => {
		this.debug('ModuleDeclaration');
		wrapped.declaredModuleSymbols!.forEach((symbol) => {
			/*
			const child = new DoxDeclaration(this.declaration, symbol);
			this.adopt(child);
			
			const wrapped = this.declaration.tsWrap(symbol);
			if (wrapped) {
				const child = new DoxDeclaration(this.declaration, symbol)
				//this.relate(wrapped, true);
			}
			*/
		});
		this.done();
	};
	/**
	 * export * as childSpace from './child/child';
	 */
	private relateNamespaceExport = (
		wrapped: TsWrapper,
		skipNotice = false,
	) => {
		!skipNotice && this.debug('NamespaceExport');

		const { targetFileName } = wrapped;
		const file = !!targetFileName
			? this.declaration.doxReference.filesMap.get(targetFileName)
			: undefined;
		/* istanbul ignore next: soft error for debugging */
		if (!file) {
			this.fileNotFound(wrapped, targetFileName);
			this.declaration.destroy();
			return;
		}

		file.declarationsMap.forEach((child) => {
			const { wrappedItem } = child;
			const isExportDeclaration = ts.isExportDeclaration(
				wrappedItem.tsNode,
			);
			if (!isExportDeclaration) return this.adopt(child);

			this.relate(wrappedItem, true);
		});
		this.done();
	};
	/**
	 * import * as childSpace from '../child/child';
	 */
	private relateNamespaceImport = (wrapped: TsWrapper) => {
		this.debug('NamespaceImport');

		const aliasFnc = this.relateNamespaceExport;
		aliasFnc.call(this, wrapped, true);
	};

	private fileNotFound = (wrapped: TsWrapper, fileName?: string) => {
		const message = `An invalid file was referenced: "${wrapped.nodeDeclarationText}" in`;
		fileName
			? notices.throw.call(
					this,
					wrapped,
					wrapped.fileName,
					message,
					'warn',
			  )
			: notices.throw.call(this, wrapped, 'file', log.stackTracer());
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
	private findChildDeclaration = (
		source: TsWrapper,
		expression: ts.Expression,
		names = [source.alias || source.name],
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
			name: string,
			locationSymbol: ts.Symbol,
		): string | undefined {
			const { exports } = locationSymbol;
			let tsDeclarations = exports?.get(name as any)?.declarations;
			let declaration = tsDeclarations && tsDeclarations[0];
			const targetFile = declaration?.getSourceFile().fileName;

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
	private adopt = (child: DoxDeclaration) => {
		const { declaration } = this;
		if (declaration.children.has(child.name)) return this.done();
		child.parents.set(declaration, true);
		declaration.children.set(child.name, child);
		this.done();
	};
}
