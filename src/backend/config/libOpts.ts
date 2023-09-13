import * as ts from 'typescript';
import { logger as log, config, projectOptions } from '../typedox';

type Args = config.appConfApi;

export function getDoxOptions(customOptions?: projectOptions) {
	const doxArgs = config.appConfApi;
	const options = customOptions || mergeOptions();

	validateDoxOptions(doxArgs, options);
	return options;

	function mergeOptions() {
		const defaultOptions = getDefaultDoxOptions<Args>(doxArgs);
		let { fileArgs } = config.readDoxConfigFromFile(doxArgs);

		const clOptions = config.getDoxConfigFromCommandLine<Args>(doxArgs);

		const options = {
			...defaultOptions,
			...fileArgs,
			...clOptions,
		} as projectOptions;

		return options;
	}
}

export function getTscParsedCommandline() {
	const tscOptions = ts.parseCommandLine(config.getTscClArgs());
	tscOptions.errors.forEach((error) => {
		log.warn(
			log.identifier(__filename),
			log.identifier(ts.parseCommandLine),
			error.messageText,
		);
	});
	return tscOptions;
}

export function getDefaultDoxOptions<Args extends config.doxArgs>(
	doxArgs = config.appConfApi,
) {
	const argTuples = Object.entries(doxArgs).map((tuple) => {
		const [key, item] = tuple;
		return [key, item.defaultValue];
	});
	const optionObject = Object.fromEntries(argTuples);

	return optionObject as config.doxGenericOptions<Args>;
}
function validateDoxOptions(
	coreArgs: config.appConfApi,
	options: config.doxGenericOptions<Args>,
) {
	Object.keys(coreArgs).forEach((key) => {
		const coreArg = coreArgs[key];
		const optionValue = options[key];
		const notFound = !optionValue;
		const validated = coreArg.validate(optionValue);

		if (coreArg.required && (notFound || validated === undefined))
			log.throwError(
				log.identifier(__filename),
				'A required option was not found:',
				key,
			);
		if (!validated)
			log.throwError(
				log.identifier(__filename),
				'An invalid option was found:',
				key,
			);
	});
}
