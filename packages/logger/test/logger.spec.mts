import unit from './src/unit.logger.spec.mjs';
import functional from './src/functional.logger.spec.mjs';
import { doxFormat } from 'typedox-test';

export default function () {
	describe(doxFormat.title('Logger'), function () {
		describe(doxFormat.unitTest('Logger'), unit);
		describe(doxFormat.functionalTest('Logger'), functional);
	});
}
