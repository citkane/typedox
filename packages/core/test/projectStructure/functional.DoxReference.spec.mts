import { assert } from 'chai';
import * as path from 'path';
import {
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
	Dox,
} from '@typedox/core';
import { stub } from 'sinon';

import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub, projectFactory } from '@typedox/test';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

const { projectDir, compiler } = compilerFactory(localFactory);

let errorStub: ReturnType<typeof stub>;
let warnStub: ReturnType<typeof stub>;

let _doxPackage: DoxPackage;
const doxPackage = () =>
	(_doxPackage ??= projectFactory.specDoxPackage(localFactory));

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	afterEach(function () {
		if (errorStub) errorStub.restore();
		if (warnStub) warnStub.restore();
	});

	it('creates a class instance', function () {
		const program = compiler().program;
		let reference!: DoxReference;
		assert.doesNotThrow(
			() =>
				(reference = new DoxReference(
					doxStub.doxPackage(),
					'test',
					program,
					[],
				)),
		);
		assert.isTrue(Dox.isDoxReference(reference));
	});
	it('dedupes and maps a file to the register', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);
		const size = doxReference.filesMap.size;
		const file = path.join(
			projectDir,
			'greatGrandchild/greatGrandchild.ts',
		);
		doxReference.filesMap.delete(file);
		assert.doesNotThrow(() => doxReference.discoverFiles([file, file]));
		assert.isTrue(
			doxReference.filesMap.size === size,
			`${size} : ${doxReference.filesMap.size}`,
		);
	});
	it('parses files recursively', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);

		doxReference.filesMap = new Map<string, DoxSourceFile>();
		assert.isTrue(doxReference.filesMap.size === 0);
		doxReference.discoverFiles();
		assert.isTrue(doxReference.filesMap.size > 2);
	});
	it('reports error if file not found', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);
		let error!: string;
		errorStub = stub(log, 'error').callsFake((...args) => {
			error = args[1];
			return false;
		});
		doxReference.discoverFiles(['foo']);
		assert.include(error, 'No source file was found');
	});
	it('does not throw on declaration discovery', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);
		assert.doesNotThrow(() => doxReference.discoverDeclarations());
	});
	it('does not throw on relationship building', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);
		doxReference.buildRelationships();
		errorStub = stub(log, 'error');
		assert.doesNotThrow(() => doxReference.buildRelationships());
	});
	it('gets the root declarations', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);
		let roots!: DoxDeclaration[];
		assert.doesNotThrow(() => (roots = doxReference.getRootDeclarations()));
		assert.isTrue(roots.length > 8, 'did not get root declarations');
		roots.forEach((declaration) => {
			assert.equal(
				declaration.constructor.name,
				'DoxDeclaration',
				'was not a declaration',
			);
		});
	});
}
