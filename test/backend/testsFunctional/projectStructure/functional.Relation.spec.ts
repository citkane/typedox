import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as path from 'path';
import {
	Relation,
	TsSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';

let sourceFile!: TsSourceFile;
let getDeclaration = stubs.getDeclaration.bind(sourceFile);
let errorStub: any;

const { projectDir } = stubs.compilerFactory('groups');

before(function () {
	log.setLogLevel(logLevels.error);

	sourceFile = stubs.projectFactory.specTsSourceFile();
	getDeclaration = stubs.getDeclaration.bind(sourceFile);
});
afterEach(function () {
	if (errorStub) errorStub.restore();
});

it('creates a class instance', function () {
	assert.exists(sourceFile, 'no sourceFile');
	const declaration = getDeclaration('localDeclaration');
	assert.doesNotThrow(() => new Relation(sourceFile, declaration!));
});

it('maps a reExport', function () {
	const key = `"${path.join(projectDir, 'child/child')}"`;
	const declaration = getDeclaration(key);
	assert.doesNotThrow(() => new Relation(sourceFile, declaration!));
});
it('maps a nameSpaceExport', function () {
	let declaration = getDeclaration('childSpace');
	assert.doesNotThrow(
		() => new Relation(sourceFile, declaration!),
		'childSpace',
	);
	declaration = getDeclaration('emptySpace');
	assert.doesNotThrow(
		() => new Relation(sourceFile, declaration!),
		'emptySpace',
	);
	declaration = getDeclaration('grandchildSpace');
	assert.doesNotThrow(
		() => new Relation(sourceFile, declaration!),
		'grandchildSpace',
	);
});
it('maps a module declaration', function () {
	let declaration = getDeclaration('moduleDeclaration');
	new Relation(sourceFile, declaration!);
	assert.doesNotThrow(
		() => new Relation(sourceFile, declaration!),
		'moduleDeclaration',
	);
	declaration = getDeclaration('emptyDeclaration');
	new Relation(sourceFile, declaration!);
	assert.doesNotThrow(
		() => new Relation(sourceFile, declaration!),
		'emptyDeclaration',
	);
});
it('maps an export specifier', function () {
	let declaration = getDeclaration('localExport');
	assert.doesNotThrow(() => new Relation(sourceFile, declaration!));
	declaration = getDeclaration('localAlias');
	assert.doesNotThrow(() => new Relation(sourceFile, declaration!));
});
it('maps an import specifier', function () {
	const declaration = getDeclaration('child');
	assert.doesNotThrow(() => new Relation(sourceFile, declaration!));
});
it('creates a deep report error if an unknown kind is encountered', function () {
	let report!: any;
	errorStub = stub(log, 'error').callsFake((...args) => {
		report = args[2];
	});
	const isExportSpecifierStub = stub(Relation, 'isExportSpecifier').callsFake(
		() => false,
	);
	let declaration = getDeclaration('localDeclaration');
	new Relation(sourceFile, declaration!);
	assert.exists(report);
	assert.equal(
		report.sourceDeclaration,
		'export { localDeclaration, localDeclaration as localAlias };',
		report.sourceDeclaration,
	);

	isExportSpecifierStub.restore();
});
it('maps all relations in the given template', function () {
	const errors: object[] = [];
	errorStub = stub(log, 'error').callsFake((...args) => {
		errors.push(args[2]);
	});

	sourceFile.declarationsMap.forEach((declaration) => {
		new Relation(sourceFile, declaration);
	});

	assert.lengthOf(errors, 0, JSON.stringify(errors, null, 4));
});
