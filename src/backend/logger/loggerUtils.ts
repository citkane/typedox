import * as path from 'path';
import util from 'util';
import { config, logger as log } from '../typedox';

export enum logLevels {
	debug,
	info,
	warn,
	error,
}

export function initLowerCamel(word: string) {
	return word[0].toLocaleLowerCase() + word.slice(1);
}

export const colourise = (color: keyof typeof c, text: string) =>
	c[color] + text + c.Reset;
const c = {
	Reset: '\x1b[0m',
	Bright: '\x1b[1m',
	Dim: '\x1b[2m',
	Underscore: '\x1b[4m',
	Blink: '\x1b[5m',
	Reverse: '\x1b[7m',
	Hidden: '\x1b[8m',

	FgBlack: '\x1b[30m',
	FgRed: '\x1b[31m',
	FgGreen: '\x1b[32m',
	FgYellow: '\x1b[33m',
	FgBlue: '\x1b[34m',
	FgMagenta: '\x1b[35m',
	FgCyan: '\x1b[36m',
	FgWhite: '\x1b[37m',
	FgGray: '\x1b[90m',

	BgBlack: '\x1b[40m',
	BgRed: '\x1b[41m',
	BgGreen: '\x1b[42m',
	BgYellow: '\x1b[43m',
	BgBlue: '\x1b[44m',
	BgMagenta: '\x1b[45m',
	BgCyan: '\x1b[46m',
	BgWhite: '\x1b[47m',
	BgGray: '\x1b[100m',
};

export function logApplicationHelp() {
	Object.keys(config.doxArgs).map((k) => {
		const key = k as keyof config.doxArgs;
		const helpItem = config.doxArgs[key];

		log.group(config.argHyphen + log.colourise('Underscore', key));
		log.log(helpItem.description);
		log.log('Default value:', helpItem.defaultValue);
		log.log();
		log.groupEnd();
	});
	return true;
}

export function identifier(subject: string | object) {
	const value =
		typeof subject === 'string'
			? `${path.basename(subject).split('.')[0]}`
			: subject.constructor && subject.constructor.name
			? `${initLowerCamel(subject.constructor.name)}`
			: getName(subject);

	return `[${value}]`;

	function getName(subject: any) {
		try {
			return subject.name;
		} catch (error) {
			return 'unknown';
		}
	}
}

export const isRequestForHelp = () =>
	process.argv.includes(`${config.argHyphen}help`);

export const logLevelKeyStrings = Object.keys(logLevels).filter(
	(v) => !Number(v) && v !== '0',
);

export function toLine(string: string) {
	return string.replace(/\s+/g, ' ');
}

export function inspect(object: any, ignoreKeys?: string[]): void;
export function inspect(object: any, shrink?: boolean): void;
export function inspect(
	object: any,
	shrink?: boolean,
	ignoreKeys?: string[],
): void;
export function inspect(
	object: any,
	ignoreOrShrink?: boolean | string[],
	ignore?: string[],
) {
	if (typeof object !== 'object') return log.log(...getArgs(object));

	const [hide, ignoreKeys] = resolveOverload(ignoreOrShrink, ignore);
	if (hide || ignoreKeys) object = shrink(object, hide, ignoreKeys);

	log.log(...getArgs(object));

	function getArgs(obj = object) {
		return ['[inspect]', util.inspect(obj, false, null, true)];
	}
	function resolveOverload(
		ignoreOrShrink: boolean | string[] | undefined,
		ignore: string[] | undefined,
	): [boolean | undefined, string[] | undefined] {
		return typeof ignoreOrShrink === 'boolean'
			? [ignoreOrShrink as boolean, ignore]
			: !!ignoreOrShrink
			? [undefined, ignoreOrShrink as string[]]
			: [undefined, undefined];
	}
}

function shrink(
	item: any,
	hide = false,
	unwantedKeys: string[] = [],
	seen: Map<object, true> = new Map(),
): any {
	const isArray = Array.isArray(item);
	const isObject = typeof item == 'object';
	if (!isArray && !isObject) return item;

	const objectCopy = isArray
		? [...item]
				.filter(
					(value) =>
						(!!value || !hide) && !unwantedKeys.includes(value),
				)
				.map((value) =>
					typeof value === 'object'
						? (unwantedKeys.includes(value) && `[hidden]`) ||
						  shrink(value, hide, unwantedKeys, seen)
						: value,
				)
		: (Object.entries({ ...item }).reduce(
				(accumulator, tuple) => {
					const [key, value] = tuple;
					const hasValue = typeof value === 'boolean' || !!value;
					if (
						(hide && !hasValue) ||
						(hide && unwantedKeys.includes(key)) ||
						seen.has(value as object)
					) {
						return accumulator;
					}
					seen.set(value as object, true);

					const len = Array.isArray(value)
						? `(${value.length}): Array`
						: typeof value === 'object' &&
						  `(${Object.keys(value as object).length}): Object`;

					accumulator[key] = unwantedKeys.includes(key)
						? `[hidden ${len || typeof value}]`
						: shrink(value, hide, unwantedKeys, seen);

					return accumulator;
				},
				{} as Record<string, any>,
		  ) as object);
	return objectCopy;
}
