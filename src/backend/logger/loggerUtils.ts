import * as path from 'path';
import util from 'util';
import { config, logger as log } from '../typedox';

export enum logLevels {
	debug,
	info,
	warn,
	error,
	silent,
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
export function logSpecifierHelp() {
	const rep = 80;
	log.info(
		'\n\n',
		'-'.repeat(rep),
		'\n',
		colourise('Bright', 'Examples of the import / export specifier kinds:'),
		'\n',
		'-'.repeat(rep),
		'\n',
		{
			ExportAssignment: [
				'export default clause;',
				'export = nameSpace;',
				'export = nameSpace.clause;',
				"export = {foo:'foo, bar:'bar'}",
			],
			ExportDeclaration: ["export * from './child/child';"],
			ExportSpecifier: [
				"export { child } from './child/child';",
				'export { localVar, grandchild, grandchildSpace };',
			],
			ImportClause: [
				"import TypeScript from 'typescript';",
				"import clause from './child/child';",
			],
			ImportEqualsDeclaration: [
				'export import childSpace = childSpace;',
				'export import bar = local.bar;',
				'export import bar = local.bar;',
			],
			ImportSpecifier: [
				"import { grandchild, childSpace } from './grandchild/grandchild'",
			],
			ModuleDeclaration: [
				'export namespace moduleDeclaration { local; childSpace; }',
				"declare namespace local {foo = 'foo'}",
			],
			NamespaceExport: ["export * as childSpace from './child/child';"],
			NamespaceImport: ["import * as childSpace from '../child/child';"],
		},
		'\n',
		'-'.repeat(rep),
		'\n\n',
	);
}

export function identifier(subject: string | object | number) {
	const value =
		typeof subject === 'string'
			? parseFilename(subject)
			: typeof subject === 'number'
			? String(subject)
			: getConstructorName(subject)
			? `${initLowerCamel(subject.constructor.name)}`
			: getName(subject);

	return `[${value}]`;
	function parseFilename(subject: string) {
		return `${path
			.basename(subject)
			.split('.')
			.filter((part) => part !== path.extname(subject).replace('.', ''))
			.join('.')}`;
	}
	function getConstructorName(subject: any) {
		const sysNames = ['Function', 'Object'];
		const construct = subject.constructor;
		return construct && !sysNames.includes(construct.name)
			? construct.name
			: undefined;
	}
	function getName(subject: any) {
		return 'name' in subject ? subject.name : `${subject}`;
	}
}

export const isRequestForHelp = (argv = process.argv) =>
	argv.includes(`${config.argHyphen}help`);

export const logLevelKeyStrings = Object.keys(logLevels).filter(
	(v) => !Number(v) && v !== '0',
);

export function stripComments(string: string) {
	return string.replace(
		/((?:(?:^\h*)?(?:\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\/(?:\h*\n(?=\h*(?:\n|\/\*|\/\/)))?|\/\/(?:[^\\]|\\\n?)*?(?:\n(?=\h*(?:\n|\/\*|\/\/))|(?=\n))))+)|("(?:\\[\S\s]|[^"\\])*"|'(?:\\[\S\s]|[^'\\])*'|[\S\s][^\/"'\\\s]*)/gm,
		'$2',
	);
}
export function shortenString(string: string, maxLength?: number) {
	if (!maxLength) return string;
	const len = string.length;
	const holder = Math.abs(maxLength / 2);
	return string.length <= maxLength
		? string
		: `${string.slice(0, holder)} ... ${string.slice(holder * -1)}`;
}
export function toLine(string: string, maxLength?: number) {
	return shortenString(
		stripComments(string).replace(/\s+/g, ' ').trim(),
		maxLength,
	);
}

export function inspect(object: any, ignoreKeys?: string[]): void;
export function inspect(object: any, shrink?: boolean): void;
export function inspect(
	object: any,
	shrink?: boolean,
	ignoreKeys?: string[],
): void;
export function inspect(
	subject: any,
	ignoreOrShrink?: boolean | string[],
	ignore?: string[],
) {
	if (typeof subject !== 'object') return log.log(...getArgs(subject));

	const [hide, ignoreKeys] = resolveOverload(ignoreOrShrink, ignore);
	if (hide || ignoreKeys) subject = shrink(subject, hide, ignoreKeys);

	return log.log(...getArgs(subject));

	function getArgs(subject: any) {
		return ['[inspect]', util.inspect(subject, false, null, true)];
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
	function shrink(
		item: any,
		hide = false,
		unwantedKeys: string[] = [],
		seen: Map<object, true> = new Map(),
	): any {
		const isArray = Array.isArray(item);
		const isObject = typeof item == 'object';
		if (!isArray && !isObject) return item;

		const circularString = '[circular]';

		const objectCopy = isArray
			? [...item]
					.filter(
						(value) =>
							(!!value || !hide) && !unwantedKeys.includes(value),
					)
					.map((value) => {
						if (seen.has(value as object)) return circularString;
						seen.set(value, true);

						return typeof value === 'object'
							? shrink(value, hide, unwantedKeys, seen)
							: value;
					})
			: (Object.entries({ ...item }).reduce(
					(accumulator, tuple) => {
						const [key, value] = tuple;
						if (seen.has(value as object)) {
							accumulator[key] = circularString;
							return accumulator;
						}
						seen.set(value as object, true);

						const hasValue = typeof value === 'boolean' || !!value;
						if (
							(hide && !hasValue) ||
							(hide && unwantedKeys.includes(key))
						) {
							return accumulator;
						}

						const len = Array.isArray(value)
							? `(${value.length}): Array`
							: typeof value === 'object' &&
							  `(${
									Object.keys(value as object).length
							  }): Object`;

						accumulator[key] = unwantedKeys.includes(key)
							? `[hidden ${len || typeof value}]`
							: shrink(value, hide, unwantedKeys, seen);

						return accumulator;
					},
					{} as Record<string, any>,
			  ) as object);
		return objectCopy;
	}
}

export function formatBytes(bytes: number, decimals = 2) {
	if (!+bytes) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = [
		'Bytes',
		'KiB',
		'MiB',
		'GiB',
		'TiB',
		'PiB',
		'EiB',
		'ZiB',
		'YiB',
	];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
