import * as path from 'path';
import { logger as log, config } from '../typedox';

let _splitArgs: { doxClArgs: string[]; tscClArgs: string[] };
export function getDoxClArgs<Args extends config.doxArgs>(
	doxArgs: config.doxGenericArgs<Args>,
) {
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
export function getDoxConfigFilepathFromClArgs(coreArgs: config.appConfApi) {
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

export const convertArgObjectToCommandLineKeys = <
	argsInterface extends config.doxArgs,
>(
	rawArgDefs: config.doxGenericArgs<argsInterface>,
) => Object.keys(rawArgDefs).map((projectArg) => hyphenateArg(projectArg));

export const argHyphen = '--';
export const hyphenateArg = (arg: string) => `${argHyphen}${arg}`;
export const unHyphenateArg = (arg: `${typeof argHyphen}${string}`) =>
	arg.replace(argHyphen, '');

function _extrudeDoxClArgValues<Args extends config.doxArgs>(
	doxArgs: config.doxGenericArgs<Args>,
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
