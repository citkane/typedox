import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import {
	TsReference,
	TsSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';

let reference: TsReference;
let program: ts.Program;
let checker: ts.TypeChecker;
let source: ts.SourceFile;
let tsSourceFile!: TsSourceFile;
let fileSymbol!: ts.Symbol;

let errorStub: any;

const { projectDir } = stubs.compilerFactory('groups');

before(function () {
	log.setLogLevel(logLevels.info);

	reference = stubs.projectFactory.specReference();
	tsSourceFile = stubs.projectFactory.specTsSourceFile(undefined, reference);

	program = (reference as any).program;
	checker = program.getTypeChecker();
	source = program.getSourceFile(path.join(projectDir, 'index.ts'))!;
	fileSymbol = checker.getSymbolAtLocation(source!)!;

	assert.exists(source);
	assert.exists(fileSymbol);
});
afterEach(function () {
	if (errorStub) errorStub.restore();
});

it('creates a class instance', function () {
	assert.exists(reference, 'no reference');
	assert.exists(program, 'no program');
	assert.exists(checker, 'no checker');
	assert.exists(source, 'no source');
	assert.exists(fileSymbol, 'no symbol');

	assert.doesNotThrow(
		() => new TsSourceFile(reference, source!, fileSymbol!),
	);
});
it.only('discovers files referenced within the file', function () {
	const { discoverChildFiles } = tsSourceFile as any;

	const exports = fileSymbol.exports?.values();
	const symbols = Array.from(exports || []);
	const expectedFiles = ['child.ts', 'grandchild.ts', 'greatGrandchild.ts'];
	assert.isTrue(!!symbols && !!symbols.length, 'did not get export symbols');
	let discoveredFiles!: string[];

	assert.doesNotThrow(() => (discoveredFiles = discoverChildFiles(symbols)));
	assert.lengthOf(discoveredFiles, 3);
	discoveredFiles.forEach((file) => {
		assert.isTrue(expectedFiles.includes(path.basename(file)));
	});
});
it('discovers declarations in the file', function () {
	const freshSource = new TsSourceFile(reference, source!, fileSymbol!);
	const size = freshSource.fileSymbol.exports?.size || 0;
	assert.isTrue(
		size > 10,
		'spec project should have more than 8 declarations',
	);
	const { declarationsMap } = freshSource;
	assert.equal(declarationsMap.size, 0, 'declarations were not empty');
	assert.doesNotThrow(() => freshSource.discoverDeclarations());
	assert.isTrue(declarationsMap.size >= size, 'did not find declarations');
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

	assert.doesNotThrow(() => tsSourceFile.buildRelationships());
});
