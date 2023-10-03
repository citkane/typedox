import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import {
	DeclarationGroup,
	TsDeclaration,
	TsSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';

let errorStub: any;
let errorReports: object[] = [];
let tsSourceFile!: TsSourceFile;
let fileSymbol!: ts.Symbol;
let getSymbol = stubs.getExportSymbol.bind(fileSymbol);

before(function () {
	log.setLogLevel(logLevels.error);

	tsSourceFile = stubs.projectFactory.specTsSourceFile();
	assert.exists(tsSourceFile);
	getSymbol = stubs.getExportSymbol.bind(tsSourceFile.fileSymbol);
});
beforeEach(function () {
	errorStub = stub(log, 'error').callsFake((...args) => {
		errorReports.push(args[2]);
	});
	errorReports = [];
});
afterEach(function () {
	errorStub.restore();
});
it('creates a class instance', function () {
	const item = getSymbol('localDeclaration')!;
	new TsDeclaration(tsSourceFile, item);
	assert.doesNotThrow(() => new TsDeclaration(tsSourceFile, item));
	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});

it('parses a reExport', function () {
	const key = '__export';
	const symbol = getSymbol(key);
	new TsDeclaration(tsSourceFile, symbol!);
	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});
it('parses a nameSpaceExport', function () {
	let symbol = getSymbol('childSpace');
	new TsDeclaration(tsSourceFile, symbol!);

	symbol = getSymbol('emptySpace');
	new TsDeclaration(tsSourceFile, symbol!);

	symbol = getSymbol('grandchildSpace');
	new TsDeclaration(tsSourceFile, symbol!);

	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});
it('parses a module declaration', function () {
	let symbol = getSymbol('moduleDeclaration');
	new TsDeclaration(tsSourceFile, symbol!);

	symbol = getSymbol('emptyDeclaration');
	new TsDeclaration(tsSourceFile, symbol!);

	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});
it('maps an export specifier', function () {
	let symbol = getSymbol('localDeclaration');
	new TsDeclaration(tsSourceFile, symbol!);

	symbol = getSymbol('localAlias');
	new TsDeclaration(tsSourceFile, symbol!);

	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});
it('maps an import specifier', function () {
	const symbol = getSymbol('child');
	new TsDeclaration(tsSourceFile, symbol!);

	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});

it('covers all the test project cases', function () {
	tsSourceFile.fileSymbol.exports!.forEach((symbol) => {
		const declaration = new TsDeclaration(tsSourceFile, symbol);
		assert.exists(declaration.group);
		assert.isTrue(
			Object.values(DeclarationGroup).includes(declaration.group as any),
			`did not find ${declaration.group}`,
		);
	});

	assert.lengthOf(errorReports, 0, JSON.stringify(errorReports, null, 4));
});

it('creates an error report if an unknown item is encountered', function () {
	const isExportSpecifierStub = stub(
		TsDeclaration,
		'isExportSpecifier',
	).callsFake(() => false);

	const symbol = getSymbol('localDeclaration');
	new TsDeclaration(tsSourceFile, symbol!);

	assert.lengthOf(errorReports, 1);
	assert.equal(
		(errorReports[0] as any).sourceDeclaration,
		'export { localDeclaration, localDeclaration as localAlias };',
	);

	isExportSpecifierStub.restore();
});

it('creates an error if an unknown group is encountered', function () {
	const kindResolverStub = stub(
		TsDeclaration as any,
		'resolveGroupKind',
	).callsFake(() => ts.SyntaxKind.AmpersandAmpersandEqualsToken);

	const symbol = getSymbol('localDeclaration');
	const declaration = new TsDeclaration(tsSourceFile, symbol!);
	declaration.group;

	assert.lengthOf(errorReports, 1);
	assert.equal(errorReports[0], 'AmpersandAmpersandEqualsToken' as any);
	kindResolverStub.restore();
});
