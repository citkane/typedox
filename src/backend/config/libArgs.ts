import * as path from 'path';
import * as opts from './libOpts';
import * as api from './projectConfigApi';
import { logger as log, config } from '../typedox';

export type doxArgsType = Record<string, doxArg<any, any, any>>;
export type doxArgs<argsInterface extends doxArgsType> = {
	[K in keyof argsInterface]: doxArg<any, any, argsInterface>;
};
export interface doxArg<
	defaultValue,
	value,
	argsInterface extends doxArgsType,
> {
	description: string;
	defaultValue: defaultValue;
	set: (doxOptions: opts.doxOptions<argsInterface>, value: value) => void;
}

export const argHyphen = '--';

let _splitArgs: { doxClArgs: string[]; tscClArgs: string[] };
export function getDoxClArgs<Args extends doxArgsType>(doxArgs: doxArgs<Args>) {
	return _extrudeDoxClArgValues(doxArgs).doxClArgs;
}
export function getTscClArgs() {
	if (!_splitArgs)
		log.throwError(
			log.identifier(__filename),
			'Cannot call for tsc Commandline args before extracting doxClArgs',
		);
	return _splitArgs.tscClArgs;
}
function _extrudeDoxClArgValues<Args extends doxArgsType>(
	doxArgs: doxArgs<Args>,
) {
	if (_splitArgs) return _splitArgs;
	const doxClArgs: string[] = [];
	const doxClKeys = convertArgObjectToCommandLineKeys<Args>(doxArgs);
	let isDox = false;

	const tscClArgs = process.argv.filter((arg) => {
		isDox = doxClKeys.includes(arg)
			? true
			: arg.startsWith('-')
			? false
			: isDox;

		isDox && doxClArgs.push(arg);
		return !isDox;
	});
	_splitArgs = { doxClArgs, tscClArgs };
	return _splitArgs;
}

export const convertArgObjectToCommandLineKeys = <
	argsInterface extends doxArgsType,
>(
	rawArgDefs: doxArgs<argsInterface>,
) => Object.keys(rawArgDefs).map((projectArg) => hyphenateArg(projectArg));

export const hyphenateArg = (arg: string) => `${argHyphen}${arg}`;
export const unHyphenateArg = (arg: `${typeof argHyphen}${string}`) =>
	arg.replace(argHyphen, '');

export function getDoxConfigFilepathFromClArgs(coreArgs: api.confApi) {
	let typedox = '';
	let rootDir = '';
	process.argv.forEach((value, index) => {
		value === '--typedox' &&
			process.argv[index + 1] &&
			(typedox = process.argv[index + 1]);
		value === '--projectRootDir' &&
			process.argv[index + 1] &&
			(rootDir = process.argv[index + 1]);
	});

	typedox.startsWith(argHyphen) && (typedox = '');
	rootDir.startsWith(argHyphen) && (rootDir = '');
	if (!typedox && !rootDir)
		return path.join(
			coreArgs.projectRootDir.defaultValue,
			coreArgs.typedox.defaultValue,
		);

	const absRoot = rootDir && path.isAbsolute(rootDir);
	const absDox = typedox && path.isAbsolute(typedox);
	if (absRoot && absDox && !typedox.startsWith(rootDir))
		log.throwError(
			log.identifier(__filename),
			'typedox.json must exist under the project root directory',
		);
	if (absDox) return path.resolve(typedox);
	!rootDir && (rootDir = coreArgs.projectRootDir.defaultValue);
	typedox = path.join(rootDir, typedox);
	return path.isAbsolute(typedox)
		? typedox
		: path.join(coreArgs.projectRootDir.defaultValue, typedox);
}
