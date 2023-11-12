import ts, { __String } from 'typescript';
import { assert } from 'chai';
import { CategoryKind, DoxDeclaration } from '@typedox/core';
import { stub } from 'sinon';
import { Context } from 'mocha';
import { log, logLevels } from '@typedox/logger';
import { declarationFactory, doxStub } from '@typedox/test';
import { notEqual } from 'assert';

const localLogLevel = logLevels.info;
const localFactory = 'specifiers';
const syntax = ts.SyntaxKind;
const escape = ts.escapeLeadingUnderscores;

declare module 'mocha' {
	export interface Context {
		errors: any[];
		errorStub?: ReturnType<typeof stub>;
		testSpecifier: typeof testSpecifier;
	}
}
export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);

		this.errors = [];
		this.testSpecifier = testSpecifier.bind(this);

		//loggerUtils.logSpecifierHelp();
	});
	afterEach(function () {
		if (this.errorStub) this.errorStub.restore();
		this.errors = [];
	});

	it('relates a imported ExportAssignment', function () {
		const result = this.testSpecifier(escape('default'));
		const { children, declaration } = result;
		assert.sameMembers(children, [escape('default')]);
		const targetParents = declaration.children.get(
			escape('default'),
		)!.parents;
		assert.isTrue(targetParents.has(declaration));
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childClause');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
		assert.isTrue(declaration.flags.isDefault);
	});
	it('relates a export= ExportAssignment', function () {
		const result = this.testSpecifier(
			escape('export='),
			'exportEqual/exportEqual.ts',
		);
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'common');
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			escape('foo'),
			'bar',
		]);
		assert.equal(declaration.nameSpace, 'common');
		assert.isTrue(declaration.flags.isDefault);
	});
	it('relates a local ExportAssignment', function () {
		const result = this.testSpecifier(escape('default'), 'child/child.ts');
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childClause');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates an ExportDeclaration', function () {
		const result = this.testSpecifier('__export' as __String);
		const { children, declaration } = result;
		assert.sameMembers(children, [
			escape('childClause'),
			escape('grandchild'),
			escape('childSpace'),
			escape('child'),
			escape('grandchildType'),
			escape('childType'),
		]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal(valueNode.getText(), "export * from './child/child';");
		assert.isTrue(declaration.flags.isReExporter);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a local variable ExportSpecifier', function () {
		const result = this.testSpecifier(escape('localVar'));
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'localVar');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a reExport variable ExportSpecifier', function () {
		const result = this.testSpecifier(escape('grandchild'));
		const { children, declaration } = result;
		assert.sameDeepMembers(children, [escape('grandchild')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchild');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a remote variable ExportSpecifier', function () {
		const result = this.testSpecifier(escape('remote'));
		const { children, declaration } = result;
		assert.sameDeepMembers(children, [escape('grandchild')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchild');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a export variable ExportSpecifier', function () {
		const result = this.testSpecifier(escape('child'));
		const { children, declaration } = result;
		assert.sameMembers(children, [escape('child')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'child');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a local type ExportSpecifier', function () {
		const result = this.testSpecifier(escape('localType'));
		const { children, declaration } = result;
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'localType');
		assert.equal(
			declaration.category,
			CategoryKind.Type,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a type ExportSpecifier', function () {
		const result = this.testSpecifier(escape('childType'));
		const { children, declaration } = result;
		assert.sameMembers(children, [escape('childType')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childType');
		assert.equal(
			declaration.category,
			CategoryKind.Type,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a remote type ExportSpecifier', function () {
		const result = this.testSpecifier(escape('grandchildType'));
		const { children, declaration } = result;
		assert.sameMembers(children, [escape('grandchildType')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchildType');
		assert.equal(
			declaration.category,
			CategoryKind.Type,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a file ImportClause', function () {
		const result = this.testSpecifier(escape('fileImportClause'));
		const { children, declaration } = result;
		assert.sameMembers(children, [escape('default')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childClause');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps an external module ImportClause', function () {
		const result = this.testSpecifier(escape('moduleImportClause'));
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'ts');
		/*
		assert.equal(
			declaration.children.get('export=')!.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		*/
		assert.equal(declaration.nameSpace, 'ts');
	});
	it('maps an external module ImportEqualsDeclaration', function () {
		const result = this.testSpecifier(escape('TypeScript'));
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'ts');
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'ts');
	});
	it('relates a local member ImportEqualsDeclaration', function () {
		const result = this.testSpecifier(escape('bar'));
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'bar');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a namespace ImportEqualsDeclaration', function () {
		const result = this.testSpecifier(escape('local'));
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			escape('foo'),
			escape('bar'),
		]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'local');
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'local');
	});
	it('relates a variable ImportSpecifier', function () {
		const result = this.testSpecifier(escape('grandchild'));
		const { children, declaration } = result;
		assert.sameMembers(children, [escape('grandchild')]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchild');
		assert.equal(
			declaration.category,
			CategoryKind.Variable,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('relates a namespace ImportSpecifier', function () {
		const result = this.testSpecifier(escape('nsImportSpecifier'));
		const { declaration } = result;
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			escape('childSpace'),
		]);
		assert.equal(
			declaration.valueNode.getText(),
			'childSpace as nsImportSpecifier',
		);
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'childSpace');
	});
	it('relates a external ImportSpecifer', function () {
		const result = this.testSpecifier(escape('EventEmitter'));
		const { children, declaration } = result;
		assert.exists(declaration);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal(valueNode.kind, ts.SyntaxKind.ClassDeclaration);
		assert.equal(declaration.category, CategoryKind.Class);
		assert.isTrue(declaration.flags.isExternal);
	});
	it('maps an export ModuleDeclaration', function () {
		const result = this.testSpecifier(escape('moduleDeclaration'));
		const { children, declaration } = result;
		const localKeys = Array.from(declaration.localDeclarationMap.keys());

		assert.sameMembers(localKeys, [escape('local'), escape('childSpace')]);
		const local = declaration.localDeclarationMap.get(escape('local'));
		const childSpace = declaration.localDeclarationMap.get(
			escape('childSpace'),
		);
		assert.exists(local?.doxSourceFile.fileName);
		assert.exists(childSpace?.doxSourceFile.fileName);
		assert.notEqual(
			local?.doxSourceFile.fileName,
			childSpace?.doxSourceFile.fileName,
		);
		assert.sameMembers(Array.from(local!.localDeclarationMap.keys()), [
			escape('foo'),
			escape('bar'),
		]);
		assert.sameMembers(Array.from(childSpace!.localDeclarationMap.keys()), [
			escape('grandchild'),
			escape('grandchildType'),
			escape('child'),
			escape('childType'),
			escape('childClause'),
		]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'moduleDeclaration');
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'moduleDeclaration');
	});
	it('relates a local ModuleDeclaration', function () {
		const result = this.testSpecifier(escape('local'));
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			escape('foo'),
			'bar',
		]);
		assert.equal(declaration.wrappedItem?.name, 'local');
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'local');
	});

	it('relates a NamespaceExport', function () {
		const result = this.testSpecifier(escape('namespaceExport'));
		const { declaration } = result;
		log.info(declaration.doxReference.program.getRootFileNames());
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			escape('child'),
			escape('childType'),
			escape('childClause'),
			escape('childSpace'),
			escape('grandchild'),
			escape('grandchildType'),
		]);
		const { valueNode } = declaration;
		assert.equal(valueNode.getText(), '* as namespaceExport');

		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'namespaceExport');
	});
	it('relates a NamespaceImport', function () {
		const result = this.testSpecifier(escape('grandchildSpace'));
		const { declaration } = result;
		log.info(declaration.doxReference.program.getRootFileNames());
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			escape('grandchild'),
			escape('childSpace'),
			escape('grandchildType'),
		]);
		const { valueNode } = declaration;
		assert.equal(valueNode.getText(), 'grandchildSpace');
		assert.equal(
			declaration.category,
			CategoryKind.Namespace,
			CategoryKind[declaration.category!],
		);
		assert.equal(declaration.nameSpace, 'grandchildSpace');
	});
	it.skip('relates an external NamespaceImport', function () {
		const result = this.testSpecifier(escape('fs'));
		const { children, declaration } = result;
		log.info(
			this.errors,
			declaration.name,
			children,
			declaration.localDeclarationMap,
		);
	});
	it.only('relates an InterfaceDeclaration', function () {
		const result = this.testSpecifier(escape('interfaceDeclaration'));
		const { children, declaration } = result;
		log.info(
			this.errors,
			declaration.name,
			children,
			declaration.localDeclarationMap,
		);
	});
	it('relates a Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			undefined,
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);

		testDefault(
			declaration,
			syntax.ObjectLiteralExpression,
			CategoryKind.Variable,
		);
	});
	it('relates a default array Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/array.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);

		testDefault(
			declaration,
			syntax.ArrayLiteralExpression,
			CategoryKind.Variable,
		);
	});
	it('relates a default arrowFunction Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/arrowFunction.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);

		testDefault(declaration, syntax.ArrowFunction, CategoryKind.Function);
	});
	it('relates a default class Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/class.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(declaration, syntax.ClassExpression, CategoryKind.Class);
	});
	it('relates a default classInstance Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/classInstance.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(declaration, syntax.NewExpression, CategoryKind.Variable);
	});
	it('relates a default enum Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/enum.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(declaration, syntax.EnumDeclaration, CategoryKind.Enum);
	});
	it('relates a default function Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/function.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.FunctionExpression,
			CategoryKind.Function,
		);
	});
	it('relates a default object Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/object.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.ObjectLiteralExpression,
			CategoryKind.Variable,
		);
	});
	it('relates a default string Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/string.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(declaration, syntax.StringLiteral, CategoryKind.Variable);
	});
	it('relates a default symbol Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/symbol.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(declaration, syntax.CallExpression, CategoryKind.Variable);
	});
	it('relates a default type Common export', function () {
		const result = this.testSpecifier(
			escape('export='),
			'default/type.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.TypeAliasDeclaration,
			CategoryKind.Type,
		);
	});
}
/*
it('test', function () {
	const file = makeFiles().test;
});
*/

