import { config } from '../../index.mjs';

export function getClArgs(clArgs = process.argv, doxArgs = config.doxArgs) {
	const doxClArgs: string[] = [];
	const tscClArgs: string[] = [];
	const doxClKeys = getHyphenatedArgKeys(doxArgs);
	let isDoxArg = false;

	clArgs.forEach((clArg) => {
		isDoxArg = doxClKeys.includes(clArg)
			? true
			: clArg.startsWith('-')
			? false
			: isDoxArg;

		isDoxArg ? doxClArgs.push(clArg) : tscClArgs.push(clArg);
	});
	const splitArgs = { doxClArgs, tscClArgs };

	return splitArgs;
}
export const getHyphenatedArgKeys = (doxArgs: config.doxArgs) =>
	Object.keys(doxArgs).map((projectArg) => hyphenateArg(projectArg));

export const argHyphen = '--';
export const hyphenateArg = (arg: string) => `${argHyphen}${arg}`;
export const unHyphenateArg = (arg: `${typeof argHyphen}${string}`) =>
	arg.replace(argHyphen, '');
