import * as path from 'path';
import util from 'util';
import { logger as log, config } from '../typedox';

export enum logLevels {
	debug = 0,
	info = 1,
	warn = 2,
	error = 3,
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
	Object.keys(config.confApi).map((key) => {
		const helpItem = config.confApi[key];

		log.group(config.argHyphen + log.colourise('Underscore', key));
		log.log(helpItem.description);
		log.log('Default value:', helpItem.defaultValue);
		log.log();
		log.groupEnd();
	});
	return true;
}

export function identifier(subject: any) {
	return typeof subject === 'string'
		? `[${path.basename(subject).split('.')[0]}]`
		: subject.name
		? `[${subject.name}]`
		: subject.constructor && subject.constructor.name
		? `[${initLowerCamel(subject.constructor.name)}]`
		: null;
}

export const isRequestForHelp = () =>
	process.argv.includes(`${config.argHyphen}help`);

export const logLevelKeyStrings = Object.keys(logLevels).filter(
	(v) => !Number(v) && v !== '0',
);

export function inspect(object: object, shrinkObject?: boolean) {
	object = shrinkObject ? shrink(object) : object;
	log.log('[inspect]', util.inspect(object, false, null, true));
}

function shrink(item: any): any {
	const isArray = Array.isArray(item);
	const isObject = typeof item == 'object';
	if (!isArray && !isObject) return item;
	const objectCopy = isArray
		? [...item]
				.filter((i) => !!i)
				.map((i) => (typeof i === 'object' ? shrink(i) : i))
		: (Object.entries({ ...item }).reduce(
				(accumulator, tuple) => {
					if (typeof tuple[1] === 'boolean' || !!tuple[1])
						accumulator[tuple[0]] = shrink(tuple[1]);
					return accumulator;
				},
				{} as Record<string, any>,
		  ) as object);
	return objectCopy;
}
