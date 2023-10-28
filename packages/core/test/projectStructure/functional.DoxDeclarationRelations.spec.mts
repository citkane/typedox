import ts from 'typescript';
import { assert } from 'chai';
import { DeclarationGroup, DoxDeclaration, DoxSourceFile } from '@typedox/core';
import { stub } from 'sinon';
import { Context } from 'mocha';
import { log, logLevels } from '@typedox/logger';
import { declarationFactory, doxStub } from '@typedox/test';

const localLogLevel = logLevels.info;
const localFactory = 'specifiers';
const syntax = ts.SyntaxKind;

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

	it('maps a imported ExportAssignment', function () {
		const result = this.testSpecifier('default');
		const { children, declaration } = result;
		assert.sameMembers(children, ['default']);
		const targetParents = declaration.children.get('default')!.parents;
		assert.isTrue(targetParents.has(declaration));
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childClause');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
		assert.isTrue(declaration.flags.isDefault);
	});
	it('maps a export= ExportAssignment', function () {
		const result = this.testSpecifier(
			'export=',
			'exportEqual/exportEqual.ts',
		);
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'common');
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			'foo',
			'bar',
		]);
		assert.equal(declaration.nameSpace, 'common');
		assert.isTrue(declaration.flags.isDefault);
	});
	it('maps a local ExportAssignment', function () {
		const result = this.testSpecifier('default', 'child/child.ts');
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childClause');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps an ExportDeclaration', function () {
		const result = this.testSpecifier('__export');
		const { children, declaration } = result;
		assert.sameMembers(children, [
			'childClause',
			'grandchild',
			'childSpace',
			'child',
			'grandchildType',
			'childType',
		]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal(valueNode.getText(), "export * from './child/child';");
		assert.equal(
			declaration.group,
			DeclarationGroup.ReExport,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a local variable ExportSpecifier', function () {
		const result = this.testSpecifier('localVar');
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'localVar');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a reExport variable ExportSpecifier', function () {
		const result = this.testSpecifier('grandchild');
		const { children, declaration } = result;
		assert.sameDeepMembers(children, ['grandchild']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchild');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a remote variable ExportSpecifier', function () {
		const result = this.testSpecifier('remote');
		const { children, declaration } = result;
		assert.sameDeepMembers(children, ['grandchild']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchild');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a export variable ExportSpecifier', function () {
		const result = this.testSpecifier('child');
		const { children, declaration } = result;
		assert.sameMembers(children, ['child']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'child');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a local type ExportSpecifier', function () {
		const result = this.testSpecifier('localType');
		const { children, declaration } = result;
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'localType');
		assert.equal(
			declaration.group,
			DeclarationGroup.Type,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a type ExportSpecifier', function () {
		const result = this.testSpecifier('childType');
		const { children, declaration } = result;
		assert.sameMembers(children, ['childType']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childType');
		assert.equal(
			declaration.group,
			DeclarationGroup.Type,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a remote type ExportSpecifier', function () {
		const result = this.testSpecifier('grandchildType');
		const { children, declaration } = result;
		assert.sameMembers(children, ['grandchildType']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchildType');
		assert.equal(
			declaration.group,
			DeclarationGroup.Type,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a file ImportClause', function () {
		const result = this.testSpecifier('fileImportClause');
		const { children, declaration } = result;
		assert.sameMembers(children, ['default']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'childClause');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a module ImportClause', function () {
		const result = this.testSpecifier('moduleImportClause');
		const { children, declaration } = result;
		assert.sameMembers(children, ['export=']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'ts');
		assert.equal(
			declaration.children.get('export=')!.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'ts');
	});
	it('maps a module ImportEqualsDeclaration', function () {
		const result = this.testSpecifier('TypeScript');
		const { children, declaration } = result;
		assert.sameMembers(children, ['export=']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'ts');
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'ts');
	});
	it('maps a local member ImportEqualsDeclaration', function () {
		const result = this.testSpecifier('bar');
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'bar');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a namespace ImportEqualsDeclaration', function () {
		const result = this.testSpecifier('local');
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			'foo',
			'bar',
		]);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'local');
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'local');
	});
	it('maps a variable ImportSpecifier', function () {
		const result = this.testSpecifier('grandchild');
		const { children, declaration } = result;
		assert.sameMembers(children, ['grandchild']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'grandchild');
		assert.equal(
			declaration.group,
			DeclarationGroup.Variable,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, undefined);
	});
	it('maps a namespace ImportSpecifier', function () {
		const result = this.testSpecifier('nsImportSpecifier');
		const { children, declaration } = result;
		assert.sameMembers(children, ['childSpace']);
		assert.equal(
			declaration.valueNode.getText(),
			'childSpace as nsImportSpecifier',
		);
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'childSpace');
	});
	it.skip('maps a remote ImportSpecifer', function () {
		const result = this.testSpecifier('remoteImportSpecifer');
		const { children, declaration } = result;
		log.info(
			declaration.valueNode.getText(),
			DeclarationGroup[declaration.group],
		);
	});
	it('maps an export ModuleDeclaration', function () {
		const result = this.testSpecifier('moduleDeclaration');
		const { children, declaration } = result;
		const localKeys = Array.from(declaration.localDeclarationMap.keys());

		assert.sameMembers(children, ['childSpace']);
		assert.sameMembers(localKeys, ['local']);
		const { valueNode } = declaration;
		assert.exists(valueNode);
		assert.equal((valueNode as any).name.getText(), 'moduleDeclaration');
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'moduleDeclaration');
	});
	it('maps a local ModuleDeclaration', function () {
		const result = this.testSpecifier('local');
		const { children, declaration } = result;
		assert.sameMembers(children, []);
		assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
			'foo',
			'bar',
		]);
		assert.equal(declaration.wrappedItem?.name, 'local');
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'local');
	});

	it('maps a NamespaceExport', function () {
		const result = this.testSpecifier('childSpace');
		const { children, declaration } = result;

		assert.sameMembers(children, [
			'default',
			'child',
			'grandchild',
			'childSpace',
			'grandchildType',
			'childType',
			'childClause',
		]);
		const { valueNode } = declaration;
		assert.equal(valueNode.getText(), '* as childSpace');

		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'childSpace');
	});
	it('maps a NamespaceImport', function () {
		const result = this.testSpecifier('grandchildSpace');
		const { children, declaration } = result;
		assert.sameMembers(children, [
			'grandchild',
			'childSpace',
			'grandchildType',
		]);
		const { valueNode } = declaration;
		assert.equal(valueNode.getText(), 'grandchildSpace');
		assert.equal(
			declaration.group,
			DeclarationGroup.Module,
			DeclarationGroup[declaration.group!],
		);
		assert.equal(declaration.nameSpace, 'grandchildSpace');
	});
	it('maps a Common export', function () {
		const result = this.testSpecifier('export=', undefined, 'common');
		const { declaration, children } = result;
		assert.sameMembers(children, []);

		testDefault(
			declaration,
			syntax.ObjectLiteralExpression,
			DeclarationGroup.Variable,
		);
	});

	it('maps a default array Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/array.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);

		testDefault(
			declaration,
			syntax.ArrayLiteralExpression,
			DeclarationGroup.Variable,
		);
	});
	it('maps a default arrowFunction Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/arrowFunction.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);

		testDefault(
			declaration,
			syntax.ArrowFunction,
			DeclarationGroup.Function,
		);
	});
	it('maps a default class Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/class.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.ClassExpression,
			DeclarationGroup.Class,
		);
	});
	it('maps a default classInstance Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/classInstance.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.NewExpression,
			DeclarationGroup.Variable,
		);
	});
	it('maps a default enum Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/enum.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(declaration, syntax.EnumDeclaration, DeclarationGroup.Enum);
	});
	it('maps a default function Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/function.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.FunctionExpression,
			DeclarationGroup.Function,
		);
	});
	it('maps a default object Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/object.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.ObjectLiteralExpression,
			DeclarationGroup.Variable,
		);
	});
	it('maps a default string Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/string.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.StringLiteral,
			DeclarationGroup.Variable,
		);
	});
	it('maps a default symbol Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/symbol.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.CallExpression,
			DeclarationGroup.Variable,
		);
	});
	it('maps a default type Common export', function () {
		const result = this.testSpecifier(
			'export=',
			'default/type.ts',
			'common',
		);
		const { declaration, children } = result;
		assert.sameMembers(children, []);
		testDefault(
			declaration,
			syntax.TypeAliasDeclaration,
			DeclarationGroup.Type,
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
	key: string,
	file: string = 'index.ts',
	factory: doxStub.factoryFolders = localFactory,
) {
	resetErrors.call(this);

	const declaration = declarationFactory(factory, key, file);
	assert.exists(declaration, 'declaration');
	const { relate: mapRelationships, wrappedItem } = declaration!;

	assert.doesNotThrow(() => mapRelationships(wrappedItem, false));
	assert.lengthOf(this.errors, 0, JSON.stringify(this.error, null, 4));

	return {
		children: Array.from(declaration!.children.keys()),
		declaration,
	};

	function resetErrors(this: Context) {
		if (this.errorStub) this.errorStub.restore();
		this.errorStub = stub(log, 'error').callsFake((...args) => {
			this.errors.push(args[1]);
			return false;
		});
	}
}
function testDefault(
	declaration: DoxDeclaration,
	expectedKind: ts.SyntaxKind,
	expectedGroup: DeclarationGroup,
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
		declaration.group,
		expectedGroup,
		DeclarationGroup[declaration.group],
	);
}
