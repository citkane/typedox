import * as dox from '../typedox';
import * as ts from 'typescript';

export default class Logger {
	public logLevel: keyof typeof this.logLevels = 'info';

	private logLevels = {
		debug: 0,
		info: 1,
		warning: 2,
		error: 3,
	};

	debug = (...args: any) =>
		this.emit('debug')
			? console.error(Logger.colorise('Bright', '[debug]'), ...args)
			: null;
	info = (...args: any) =>
		this.emit('info') ? console.info('[info]', ...args) : null;
	warn = (...args: any) =>
		this.emit('warning')
			? console.warn(Logger.colorise('FgYellow', '[warning]'), ...args)
			: null;
	error = (...args: any) =>
		this.emit('error')
			? console.error(Logger.colorise('FgRed', '[error]'), ...args)
			: null;

	object = (object?: dox.logableObjects) => {
		const objectMessage = object
			? getObjectMessage(object)
			: 'No object found to log.';
		return {
			debug: (message?: string) => this.debug(message, objectMessage),
			info: (message?: string) => this.info(message, objectMessage),
			warn: (message?: string) => this.warn(message, objectMessage),
			error: (message?: string) => this.error(message, objectMessage),
		};
	};
	kind = (object?: ts.Node | ts.Symbol | ts.Type) => {
		const log = this.info;
		if (!object) return log(undefined);
		const objectClass = object.constructor.name;
		const flag = 'kind' in object ? object.kind : object.flags;

		['NodeObject', 'SourceFileObject'].includes(objectClass)
			? log('ts.Node:', ts.SyntaxKind[flag])
			: objectClass === 'TypeObject'
			? log('ts.Type:', ts.TypeFlags[flag])
			: objectClass === 'SymbolObject'
			? log('ts.Symbol:', ts.SymbolFlags[flag])
			: this.warn(
					'Could not find kind of constructor: ',
					object.constructor.name,
			  );
	};

	private emit = (type: keyof typeof this.logLevels) =>
		this.logLevels[type] >= this.logLevels[this.logLevel];

	private static colorise = (color: keyof typeof c, text: string) =>
		c[color] + text + c.Reset;
}

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

function getObjectMessage(object: dox.logableObjects) {
	if (object instanceof dox.Declaration) {
		const {
			aliasName,
			tsKind,
			symbol,
			node,
			type,
			name,
			fileName,
			nameSpace,
		} = object;
		return {
			name,
			aliasName,
			nameSpace,
			tsKind: ts.SyntaxKind[tsKind!],
			symbolFlag: ts.SymbolFlags[symbol.flags],
			typeFlag: ts.TypeFlags[type.flags],
			node: node?.getText(),
			fileName,
		};
	}
}
