import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
chai.use(chaiExclude);

import { doxFormat } from '@typedox/test';
import serialiser from './_index.mjs';

export default function serialiserTest() {
	describe(doxFormat.title('serialiser'), function () {
		describe(
			doxFormat.functionalTest('serialiser'),
			serialiser.functional.func,
		);
		describe(
			doxFormat.functionalTest('serialiser variables'),
			serialiser.functional.variables,
		);
		describe(
			doxFormat.functionalTest('serialiser project structure'),
			serialiser.functional.projectStructure,
		);
	});
}
