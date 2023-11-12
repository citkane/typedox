import * as fs from 'fs';
import { config } from '../../index.mjs';
import { log } from '@typedox/logger';
import { CoreArgsApi } from '../CoreArgsApi.mjs';
import {
	Arg,
	ArgsApi,
	doxArg,
	getClArgs,
	getHyphenatedArgKeys,
} from '../_namespace.mjs';

const __filename = log.getFilename(import.meta.url);
const defaultCoreArgs = new CoreArgsApi() as ArgsApi<CoreArgsApi>;

export type options<api extends ArgsApi<api>> = {
	[K in keyof api]: api[K]['required'] extends true | undefined
		? api[K]['defaultValue']
		: api[K]['defaultValue'] | undefined;
};

export function makeDoxOptions<api extends CoreArgsApi>(
	args = defaultCoreArgs as ArgsApi<api>,
	clArgs = process.argv,
	testDoxOverrides?: options<ArgsApi<any>>,
) {
	const doxClArgV = getClArgs(args, clArgs).doxClArgs;

	const defaultOptions = getDefaultDoxOptions<api>(args);
	const clOptions = getClDoxOptions<api>(doxClArgV, args);
	const fileArgs = getFileDoxOptions<api>(defaultOptions, clOptions, args);

	testDoxOverrides = testDoxOverrides && {
		...defaultOptions,
		...testDoxOverrides,
	};

	const options = testDoxOverrides
		? testDoxOverrides
		: {
				...defaultOptions,
				...fileArgs,
				...clOptions,
		  };

	Object.keys(args).forEach((k) => {
		const key = k as keyof typeof args;
		if (args[key].required && options[key] === undefined)
			log.throwError(
				log.identifier(__filename),
				'A required option was not found:',
				key,
			);

		args[key].set(options, options[key]);
		const validated = args[key].validate(options[key]);

		if (!validated)
			log.throwError(
				log.identifier(__filename),
				`An invalid option value for "${String(key)}" was found:`,
				options[key],
			);
	});

	return options as options<ArgsApi<api>>;
}
export function getDefaultDoxOptions<api extends CoreArgsApi>(
	args = defaultCoreArgs as ArgsApi<api>,
) {
	const argTuples = Object.entries(args).map((tuple) => {
		const [key, item] = tuple;
		return [key, config.clone((item as Arg<any, any>).defaultValue)];
	});
	const optionObject = Object.fromEntries(argTuples);

	return optionObject as options<typeof args>;
}
export function getFileDoxOptions<api extends CoreArgsApi>(
	defaultOptions: options<ArgsApi<api>>,
	clOptions: options<ArgsApi<api>>,
	args = defaultCoreArgs as ArgsApi<api>,
) {
	const file =
		(clOptions as options<CoreArgsApi>).typedox ||
		(defaultOptions as options<CoreArgsApi>).typedox;

	if (!file) return {} as options<ArgsApi<api>>;

	const holder = {} as options<CoreArgsApi>;
	(args as CoreArgsApi).typedox?.set(holder, file);
	const typedox = holder.typedox;

	const fileArgs =
		typedox && fs.existsSync(typedox)
			? config.jsonFileToObject(typedox)
			: {};

	return fileArgs as options<ArgsApi<api>>;
}
export function getClDoxOptions<api>(
	doxClArgsAndValues: string[],
	args = defaultCoreArgs as ArgsApi<api>,
) {
	type argKey = keyof typeof args;
	const doxOptions = {} as options<ArgsApi<api>>;
	if (!doxClArgsAndValues.length) return doxOptions;

	type hyphenatedArgKey = `--${string}`;
	const hyphenatedKeys = getHyphenatedArgKeys(args);
	let currentArg: argKey;
	let argType: doxArg<any>['typeof'];

	doxClArgsAndValues.forEach((currentArgOrValue, index) => {
		const isCurrentlyKey = hyphenatedKeys.includes(currentArgOrValue);
		if (isCurrentlyKey) {
			const isFlag =
				doxClArgsAndValues[index + 1]?.startsWith('-') ||
				!doxClArgsAndValues[index + 1];
			currentArg = config.unHyphenateArg(
				currentArgOrValue as hyphenatedArgKey,
			) as argKey;
			argType = args[currentArg].typeof;
			if (isFlag && argType === 'boolean') doxOptions[currentArg] = true;
			return;
		}
		if (argType === 'array') {
			doxOptions[currentArg] ??= [] as any[];
			(doxOptions[currentArg] as any[]).push(currentArgOrValue);
			return;
		}
		if (argType === 'object') {
			let object: object;
			try {
				object = JSON.parse(currentArgOrValue);
				doxOptions[currentArg] = object;
			} catch (error) {
				doxOptions[currentArg] = 'error';
			}
			return;
		}
		if (argType === 'number') {
			doxOptions[currentArg] = parseInt(currentArgOrValue);
			return;
		}
		doxOptions[currentArg] = currentArgOrValue;
	});

	return doxOptions;
}
