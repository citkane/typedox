import * as ts from 'typescript';
import { assert } from 'chai';
import {
	DeclarationGroup,
	DoxDeclaration,
	DoxSourceFile,
	logger as log,
	logLevels,
	loggerUtils,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';
import { Context } from 'mocha';
import { globalLogLevel } from '../../tests.backend.spec';
import { projectFactory } from '../../factories/projectFactory';

const localLogLevel = logLevels.silent;
const localFactory = 'specifiers';
const syntax = ts.SyntaxKind;

declare module 'mocha' {
	export interface Context {
		errors: any[];
		errorStub?: ReturnType<typeof stub>;
		files: ReturnType<typeof makeFiles>;
		getDeclaration: typeof getDeclaration;
		testSpecifier: typeof testSpecifier;
	}
}

before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);

	this.errors = [];
	this.files = makeFiles();
	this.getDeclaration = getDeclaration.bind(this);
	this.testSpecifier = testSpecifier.bind(this);

	loggerUtils.logSpecifierHelp();
});
afterEach(function () {
	if (this.errorStub) this.errorStub.restore();
	this.errors = [];
});
after(function () {
	projectFactory.flushCache();
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
	assert.isTrue(declaration.flags.default);
});
it('maps a export= ExportAssignment', function () {
	const result = this.testSpecifier('export=', 'exportEqual');
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
	assert.isTrue(declaration.flags.default);
});
it('maps a local ExportAssignment', function () {
	const result = this.testSpecifier('default', 'child');
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
		'grandchild',
		'childSpace',
		'child',
		'grandchildType',
		'childType',
	]);
	assert.equal(declaration.valueNode, undefined);
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
	assert.equal(declaration.wrappedItem.name, 'localVar');
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
	assert.equal(declaration.wrappedItem.name, 'grandchild');
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
	assert.equal(declaration.wrappedItem.name, 'child');
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
	assert.equal(declaration.wrappedItem.name, 'localType');
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
	assert.equal(declaration.wrappedItem.name, 'childType');
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
	assert.equal(declaration.wrappedItem.name, 'bar');
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
	assert.equal(declaration.wrappedItem.name, 'local');
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
	assert.equal(declaration.wrappedItem.name, 'grandchild');
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
	assert.equal(declaration.valueNode, undefined);
	assert.equal(
		declaration.group,
		DeclarationGroup.Module,
		DeclarationGroup[declaration.group!],
	);
	assert.equal(declaration.nameSpace, 'childSpace');
});
it('maps an export ModuleDeclaration', function () {
	const result = this.testSpecifier('moduleDeclaration');
	const { children, declaration } = result;
	const localKeys = Array.from(declaration.localDeclarationMap.keys());

	assert.sameMembers(children, ['childSpace']);
	assert.sameMembers(localKeys, ['local']);
	assert.equal(declaration.wrappedItem.name, 'moduleDeclaration');
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
	]);
	const { valueNode } = declaration;
	assert.notExists(valueNode);

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
	assert.notExists(valueNode);
	assert.equal(
		declaration.group,
		DeclarationGroup.Module,
		DeclarationGroup[declaration.group!],
	);
	assert.equal(declaration.nameSpace, 'grandchildSpace');
});
it('maps a Common export', function () {
	const result = this.testSpecifier('export=', 'common');
	const { declaration, children } = result;
	assert.sameMembers(children, []);

	testDefault(
		declaration,
		syntax.ObjectLiteralExpression,
		DeclarationGroup.Variable,
	);
});

