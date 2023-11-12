import { assert } from 'chai';
import { DoxSourceFile } from '@typedox/core';
import { stub } from 'sinon';
import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub, projectFactory } from '@typedox/test';

const localLogLevel = logLevels.silent;
const localFactory = 'categories';

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
		const { getFile, checker, parsedConfig } = compiler();
		const sourceFile = getFile().sourceFile;
		const fileSymbol = getFile().sourceSymbol;
		const reference = doxStub.doxReference(
			localFactory,
			checker,
			parsedConfig,
		);

		assert.exists(sourceFile, 'sourceFile');
		assert.exists(fileSymbol, 'fileSymbol');
		assert.exists(reference, 'reference');

		assert.doesNotThrow(() => new DoxSourceFile(reference, sourceFile!));
	});

	it('discovers declarations in the file', function () {
		const {
			doxReference,
			sourceFile: source,
			fileSymbol,
		} = doxSourceFile();
		const freshSource = new DoxSourceFile(doxReference, source);
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
