import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import {
	TsSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';

let tsSourceFile!: TsSourceFile;
let fileSymbol!: ts.Symbol;
let errorStub: any;

const { projectDir } = stubs.compilerFactory('groups');

before(function () {
	log.setLogLevel(logLevels.error);
});
afterEach(function () {
	if (errorStub) errorStub.restore();
});

it('creates a class instance', function () {
	const reference = stubs.projectFactory.specReference();
	const program: ts.Program = (reference as any).program;
	const checker = program.getTypeChecker();
	const source = program.getSourceFile(path.join(projectDir, 'index.ts'));
	fileSymbol = checker.getSymbolAtLocation(source!)!;
	assert.exists(reference, 'no reference');
	assert.exists(program, 'no program');
	assert.exists(checker, 'no checker');
	assert.exists(source, 'no source');
	assert.exists(fileSymbol, 'no symbol');

	assert.doesNotThrow(
		() =>
			(tsSourceFile = new TsSourceFile(reference, source!, fileSymbol!)),
	);
});
it('discovers files referenced within the file', function () {
	const exports = fileSymbol.exports?.values();
	const symbols = Array.from(exports || []);
	const expectedFiles = ['child.ts', 'grandchild.ts', 'greatGrandchild.ts'];
	assert.isTrue(!!symbols && !!symbols.length, 'did not get export symbols');
	let discoveredFiles!: string[];

	assert.doesNotThrow(
		() => (discoveredFiles = (tsSourceFile as any).discoverFiles(symbols)),
	);
	assert.lengthOf(discoveredFiles, 3);
	discoveredFiles.forEach((file) => {
		assert.isTrue(expectedFiles.includes(path.basename(file)));
	});
});
it('discovers declarations in the file', function () {
	const { declarationsMap } = tsSourceFile;
	assert.equal(declarationsMap.size, 0, 'declarations were not empty');
	assert.doesNotThrow(() => tsSourceFile.discoverDeclarations());
	assert.isTrue(declarationsMap.size >= 8, 'did not find declarations');
	declarationsMap.forEach((declaration) => {
		assert.equal(
			declaration.constructor.name,
			'TsDeclaration',
			'declaration was not a TsDeclaration instance',
		);
	});
});
it('builds relations', function () {
	errorStub = stub(log, 'error');
	tsSourceFile = stubs.projectFactory.specTsSourceFile();
	assert.doesNotThrow(() => tsSourceFile.buildRelationships());
});
