import * as ts from 'typescript';
import * as args from './libArgs';
import * as api from './projectConfigApi';
import { logger as log, config } from '../typedox';

export type coreOpts = doxOptions<api.confApi>;
export type doxOptions<Args extends args.doxArgsType> = {
	[K in keyof Args]: Args[K]['defaultValue'];
};

export function getOptionsFromDefaultArgs<Args extends args.doxArgsType>(
	doxArgs: args.doxArgs<Args>,
) {
	const argTuples = Object.entries(doxArgs).map((tuple) => [
		tuple[0],
		tuple[1].defaultValue,
	]);
	const optionObject = Object.fromEntries(argTuples);

	return optionObject as doxOptions<Args>;
}

export function getDoxClOptions<Args extends args.doxArgsType>(
	doxArgs: args.doxArgs<Args>,
	doxClArgs: string[],
	doxOptions: doxOptions<Args>,
) {
	type thisArgs = args.doxArgs<Args>;
	type argKey = keyof thisArgs;
	type clArgKey = `--${string}`;

	const clKeys = args.convertArgObjectToCommandLineKeys<Args>(doxArgs);

	let clKey: clArgKey;
	doxClArgs.forEach((clArg, index) => {
		clKey = clKeys.includes(clArg) ? (clArg as clArgKey) : clKey;

		const doxArg = args.unHyphenateArg(clKey) as argKey;
		const set = doxArgs[doxArg].set;
		const defaultValue = doxArgs[doxArg].defaultValue;
		const valueIsDoxKey = clKeys.includes(clArg);
		const parent = doxClArgs[index + 1];
		const isOrphan = !parent || parent.startsWith(args.argHyphen);

		valueIsDoxKey && isOrphan ? adoptOrphan() : set(doxOptions, clArg);

		function adoptOrphan() {
			typeof defaultValue === 'boolean'
				? set(doxOptions, true)
				: (doxOptions[doxArg] = defaultValue);
		}
	});

	return doxOptions;
}

export function getDoxOptions(coreArgs: api.confApi) {
	/**
	 * @todo
	 * inject modules here
	 */
	type Args = api.confApi;
	const doxArgs = coreArgs;
	/** */

	const defaultOptions = getOptionsFromDefaultArgs<Args>(doxArgs);
	let { fileOptions, optionsFile } = config.getDoxConfigFromFile(coreArgs);
	fileOptions = config.auditConfigFileOptions(
		fileOptions,
		optionsFile,
		coreArgs,
	);
	const clOptions = config.getDoxConfigFromCommandLine<Args>(doxArgs);

	return {
		...defaultOptions,
		...fileOptions,
		...clOptions,
	} as doxOptions<Args>;
}

export function getTscClOptions(doxOptions: doxOptions<api.confApi>) {
	const tscOptions = ts.parseCommandLine(args.getTscClArgs());
	tscOptions.options.types = doxOptions.typeDependencies;
	tscOptions.errors.forEach((error) => {
		log.warn(
			log.identifier(__filename),
			log.identifier(ts.parseCommandLine),
			error.messageText,
		);
	});
	return tscOptions;
}
