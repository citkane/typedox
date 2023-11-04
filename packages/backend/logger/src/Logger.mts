import { Console } from 'console';

import {
	colourise,
	filename,
	identifier,
	initLowerCamel,
	inspect,
	toLine,
} from './loggerUtils.mjs';
export enum logLevels {
	debug,
	info,
	warn,
	error,
	silent,
}
export type logLevelKeys = keyof typeof logLevels;

export class Logger extends Console {
	private logLevel: logLevels;
	public isLogLevelSet = false;

	/* istanbul ignore next */
	constructor(logLevel = logLevels.info) {
		super(process.stdout, process.stderr, true);
		this.logLevel = logLevel;
	}

	public getFilename = filename;
	public setLogLevel = (logLevel: logLevels) => {
		this.logLevel = logLevel;
		this.isLogLevelSet = true;
	};

	public inspect = inspect;

	public debug = (...args: any) =>
		this.shouldLog(logLevels.debug) &&
		super.debug(
			colourise('FgGray', '[debug]'),
			colourise('Dim', args.join(' ')),
		);

	public info = (...args: any) =>
		this.shouldLog(logLevels.info) && super.info('[info]', ...args);

	/*
	public infoKind = (kind: ts.SyntaxKind) => this.info(ts.SyntaxKind[kind]);

	public infoFlagSymbol = (flag: ts.SymbolFlags) =>
		this.info(ts.SymbolFlags[flag]);

	public infoFlagType = (flag: ts.TypeFlags) => this.info(ts.TypeFlags[flag]);
*/
	public warn = (...args: any) =>
		this.shouldLog(logLevels.warn) &&
		super.warn(colourise('FgYellow', '[warning]'), ...args);

	public error = (...args: any) =>
		this.shouldLog(logLevels.error) &&
		super.error(colourise('FgRed', '[error]'), ...args);

	public throwError = (...args: any) => {
		const env = process.env.NODE_ENV;
		const shouldMessage = env === 'test' || this.error(...args) === false;
		const message = shouldMessage
			? [colourise('FgRed', '[error]'), ...args].join(' ')
			: undefined;
		throw Error(message);
	};

	public stackTracer = () => {
		let i = 0;
		return Error()
			.stack!.replace('Error', '')
			.replace(/\n.*\n/g, (match) => {
				i++;
				return i === 1 ? '\n' : match;
			})!;
	};

	public identifier = identifier;
	public logLevelKeyStrings = Object.keys(logLevels).filter(
		(v) => !Number(v) && v !== '0',
	);
	public colourise = colourise;
	public initLowerCamel = initLowerCamel;
	public toLine = toLine;

	private shouldLog = (level: logLevels) => level >= this.logLevel;
}
export const log = new Logger();
