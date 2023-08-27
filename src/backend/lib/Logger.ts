export default class Logger {
	protected class: string;
	public logLevel: keyof typeof this.logLevels = 'info';

	private logLevels = {
		debug: 0,
		info: 1,
		warning: 2,
		error: 3,
	};

	constructor() {
		this.class = `[${Logger.initLowerCamel(this.constructor.name)}]`;
	}

	debug = (...args: any) =>
		this.emit('debug')
			? console.error(colorise('Bright', '[debug]'), ...args)
			: null;
	info = (...args: any) =>
		this.emit('info') ? console.info('[info]', ...args) : null;
	warn = (...args: any) =>
		this.emit('warning')
			? console.warn(colorise('FgYellow', '[warning]'), ...args)
			: null;
	error = (...args: any) =>
		this.emit('error')
			? console.error(colorise('FgRed', '[error]'), ...args)
			: null;

	throwError = (...args: any) => {
		this.error(...args);
		throw new Error();
	};
	private emit = (type: keyof typeof this.logLevels) =>
		this.logLevels[type] >= this.logLevels[this.logLevel];

	public static initLowerCamel(word: string) {
		return word[0].toLocaleLowerCase() + word.slice(1);
	}
	public static class() {
		return `[${this.name}]`;
	}

	private static logger = new Logger();
	public static debug = this.logger.debug;
	public static info = this.logger.info;
	public static warn = this.logger.warn;
	public static error = this.logger.error;
	public static throwError = this.logger.throwError;
}
const colorise = (color: keyof typeof c, text: string) =>
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
