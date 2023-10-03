import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import {
	DeclarationGroup,
	TsDeclaration,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';
import { Context } from 'mocha';

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
	log.setLogLevel(logLevels.error);

	this.errors = [];
	this.files = makeFiles();
	this.getDeclaration = getDeclaration.bind(this);
	this.testSpecifier = testSpecifier.bind(this);

	stubs.logSpecifierHelp();
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
	assert.equal(declaration.valueItem?.name, 'childClause');
	assert.equal(
		declaration.group,
		DeclarationGroup.Variable,
		DeclarationGroup[declaration.group!],
	);
	assert.equal(declaration.nameSpace, undefined);
});
it('maps a export= ExportAssignment', function () {
	const result = this.testSpecifier('export=', 'common');
	const { children, declaration } = result;
	assert.sameMembers(children, []);
	assert.equal(declaration.valueItem?.name, 'common');
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
});
it('maps a local ExportAssignment', function () {
	const result = this.testSpecifier('default', 'child');
	const { children, declaration } = result;
	assert.sameMembers(children, []);
	assert.equal(declaration.valueItem?.name, 'childClause');
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
	assert.sameMembers(children, ['grandchild', 'childSpace', 'child']);
	assert.equal(declaration.valueItem, undefined);
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
	assert.equal(declaration.valueItem?.name, 'localVar');
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
	assert.equal(declaration.valueItem?.name, 'grandchild');
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
	assert.equal(declaration.valueItem?.name, 'child');
	assert.equal(
		declaration.group,
		DeclarationGroup.Variable,
		DeclarationGroup[declaration.group!],
	);
	assert.equal(declaration.nameSpace, undefined);
});
it('maps a file ImportClause', function () {
	const result = this.testSpecifier('fileImportClause');
	const { children, declaration } = result;
	assert.sameMembers(children, ['default']);
	assert.equal(declaration.valueItem?.name, 'childClause');
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
	assert.equal(declaration.valueItem?.name, 'ts');
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
	assert.equal(declaration.valueItem?.name, 'ts');
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
	assert.equal(declaration.valueItem?.name, 'bar');
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
	assert.equal(declaration.valueItem?.name, 'local');
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
	assert.equal(declaration.valueItem?.name, 'grandchild');
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
	assert.equal(declaration.valueItem, undefined);
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
	assert.sameMembers(children, ['childSpace']);
	assert.sameMembers(Array.from(declaration.localDeclarationMap.keys()), [
		'local',
	]);
	assert.equal(declaration.valueItem?.name, 'moduleDeclaration');
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
	assert.equal(declaration.valueItem?.name, 'local');
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
	assert.sameMembers(children, ['default', 'child']);
	assert.equal(declaration.valueItem?.name, undefined);
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
	assert.sameMembers(children, ['grandchild', 'childSpace']);
	assert.equal(declaration.valueItem?.name, undefined);
	assert.equal(
		declaration.group,
		DeclarationGroup.Module,
		DeclarationGroup[declaration.group!],
	);
	assert.equal(declaration.nameSpace, 'grandchildSpace');
});

function getDeclaration(
	this: Context,
	key: string,
	file: keyof typeof this.files = 'specifiers',
) {
	return this.files[file].declarationsMap.get(key)!;
}
type testReturn = { children: string[]; declaration: TsDeclaration };
function testSpecifier(
	specifier: string,
	specifier2?: keyof ReturnType<typeof makeFiles>,
): testReturn;
function testSpecifier(declaration: TsDeclaration | undefined): testReturn;
function testSpecifier(
	this: Context,
	specifierOrDeclaration: string | TsDeclaration | undefined,
	specifier2?: keyof typeof this.files,
) {
	if (this.errorStub) this.errorStub.restore();
	this.errorStub = stub(log, 'error').callsFake((...args) => {
		console.log(args);
		this.errors.push(args[1]);
	});
	const declaration =
		typeof specifierOrDeclaration === 'string'
			? this.getDeclaration.call(this, specifierOrDeclaration, specifier2)
			: specifierOrDeclaration;
	assert.exists(declaration, 'declaration');
	assert.doesNotThrow(() => declaration!.mapRelationships());
	assert.lengthOf(this.errors, 0);

	return { children: Array.from(declaration!.children.keys()), declaration };
}
const makeFiles = () => {
	return {
		specifiers: stubs.projectFactory.specTsSourceFile('specifiers'),
		child: stubs.projectFactory.specTsSourceFile(
			'specifiers',
			undefined,
			'./child/child.ts',
		),
		grandchild: stubs.projectFactory.specTsSourceFile(
			'specifiers',
			undefined,
			'./grandchild/grandchild.ts',
		),
		common: stubs.projectFactory.specTsSourceFile(
			'specifiers',
			undefined,
			'./common/common.ts',
		),
	};
};
