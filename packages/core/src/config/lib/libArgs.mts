import { log } from '@typedox/logger';
import { options } from './libOpts.mjs';
import ts from 'typescript';

type typeOf = 'string' | 'number' | 'array' | 'object' | 'boolean';

type set<defaultType, options> = (
	doxOptions: options,
	value: defaultType,
) => void;

type RequiredValue<required, defaultType> = required extends true
	? defaultType
	: defaultType | undefined;

type validate<required, defaultType> = (
	value: RequiredValue<required, defaultType>,
) => boolean;

export type ArgsApi<api> = Record<keyof api, Arg<any, any>>;

export interface doxArg<defaultType, required = false> {
	description: string;
	typeof: typeOf;
	defaultValue: defaultType;
	required?: required;
	set: set<defaultType, options<any>>;
	validate: validate<required, defaultType>;
}

export class Arg<defaultType, required = undefined>
	implements doxArg<defaultType, required>
{
	description: string;
	typeof: typeOf;
	defaultValue: defaultType;
	set: set<defaultType, options<any>>;
	validate: validate<required, defaultType>;
	required?: required;

	constructor(
		description: string,
		typeOf: typeOf,
		defaultValue: defaultType,
		set: set<defaultType, options<any>>,
		validate: validate<required, defaultType>,
		required?: required,
	) {
		this.description = description;
		this.typeof = typeOf;
		this.defaultValue = defaultValue;
		this.set = set;
		this.validate = validate;
		this.required = required;
	}
}

export function getTscParsedCommandline(
	args: ArgsApi<any>,
	clArgs = process.argv,
) {
	const tscClArgsAndValues = getClArgs(args, clArgs).tscClArgs;
	const tscOptions = ts.parseCommandLine(tscClArgsAndValues);
	tscOptions.errors.forEach((error) => {
		const ignore = getHyphenatedArgKeys(args).find((key) => {
			const messageText = String(error.messageText);
			return messageText.includes(key) || messageText.includes('--file');
		});
		if (ignore) return;

		log.warn(
			log.identifier(__filename),
			log.identifier(ts.parseCommandLine),
			error.messageText,
		);
	});
	return tscOptions;
}

export function getClArgs(args: ArgsApi<any>, clArgs = process.argv) {
	const doxClArgs: string[] = [];
	const tscClArgs: string[] = [];
	const doxClKeys = getHyphenatedArgKeys(args);
	let isDoxArg = false;

	clArgs.forEach((clArg) => {
		isDoxArg = doxClKeys.includes(clArg)
			? true
			: clArg.startsWith('-')
			? false
			: isDoxArg;

		isDoxArg ? doxClArgs.push(clArg) : tscClArgs.push(clArg);
	});
	const splitArgs = { doxClArgs, tscClArgs };

	return splitArgs;
}
export const getHyphenatedArgKeys = (doxArgs: ArgsApi<any>) =>
	Object.keys(doxArgs).map((projectArg) => hyphenateArg(projectArg));

export const argHyphen = '--';
export const hyphenateArg = (arg: string) => `${argHyphen}${arg}`;
export const unHyphenateArg = (arg: `${typeof argHyphen}${string}`) =>
	arg.replace(argHyphen, '');
