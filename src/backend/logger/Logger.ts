import * as ts from 'typescript';
import * as utils from './loggerUtils';
import { Console } from 'node:console';

export class Logger extends Console {
	private logLevel: utils.logLevels;

	constructor(logLevel = utils.logLevels.info) {
		super(process.stdout, process.stderr, true);
		this.logLevel = logLevel;
	}
	public logLevels = utils.logLevels;
	public setLogLevel = (logLevel: utils.logLevels) => {
		this.logLevel = logLevel;
	};

	public inspect = utils.inspect;

	public debug = (...args: any) =>
		this.shouldLog(utils.logLevels.debug) &&
		super.debug(utils.colourise('Bright', '[debug]'), ...args);

	public info = (...args: any) =>
		this.shouldLog(utils.logLevels.info) && super.info('[info]', ...args);
	public infoKind = (kind: ts.SyntaxKind) => this.info(ts.SyntaxKind[kind]);
	public infoFlagSymbol = (flag: ts.SymbolFlags) =>
		this.info(ts.SymbolFlags[flag]);
	public infoFlagType = (flag: ts.TypeFlags) => this.info(ts.TypeFlags[flag]);

	public warn = (...args: any) =>
		this.shouldLog(utils.logLevels.warn) &&
		super.warn(utils.colourise('FgYellow', '[warning]'), ...args);

	public error = (...args: any) =>
		super.error(utils.colourise('FgRed', '[error]'), ...args);

	public throwError = (...args: any) => {
		this.error(...args);
		throw new Error();
	};

	public get stackTracer() {
		let i = 0;
		return Error()
			.stack?.replace('Error', '')
			.replace(/\n.*\n/g, (match) => {
				i++;
				return i === 1 ? '\n' : match;
			})!;
	}

	public identifier = utils.identifier;
	public logLevelKeyStrings = Object.keys(utils.logLevels).filter(
		(v) => !Number(v) && v !== '0',
	);
	public colourise = utils.colourise;
	public initLowerCamel = utils.initLowerCamel;
	public toLine = utils.toLine;

	public isClRequestForHelp = () =>
		utils.isRequestForHelp() ? utils.logApplicationHelp() : false;

	private shouldLog = (level: utils.logLevels) => level >= this.logLevel;
}
