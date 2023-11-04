import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import { doxFormat } from '@typedox/test';
import wrapper from './_index.mjs';

chai.use(chaiExclude);

export default function wrapperTest() {
	describe(doxFormat.title('Wrapper'), function () {
		describe(doxFormat.functionalTest('Wrapper'), wrapper.functional);
	});
}
