import * as ts from 'typescript';
import * as dox from '../typedox';
export enum logLevels {
	debug = 0,
	info = 1,
	warn = 2,
	error = 3,
}

export class Logger {
	public get classIdentifier() {
		return `[${Logger.initLowerCamel(this.constructor.name)}]`;
	}
	protected logLevel = logLevels.debug;

	protected debug = (...args: any) =>
		this.shouldEmit(logLevels.debug)
			? console.error(colorise('Bright', '[debug]'), ...args)
			: null;

	protected info = (...args: any) =>
		this.shouldEmit(logLevels.info)
			? console.info('[info]', ...args)
			: null;
	protected infoKind = (kind: ts.SyntaxKind) =>
		this.info(ts.SyntaxKind[kind]);
	protected infoFlagSymbol = (flag: ts.SymbolFlags) =>
		this.info(ts.SymbolFlags[flag]);
	protected infoFlagType = (flag: ts.TypeFlags) =>
		this.info(ts.TypeFlags[flag]);

	protected warn = (...args: any) =>
		this.shouldEmit(logLevels.warn)
			? console.warn(colorise('FgYellow', '[warning]'), ...args)
			: null;

	protected error = (...args: any) =>
		this.shouldEmit(logLevels.error)
			? console.error(colorise('FgRed', '[error]'), ...args)
			: null;

	protected throwError = (...args: any) => {
		this.error(...args);
		throw new Error();
	};

	private shouldEmit = (logLevel: logLevels) => logLevel >= this.logLevel;

	private static initLowerCamel(word: string) {
		return word[0].toLocaleLowerCase() + word.slice(1);
	}
	protected static classString() {
		return `[${this.name}]`;
	}
	public static deepReport(
		this: dox.TsDeclaration | dox.lib.Relation,
		logLevel: keyof typeof logLevels,
		message: string,
		get: dox.TscWrapper,
		isLocalTarget: boolean,
	) {
		this[logLevel](this.classIdentifier, message, {
			filename: this.get.fileName,
			sourceReport: this.get.report,
			sourceDeclaration: this.get.nodeDeclarationText,
			targetReport: isLocalTarget ? get.report : undefined,
			targetDeclaration: isLocalTarget
				? get.nodeDeclarationText
				: undefined,
		});
	}
	private static logger = new Logger();
	public static debug = this.logger.debug;
	public static info = this.logger.info;
	public static infoKind = this.logger.infoKind;
	public static infoFlagSymbol = this.logger.infoFlagSymbol;
	public static infoFlagType = this.logger.infoFlagType;
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
