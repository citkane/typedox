import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';

import {
	DeclarationGroup,
	DoxDeclaration,
	DoxSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';
import { globalLogLevel } from '../../tests.backend.spec';
import { projectFactory } from '../../projectFactory';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

declare module 'mocha' {
	export interface Context {
		errorReports: object[];
		errorStub?: ReturnType<typeof stub>;
	}
}
before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);
	this.errorReports = [];
});
beforeEach(function () {
	this.errorStub = stub(log, 'error').callsFake((...args) => {
		this.errorReports.push(args);
	});
	this.errorReports = [];
});
afterEach(function () {
	this.errorStub!.restore();
});
after(function () {
	projectFactory.flushCache();
});
it('creates a class instance', function () {
	const doxSourceFile = stubs.doxSourceFile(localFactory);
	const symbol = stubs.getExportedSymbol.call(
		doxSourceFile.fileSymbol,
		'localExport',
	);
	let declaration!: DoxDeclaration;

	assert.exists(symbol);
	assert.doesNotThrow(
		() => (declaration = new DoxDeclaration(doxSourceFile, symbol!)),
	);
	assert.isTrue(declaration.isDoxDeclaration);
	assert.lengthOf(
		this.errorReports,
		0,
		JSON.stringify(this.errorReports, null, 4),
	);
});
it('parses a nameSpaceExport', function () {
	let symbol = getSymbol('childSpace');
	assert.exists(symbol);
	new DoxDeclaration(doxSourceFile(), symbol!);

	symbol = getSymbol('grandchildSpace');
	assert.exists(symbol);
	new DoxDeclaration(doxSourceFile(), symbol!);

	assert.lengthOf(
		this.errorReports,
		0,
		JSON.stringify(this.errorReports, null, 4),
	);
});
it('parses a module declaration', function () {
	let symbol = getSymbol('moduleDeclaration');
	assert.exists(symbol, 'moduleDeclaration');
	const declaration = new DoxDeclaration(doxSourceFile(), symbol!);
	assert.isTrue(declaration.localDeclarationMap.has('nsExport'));
	const child = declaration.localDeclarationMap.get('nsExport');
	const sourceFile = child!.doxSourceFile;
	assert.exists(sourceFile, 'sourceFile');
	assert.equal(
		sourceFile.constructor.name,
		'DoxSourceFile',
		sourceFile.constructor.name,
	);

	symbol = getSymbol('emptyDeclaration');
	assert.exists(symbol, 'emptyDeclaration');
	new DoxDeclaration(doxSourceFile(), symbol!);

	assert.lengthOf(
		this.errorReports,
		0,
		JSON.stringify(this.errorReports, null, 4),
	);
});
it('maps an export specifier', function () {
	let symbol = getSymbol('localDeclaration');
	assert.exists(symbol);
	new DoxDeclaration(doxSourceFile(), symbol!);

	symbol = getSymbol('localAlias');
	assert.exists(symbol);
	new DoxDeclaration(doxSourceFile(), symbol!);

	assert.lengthOf(
		this.errorReports,
		0,
		JSON.stringify(this.errorReports, null, 4),
	);
});
it('maps an import specifier', function () {
	const symbol = getSymbol('child');
	assert.exists(symbol);
	new DoxDeclaration(doxSourceFile(), symbol!);

	assert.lengthOf(
		this.errorReports,
		0,
		JSON.stringify(this.errorReports, null, 4),
	);
});
it('parses a reExport', function () {
	const symbol = getSymbol('__export');
	assert.exists(symbol);
	new DoxDeclaration(doxSourceFile(), symbol!);

	assert.lengthOf(
		this.errorReports,
		0,
		//JSON.stringify(this.errorReports, null, 4),
	);
});
it('covers all the test project cases', function () {
	doxSourceFile().fileSymbol.exports!.forEach((symbol) => {
		const declaration = new DoxDeclaration(doxSourceFile(), symbol);
		assert.exists(declaration.group);
		assert.isTrue(
			Object.values(DeclarationGroup).includes(declaration.group as any),
			`did not find ${declaration.group}`,
		);
	});

	assert.lengthOf(
		this.errorReports,
		0,
		JSON.stringify(this.errorReports, null, 4),
	);
});

it('creates an error if an unknown group is encountered', function () {
	const symbol = getSymbol('localDeclaration');
	assert.exists(symbol);
	const declaration = new DoxDeclaration(doxSourceFile(), symbol!);
	const parseGroupStub = stub(declaration as any, 'parseGroup').callsFake(
		() => {
			return { kind: ts.SyntaxKind.AmpersandAmpersandEqualsToken };
		},
	);

	declaration.group;

	assert.lengthOf(this.errorReports, 1);
	assert.include(
		this.errorReports[0].toString(),
		'AmpersandAmpersandEqualsToken',
	);
	parseGroupStub.restore();
});

let _doxSourceFile: DoxSourceFile;
function doxSourceFile() {
	return (_doxSourceFile ??= projectFactory.specDoxSourceFile(
		localFactory,
		undefined,
		'index.ts',
	));
}
function getSymbol(key: string) {
	return stubs.getExportedSymbol.call(doxSourceFile().fileSymbol, key);
}
