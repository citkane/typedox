import { assert } from 'chai';
import { DoxSourceFile } from 'typedox';
import { stub } from 'sinon';
import { log, logLevels } from 'typedox/logger';
import { compilerFactory, doxStub, projectFactory } from 'typedox-test';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

const { compiler } = compilerFactory(localFactory);

let _doxSourceFile: DoxSourceFile;
const doxSourceFile = () =>
	(_doxSourceFile ??= projectFactory.specDoxSourceFile(localFactory));

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	afterEach(function () {
		if (this.errorStub) this.errorStub.restore();
	});

	it('creates a class instance', function () {
		const { getFile, checker, program } = compiler();
		const sourceFile = getFile().sourceFile;
		const fileSymbol = getFile().sourceSymbol;
		const reference = doxStub.doxReference(localFactory, checker, program);

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
		assert.isTrue(
			!!symbols && !!symbols.length,
			'did not get export symbols',
		);
		let discoveredFiles!: string[];

		assert.doesNotThrow(
			() => (discoveredFiles = discoverChildFiles(symbols)),
		);
		assert.lengthOf(discoveredFiles, 3);
	});
	it('discovers declarations in the file', function () {
		const {
			doxReference,
			sourceFile: source,
			fileSymbol,
		} = doxSourceFile();
		const freshSource = new DoxSourceFile(doxReference, source, fileSymbol);
		const size = freshSource.fileSymbol.exports?.size || 0;
		assert.isTrue(
			size > 10,
			'spec project should have more than 8 declarations',
		);
		const { declarationsMap } = freshSource;
		assert.equal(declarationsMap.size, 0, 'declarations were not empty');
		assert.doesNotThrow(() => freshSource.discoverDeclarations());
		assert.isTrue(
			declarationsMap.size >= size,
			'did not find declarations',
		);
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
}
