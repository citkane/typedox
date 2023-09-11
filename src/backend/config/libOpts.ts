import * as ts from 'typescript';
import { logger as log, config } from '../typedox';

type Args = config.appConfApi;

export function getDoxOptions(coreArgs: config.appConfApi) {
	/**
	 * @todo
	 * inject modules here
	 */

	const doxArgs = coreArgs;
	/** */

	const defaultOptions = getDefaultDoxOptions<Args>(doxArgs);
	let { fileArgs } = config.readDoxConfigFromFile(coreArgs);

	const clOptions = config.getDoxConfigFromCommandLine<Args>(doxArgs);

	const options = {
		...defaultOptions,
		...fileArgs,
		...clOptions,
	} as config.doxGenericOptions<Args>;

	validateDoxOptions(coreArgs, options);

	return options;
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

function getDefaultDoxOptions<Args extends config.doxArgs>(
	doxArgs: config.doxGenericArgs<Args>,
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
