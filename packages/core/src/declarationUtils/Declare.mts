import ts from 'typescript';
import { DeclarationFlags, Dox, DoxDeclaration } from '../index.mjs';
import { notices } from './libNotices.mjs';
import { log } from '@typedox/logger';
import { TsWrapper, isLiteral } from '@typedox/wrapper';
import { BindingResolver } from './BindingResolver.mjs';

const __filename = log.getFilename(import.meta.url);

export class Declare extends Dox {
	public categoryTsKind!: ts.SyntaxKind;
	public declaration: DoxDeclaration;
	public flags: DeclarationFlags = {};
	public nameSpace?: string;
	public bindingElement?: BindingResolver;
	public valueNode!: ts.Node;

	private debug = notices.parse.debug.bind(this);

	constructor(declaration: DoxDeclaration) {
		super();

		this.declaration = declaration;
		this.flags.type = declaration.wrappedItem.tsType.flags;
	}

	public declare = (wrapped: TsWrapper, repeat: boolean) => {
		if (!wrapped.isSpecifierKind) {
			this.valueNode ??= DoxDeclaration.getValueNode(wrapped.tsNode);
			this.categoryTsKind ??= wrapped.kind;
			return;
		}

		((declareFnc) => declareFnc?.call(this, wrapped, repeat))(
			((key) =>
				DoxDeclaration.functionFactory.call(this, 'declare', key))(
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
	private declareExportAssignment = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('ExportAssignment');

		this.flags.isDefault = true;
		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));

		((target) => {
			if (!target) notices.throw.call(this, wrapped, 'target');
			typeof target !== 'boolean' && this.declare(target, true);
		})(
			((expressionWrap) => determineTarget(expressionWrap))(
				((expression) => wrapExpression.call(this, expression))(
					(wrapped.tsNode as ts.ExportAssignment).expression,
				),
			),
		);
		function determineTarget(expressionWrap: TsWrapper | undefined) {
			return !expressionWrap
				? true
				: wrapped.target || expressionWrap?.target || expressionWrap;
		}
		function wrapExpression(this: Declare, expression: ts.Expression) {
			if (!isLiteral(expression)) {
				return this.declaration.tsWrap([expression]);
			}
			this.categoryTsKind = expression.kind;
		}
	};
	/**
	 * export * from './child/child
	 */
	private declareExportDeclaration = (
		wrapped: TsWrapper,
		repeat: boolean,
	) => {
		this.debug('ExportDeclaration');

		this.categoryTsKind = ts.SyntaxKind.ExportDeclaration;
		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));
	};
	/**
	 * export { child } from './child/child;
	 * export { localVar, grandchild, grandchildSpace };
	 */
	private declareExportSpecifier = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('ExportSpecifier');

		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));

		wrapped.target
			? this.declare(wrapped.target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import TypeScript from 'typescript';
	 * import clause from './child/child';
	 */
	private declareImportClause = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('ImportClause');

		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));
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
	private declareImportEqualsDeclaration = (
		wrapped: TsWrapper,
		repeat: boolean,
	) => {
		this.debug('ImportEqualsDeclaration');

		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));
		!!wrapped.target
			? this.declare(wrapped.target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * import { grandchild, childSpace } from './grandchild/grandchild'
	 */
	private declareImportSpecifier = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('ImportSpecifier');

		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));
		!!wrapped.target
			? this.declare(wrapped.target, true)
			: /* istanbul ignore next: soft error for debugging */
			  notices.throw.call(this, wrapped, 'target');
	};
	/**
	 * export namespace moduleDeclaration { local; childSpace; };
	 * declare namespace local {foo = 'foo'}
	 */
	private declareModuleDeclaration = (
		wrapped: TsWrapper,
		repeat: boolean,
	) => {
		this.debug('ModuleDeclaration');

		const node = wrapped.tsNode as ts.ModuleDeclaration;
		!repeat && (this.valueNode = DoxDeclaration.getValueNode(node));
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
	private declareNamespaceExport = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('NamespaceExport');

		this.nameSpace = wrapped.name;
		this.categoryTsKind = ts.SyntaxKind.ModuleDeclaration;
		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));
	};
	/**
	 * import * as childSpace from '../child/child';
	 */
	private declareNamespaceImport = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('NamespaceImport');

		this.nameSpace = wrapped.name;
		this.categoryTsKind = ts.SyntaxKind.ModuleDeclaration;
		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(wrapped.tsNode));
	};
	/**
	 * const {foo} = {foo, bar};
	 * const [bar] = [foo, bar];
	 */
	private declareBindingElement = (wrapped: TsWrapper, repeat: boolean) => {
		this.debug('BindingElement');

		const { checker } = this.declaration;

		this.bindingElement = new BindingResolver(checker, wrapped);
		this.categoryTsKind = this.bindingElement.kind;
		!repeat &&
			(this.valueNode = DoxDeclaration.getValueNode(
				this.bindingElement.declarationNode,
			));
	};
}
