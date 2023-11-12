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
const localFactory = 'categories';

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
		const parsedConfig = compiler().parsedConfig;
		let reference!: DoxReference;
		assert.doesNotThrow(
			() =>
				(reference = new DoxReference(
					doxStub.doxPackage(),
					'test',
					parsedConfig,
					1,
					0,
				)),
		);
		assert.isTrue(Dox.isDoxReference(reference));
	});

	it('gets the root declarations', function () {
		const doxReference = doxPackage().doxReferences[0]; //projectFactory.specReference(factory);
		let roots!: DoxDeclaration[];
		assert.doesNotThrow(
			() => (roots = (doxReference as any).getRootDeclarations()),
		);
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
