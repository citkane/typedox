import ts from 'typescript';
import { DeclarationFlags, Dox, DoxDeclaration } from '../index.mjs';
import { notices } from './libNotices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper, isLiteral, isSpecifierKind } from '@typedox/wrapper';
import { BindingResolver } from './BindingResolver.mjs';

const __filename = log.getFilename(import.meta.url);

export class Declare extends Dox {
	public categoryTsKind!: ts.SyntaxKind;
	public declaration: DoxDeclaration;
	public flags: DeclarationFlags = {};
	public nameSpace?: string;
	public bindingElement?: BindingResolver;

	private _valueNode!: ts.Node;
	private debug = notices.parse.debug.bind(this);

	constructor(declaration: DoxDeclaration) {
		super();

		this.declaration = declaration;
		this.flags.type = declaration.wrappedItem.tsType.flags;
	}
	public get valueNode() {
		return this._valueNode;
	}
	public declare = (wrapped: TsWrapper, repeat = false) => {
		if (!wrapped.isSpecifierKind) {
			const { tsNode } = wrapped;
			this.valueNode ??= ts.isVariableDeclaration(tsNode)
				? tsNode.parent.parent
				: tsNode;
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
					repeat,
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
				BindingElement: this.declareBindingElement,
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
		this.valueNode ??= wrapped.tsNode;

		if (isLiteral(expression)) {
			this.categoryTsKind = expression.kind;
			return;
		}

		const expressionWrap = this.declaration.tsWrap([expression]);
		const target =
			wrapped.target || expressionWrap?.target || expressionWrap;

		target
			? this.declare(target, true)
			: notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * export * from './child/child
	 */
	private declareExportDeclaration = (wrapped: TsWrapper) => {
		this.debug('ExportDeclaration');

		this.categoryTsKind = ts.SyntaxKind.ExportDeclaration;
		this.valueNode = wrapped.tsNode;
	};
	/**
	 * export { child } from './child/child;
	 * export { localVar, grandchild, grandchildSpace };
	 */
	private declareExportSpecifier = (wrapped: TsWrapper) => {
		this.debug('ExportSpecifier');

		this.valueNode ??= wrapped.tsNode.parent.parent;
		wrapped.target
			? this.declare(wrapped.target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import TypeScript from 'typescript';
	 * import clause from './child/child';
	 */
	private declareImportClause = (wrapped: TsWrapper) => {
		this.debug('ImportClause');

		this.valueNode ??= wrapped.tsNode.parent;
		!!wrapped.target
			? this.declare(wrapped.target, true)
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

		this.valueNode ??= wrapped.tsNode;
		!!wrapped.target
			? this.declare(wrapped.target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import { grandchild, childSpace } from './grandchild/grandchild'
	 */
	private declareImportSpecifier = (wrapped: TsWrapper) => {
		this.debug('ImportSpecifier');

		this.valueNode ??= wrapped.tsNode.parent.parent.parent;
		!!wrapped.target
			? this.declare(wrapped.target, true)
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
		this.valueNode ??= node;
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
		this.valueNode ??= wrapped.tsNode.parent;
	};
	/**
	 * import * as childSpace from '../child/child';
	 */
	private declareNamespaceImport = (wrapped: TsWrapper) => {
		this.debug('NamespaceImport');

		this.valueNode ??= wrapped.tsNode.parent.parent;
		const fnc = this.declareNamespaceExport;
		fnc.call(this, wrapped, true);
	};
	/**
	 * const {foo} = {foo, bar};
	 * const [bar] = [foo, bar];
	 */
	private declareBindingElement = (wrapped: TsWrapper) => {
		this.debug('BindingElement');

		const { checker } = this.declaration;

		this.bindingElement = new BindingResolver(checker, wrapped);
		this.categoryTsKind = this.bindingElement.kind;
		this.valueNode = this.bindingElement.declarationNode.parent.parent;
	};

	private set valueNode(node: ts.Node) {
		this._valueNode = node;

		if (ts.isVariableDeclaration(node)) {
			const firstChild = node.parent.getChildAt(0)!;
			const { LetKeyword, ConstKeyword, VarKeyword } = ts.SyntaxKind;
			const { kind } = firstChild;
			switch (kind) {
				case LetKeyword:
					this.flags.scopeKeyword = 'let';
					break;
				case ConstKeyword:
					this.flags.scopeKeyword = 'const';
					break;
				case VarKeyword:
					this.flags.scopeKeyword = 'var';
					break;
			}
		}
	}
}