it('maps a default array Common export', function () {
	const result = this.testSpecifier('export=', 'defaultArray');
	const { declaration, children } = result;
	assert.sameMembers(children, []);

	testDefault(
		declaration,
		syntax.ArrayLiteralExpression,
		DeclarationGroup.Variable,
	);
});
it('maps a default arrowFunction Common export', function () {
	const result = this.testSpecifier('export=', 'defaultArrowFunction');
	const { declaration, children } = result;
	assert.sameMembers(children, []);

	testDefault(declaration, syntax.ArrowFunction, DeclarationGroup.Function);
});
it('maps a default class Common export', function () {
	const result = this.testSpecifier('export=', 'defaultClass');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(declaration, syntax.ClassExpression, DeclarationGroup.Class);
});
it('maps a default classInstance Common export', function () {
	const result = this.testSpecifier('export=', 'defaultClassInstance');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(declaration, syntax.NewExpression, DeclarationGroup.Variable);
});
it('maps a default enum Common export', function () {
	const result = this.testSpecifier('export=', 'defaultEnum');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(declaration, syntax.EnumDeclaration, DeclarationGroup.Enum);
});
it('maps a default function Common export', function () {
	const result = this.testSpecifier('export=', 'defaultFunction');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(
		declaration,
		syntax.FunctionExpression,
		DeclarationGroup.Function,
	);
});
it('maps a default object Common export', function () {
	const result = this.testSpecifier('export=', 'defaultObject');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(
		declaration,
		syntax.ObjectLiteralExpression,
		DeclarationGroup.Variable,
	);
});
it('maps a default string Common export', function () {
	const result = this.testSpecifier('export=', 'defaultString');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(declaration, syntax.StringLiteral, DeclarationGroup.Variable);
});
it('maps a default symbol Common export', function () {
	const result = this.testSpecifier('export=', 'defaultSymbol');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(declaration, syntax.CallExpression, DeclarationGroup.Variable);
});
it('maps a default type Common export', function () {
	const result = this.testSpecifier('export=', 'defaultType');
	const { declaration, children } = result;
	assert.sameMembers(children, []);
	testDefault(
		declaration,
		syntax.TypeAliasDeclaration,
		DeclarationGroup.Type,
	);
});

/*
it('test', function () {
	const file = makeFiles().test;
});
*/

type testReturn = { children: string[]; declaration: DoxDeclaration };
function testSpecifier(
	specifier: string,
	specifier2?: keyof ReturnType<typeof makeFiles>,
): testReturn;
function testSpecifier(declaration: DoxDeclaration | undefined): testReturn;
function testSpecifier(
	this: Context,
	specifierOrDeclaration: string | DoxDeclaration | undefined,
	specifier2?: keyof typeof this.files,
) {
	resetErrors.call(this);
	const overload = typeof specifierOrDeclaration === 'string';
	const declaration = overload
		? this.getDeclaration(specifierOrDeclaration, specifier2)
		: specifierOrDeclaration;

	assert.exists(declaration, 'declaration');
	const { relate: mapRelationships, wrappedItem } = declaration!;

	assert.doesNotThrow(() => mapRelationships(wrappedItem, false));
	assert.lengthOf(this.errors, 0, JSON.stringify(this.error, null, 4));

	return { children: Array.from(declaration!.children.keys()), declaration };

	function resetErrors(this: Context) {
		if (this.errorStub) this.errorStub.restore();
		this.errorStub = stub(log, 'error').callsFake((...args) => {
			this.errors.push(args[1]);
		});
	}
}
function testDefault(
	declaration: DoxDeclaration,
	expectedKind: ts.SyntaxKind,
	expectedGroup: DeclarationGroup,
) {
	const { valueNode, wrappedItem, flags } = declaration;
	assert.isTrue(flags.default);
	assert.exists(valueNode, 'valueNode');

	assert.equal(valueNode!.kind, expectedKind, syntax[valueNode!.kind]);
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
function getDeclaration(
	this: Context,
	key: string,
	file: keyof typeof this.files = localFactory,
) {
	return this.files[file].declarationsMap.get(key)!;
}
const makeFiles = () => {
	const files: Record<string, DoxSourceFile> = {
		specifiers: projectFactory.specDoxSourceFile(localFactory),
		child: projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			'./child/child.ts',
			true,
		),
		grandchild: projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			'./grandchild/grandchild.ts',
			true,
		),
		exportEqual: projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			'./exportEqual/exportEqual.ts',
			true,
		),

		common: projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			'./common/common.ts',
			true,
		),
	};
	[
		'Array',
		'ArrowFunction',
		'Class',
		'ClassInstance',
		'Enum',
		'Function',
		'Object',
		'String',
		'Symbol',
		'Type',
	].forEach((name) => {
		files[`default${name}`] = projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			`./common/default/${
				name.charAt(0).toLowerCase() + name.slice(1)
			}.ts`,
			true,
		);
	});
	return files;
};
