import { assert } from 'chai';
import * as path from 'path';
import { DoxPackage, DoxReference, Dox } from '@typedox/core';
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
}
