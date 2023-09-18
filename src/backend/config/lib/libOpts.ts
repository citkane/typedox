import * as ts from 'typescript';
import * as fs from 'fs';
import { logger as log, config, DoxConfig } from '../../typedox';

export function getDoxOptions(doxClArgsAndValues?: string[]): config.doxOptions;
export function getDoxOptions(
	customOptions?: config.doxOptions,
	doxClArgsAndValues?: string[],
): config.doxOptions;
export function getDoxOptions(
	customOrCl?: config.doxOptions | string[],
	doxClArgsAndValues = config.getClArgs().doxClArgs,
): config.doxOptions {
	const doxArgs = config.doxArgs;
	const arg0is =
		customOrCl === undefined
			? undefined
			: Array.isArray(customOrCl)
			? 'cl'
			: 'custom';

	doxClArgsAndValues =
		arg0is === 'cl' ? (customOrCl as string[]) : doxClArgsAndValues;

	const customOptions =
		arg0is === 'custom' ? (customOrCl as config.doxOptions) : undefined;

	const options = customOptions || mergeOptions();

	validateDoxOptions(options, doxArgs);
	return options;

	function mergeOptions() {
		const defaultOptions = getDefaultDoxOptions(doxArgs);
		const fileArgs = config.getFileDoxOptions(doxClArgsAndValues, doxArgs);
		const clOptions = config.parseDoxClArgsToOptions(
			doxClArgsAndValues,
			doxArgs,
		);
		const options = {
			...defaultOptions,
			...fileArgs,
			...clOptions,
		} as config.doxOptions;

		return options;
	}
}
export function getDefaultDoxOptions(doxArgs = config.doxArgs) {
	const argTuples = Object.entries(doxArgs).map((tuple) => {
		const [key, item] = tuple;
		return [key, config.clone(item.defaultValue)];
	});
	const optionObject = Object.fromEntries(argTuples);

	return optionObject as config.doxOptions;
}
export function getFileDoxOptions(
	doxClArgsAndValues = config.getClArgs().doxClArgs,
	doxArgs = config.doxArgs,
) {
	const optionsFile = config.getDoxFilepathFromArgs(
		doxClArgsAndValues,
		doxArgs,
	);

	const fileArgs: config.doxOptions = fs.existsSync(optionsFile)
		? config.jsonFileToObject(optionsFile)
		: {};
	return fileArgs;
}
export function getTscParsedCommandline(
	tscClArgsAndValues = config.getClArgs().tscClArgs,
) {
	const tscOptions = ts.parseCommandLine(tscClArgsAndValues);
	tscOptions.errors.forEach((error) => {
		log.warn(
			log.identifier(__filename),
			log.identifier(ts.parseCommandLine),
			error.messageText,
		);
	});
	return tscOptions;
}
export function validateDoxOptions(
	options: config.doxOptions,
	doxArgs = config.doxArgs,
) {
	Object.keys(doxArgs).forEach((k) => {
		const key = k as keyof config.doxArgs;
		const coreArg = doxArgs[key];
		const optionValue = options[key];
		const validated = coreArg.validate(optionValue as any);

		if (coreArg.required && optionValue === undefined)
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
