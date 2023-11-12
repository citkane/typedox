import ts from 'typescript';
import { DeclarationFlags, Dox, DoxDeclaration } from '../index.mjs';
import { notices } from './notices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper, isLiteral, isSpecifierKind } from '@typedox/wrapper';

const __filename = log.getFilename(import.meta.url);

export class Declare extends Dox {
	public categoryTsKind!: ts.SyntaxKind;
	public declaration: DoxDeclaration;
	public flags: DeclarationFlags = {};
	public nameSpace?: string;

	private _valueNode!: ts.Node;
	private debug = notices.parse.debug.bind(this);

	constructor(declaration: DoxDeclaration) {
		super();
		this.declaration = declaration;
		this.valueNode = declaration.wrappedItem.tsNode;
	}
	public get valueNode() {
		return this._valueNode;
	}
	public declare = (wrapped: TsWrapper, isTarget = false) => {
		if (!isSpecifierKind(wrapped.kind)) {
			this.valueNode = wrapped.tsNode;
			this.categoryTsKind ??= wrapped.kind;
			return;
		}

		const key = ts.SyntaxKind[wrapped.kind] as keyof ReturnType<
			typeof functionFactory
		>;
		const declareFunction = functionFactory.call(this)[key];

		declareFunction
			? declareFunction.call(this, wrapped)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(
					this.declaration,
					wrapped,
					'declare',
					isTarget,
					__filename,
			  );
		function functionFactory(this: Declare) {
			return {
				ExportAssignment: this.declareExportAssignment,
				ExportDeclaration: this.declareExportDeclaration,
				ExportSpecifier: this.declareExportSpecifier,
				ImportClause: this.declareImportClause,
				ImportEqualsDeclaration: this.declareImportEqualsDeclaration,
				ImportSpecifier: this.declareImportSpecifier,
				ModuleDeclaration: this.declareModuleDeclaration,
				NamespaceExport: this.declareNamespaceExport,
				NamespaceImport: this.declareNamespaceImport,
			};
		}
	};
	/**
	 * export default clause;
	 * export = nameSpace;
	 * export = nameSpace.clause;
	 * export = {foo:'foo, bar:'bar'}
	 */
	private declareExportAssignment = (wrapped: TsWrapper) => {
		this.debug('ExportAssignment');

		this.flags.isDefault = true;
		const expression = (wrapped.tsNode as ts.ExportAssignment).expression;

		if (isLiteral(expression)) {
			this.valueNode = expression.parent;
			this.categoryTsKind = expression.kind;
			return;
		}

		const expressionWrap = this.declaration.tsWrap(expression);
		const target =
			wrapped.target || expressionWrap?.target || expressionWrap;

		target
			? this.declare(target)
			: notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * export * from './child/child
	 */
	private declareExportDeclaration = (wrapped: TsWrapper) => {
		this.debug('ExportDeclaration');
		this.flags.isReExporter = true;
		//this.categoryTsKind = this.declaration.wrappedItem.kind;
	};
	/**
	 * export { child } from './child/child;
	 * export { localVar, grandchild, grandchildSpace };
	 */
	private declareExportSpecifier = (wrapped: TsWrapper) => {
		this.debug('ExportSpecifier');

		wrapped.target
			? this.declare(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import TypeScript from 'typescript';
	 * import clause from './child/child';
	 */
	private declareImportClause = (wrapped: TsWrapper) => {
		this.debug('ImportClause');
		/*
		const target =
			wrapped.immediatelyAliasedSymbol || wrapped.aliasedSymbol;
		log.info('_'.repeat(10), target?.name);
		const wrappedTarget = target && this.declaration.tsWrap(target);
		*/
		!!wrapped.target
			? this.declare(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * export import childSpace = childSpace;
	 * export import bar = local.bar;
	 * export import bar = local.bar;
	 */
	private declareImportEqualsDeclaration = (wrapped: TsWrapper) => {
		this.debug('ImportEqualsDeclaration');

		!!wrapped.target
			? this.declare(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import { grandchild, childSpace } from './grandchild/grandchild'
	 */
	private declareImportSpecifier = (wrapped: TsWrapper) => {
		this.debug('ImportSpecifier');

		!!wrapped.target
			? this.declare(wrapped.target)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * export namespace moduleDeclaration { local; childSpace; };
	 * declare namespace local {foo = 'foo'}
	 */
	private declareModuleDeclaration = (wrapped: TsWrapper) => {
		this.debug('ModuleDeclaration');

		const node = wrapped.tsNode as ts.ModuleDeclaration;
		this.valueNode = node;
		this.nameSpace = node.name.getText();
		this.categoryTsKind = node.kind;

		/*
		wrapped.declaredModuleSymbols?.forEach((symbol) => {
			const wrapped = this.declaration.tsWrap(symbol);
			if (!wrapped) return;
			const declarable =
				!isSpecifierKind(wrapped.kind) ||
				ts.isModuleDeclaration(wrapped.tsNode);

			declarable && this.declareLocal(symbol);
		});
		*/
	};
	/**
	 * export * as childSpace from './child/child';
	 */
	private declareNamespaceExport = (
		wrapped: TsWrapper,
		skipNotice = false,
	) => {
		!skipNotice && this.debug('NamespaceExport');

		this.nameSpace = wrapped.name;
		this.categoryTsKind = ts.SyntaxKind.ModuleDeclaration;
	};
	/**
	 * import * as childSpace from '../child/child';
	 */
	private declareNamespaceImport = (wrapped: TsWrapper) => {
		this.debug('NamespaceImport');

		const fnc = this.declareNamespaceExport;
		fnc.call(this, wrapped, true);
	};
	/*
		declareBindingElement( wrapped: TsWrapper) {
			const topNode = ts.walkUpBindingElementsAndPatterns(
				wrapped.tsNode as ts.BindingElement,
			);
			this.valueNode = topNode;
			log.info(ts.SyntaxKind[topNode.kind]);
			const { initializer } = topNode;
			log.info(ts.SyntaxKind[topNode.initializer!.kind]);
		},
		
		declareObjectLiteralExpression(
			
			wrapped: TsWrapper,
		) {
			this.categoryTsKind = ts.SyntaxKind.ModuleDeclaration;
			this.valueItem = wrapped;
		},
		*/

	private set valueNode(node: ts.Node) {
		this._valueNode = node;

		if (ts.isVariableDeclaration(node)) {
			const firstChild = node.parent.getChildAt(0)!;
			const { LetKeyword, ConstKeyword, VarKeyword } = ts.SyntaxKind;
			const { kind } = firstChild;
			this.flags.scopeKeyword =
				kind === LetKeyword
					? 'let'
					: kind === ConstKeyword
					? 'const'
					: kind === VarKeyword
					? 'var'
					: (undefined as never);
		}
	}

	/*
	private declareLocal = (symbol: ts.Symbol, name?: string) => {
		const declaration = new DoxDeclaration(this.declaration, symbol, true);
		this.declaration.localDeclarationMap.set(
			name || declaration.name,
			declaration,
		);

		return declaration;
	};
	*/
}
