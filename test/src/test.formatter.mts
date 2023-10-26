import { loggerUtils } from 'typedox/logger';

const { colourise } = loggerUtils;
const _unitTest = colourise('Bright', 'Unit tests');
const _functionalTest = colourise('Bright', 'Functional tests');
const _endToEndTest = colourise('Bright', 'End to end test');

export function title(text: string) {
	return colourise('Underscore', text.toLocaleUpperCase());
}
export function unitTest(text: string) {
	return `${_unitTest}: ${colourise('FgBlue', text)}`;
}
export function functionalTest(text: string) {
	return `${_functionalTest}: ${colourise('FgBlue', text)}`;
}
export function endToEndTest(text: string) {
	return `${_endToEndTest}: ${colourise('FgBlue', text)}`;
}

/** strips color information from a string */
export function unColour(string: string) {
	return string.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		'',
	);
}
