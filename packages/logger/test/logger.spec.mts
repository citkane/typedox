import functional from './functional.logger.spec.mjs';
import unit from './unit.logger.spec.mjs';
import { doxFormat } from '@typedox/test';

export default function loggerTest() {
	describe(doxFormat.title('Logger'), function () {
		describe(doxFormat.unitTest('Logger'), unit);
		describe(doxFormat.functionalTest('Logger'), functional);
	});
}
