import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import {
	DoxSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';
import { globalLogLevel } from '../../tests.backend.spec';
import { compilerFactory } from '../../compilerFactory';
import { projectFactory } from '../../projectFactory';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

const { compiler } = compilerFactory(localFactory);

let _doxSourceFile: DoxSourceFile;
const doxSourceFile = () =>
	(_doxSourceFile ??= projectFactory.specDoxSourceFile(localFactory));

before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);
});
afterEach(function () {
	if (this.errorStub) this.errorStub.restore();
});
after(function () {
	projectFactory.flushCache();
});
it('creates a class instance', function () {
	const { getFile, checker } = compiler();
	const sourceFile = getFile().sourceFile;
	const fileSymbol = getFile().sourceSymbol;
	const reference = stubs.doxReference(localFactory, checker);

	assert.exists(sourceFile, 'sourceFile');
	assert.exists(fileSymbol, 'fileSymbol');
	assert.exists(reference, 'reference');

	assert.doesNotThrow(
		() => new DoxSourceFile(reference, sourceFile!, fileSymbol),
	);
});
it('discovers files referenced within the file', function () {
	const sourceFile = doxSourceFile();
	const { discoverChildFiles } = sourceFile as any;

	const exports = sourceFile.fileSymbol.exports?.values();
	const symbols = Array.from(exports || []);
	assert.isTrue(!!symbols && !!symbols.length, 'did not get export symbols');
	let discoveredFiles!: string[];

	assert.doesNotThrow(() => (discoveredFiles = discoverChildFiles(symbols)));
	log.info(discoveredFiles);
	assert.lengthOf(discoveredFiles, 3);
});
it('discovers declarations in the file', function () {
	const { parent, sourceFile: source, fileSymbol } = doxSourceFile();
	const freshSource = new DoxSourceFile(parent, source, fileSymbol);
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
			'DoxDeclaration',
			'declaration was not a DoxDeclaration instance',
		);
	});
});
it('builds relations', function () {
	this.errorStub = stub(log, 'error');
	assert.doesNotThrow(() => doxSourceFile().buildRelationships());
});