function testSpecifier(
	this: Context,
	key: __String,
	file: string = 'index.ts',
	factory: doxStub.factoryFolders = localFactory,
) {
	resetErrors.call(this);

	const declaration = declarationFactory(factory, key, file);
	assert.exists(declaration, 'declaration');
	const { relate, wrappedItem } = declaration!;

	assert.doesNotThrow(() => relate(wrappedItem));
	assert.lengthOf(this.errors, 0, JSON.stringify(this.errors, null, 4));

	return {
		children: Array.from(declaration!.children.keys()),
		declaration,
	};

	function resetErrors(this: Context) {
		if (this.errorStub) this.errorStub.restore();
		this.errorStub = stub(log, 'error').callsFake((...args) => {
			console.log(args);
			this.errors.push(args[1]);
			return false;
		});
	}
}
function testDefault(
	declaration: DoxDeclaration,
	expectedKind: ts.SyntaxKind,
	expectedGroup: CategoryKind,
) {
	const { valueNode, wrappedItem, flags } = declaration;
	assert.isTrue(flags.isDefault);
	assert.exists(valueNode, 'valueNode');
	const { expression } = valueNode as ts.ExportAssignment;

	assert.equal(
		(expression || valueNode).kind,
		expectedKind,
		syntax[(expression || valueNode).kind],
	);
	assert.equal(
		wrappedItem?.kind,
		syntax.ExportAssignment,
		wrappedItem.kindString,
	);
	assert.equal(
		declaration.category,
		expectedGroup,
		CategoryKind[declaration.category],
	);
}
