import * as fs from 'fs';

import { logger as log, config, DoxConfig } from '../typedox';

export function getDoxConfigFromCommandLine<Args extends config.doxArgs>(
	doxArgs: config.doxGenericArgs<Args>,
) {
	const doxClArgs = config.getDoxClArgs<Args>(doxArgs);
	const doxConfig = getDoxClOptions<Args>(
		doxArgs,
		doxClArgs,
		{} as config.doxGenericOptions<Args>,
	);
	return doxConfig;
}

export function readDoxConfigFromFile(coreArgs: config.appConfApi) {
	type doxOptions = config.doxGenericOptions<config.appConfApi>;
	const optionsFile =
		config.getDoxConfigFilepathFromClArgs(coreArgs) ||
		coreArgs.typedox.defaultValue;

	const validOptions = Object.keys(coreArgs);
	const fileArgs: doxOptions = fs.existsSync(optionsFile)
		? DoxConfig.jsonFileToObject(optionsFile)
		: {};

	Object.keys(fileArgs).forEach((key) => {
		const coreArg = coreArgs[key];
		const fileArg = fileArgs[key];
		const validKeyError = !validOptions.includes(key);
		const isRequiredError = coreArg.required && !fileArg;
		if (!coreArg.required && fileArg === '') return delete fileArgs[key];
		if (validKeyError || isRequiredError) {
			warnAboutInvalidOption(key, coreArgs, optionsFile, validKeyError);
			delete fileArgs[key];
		}
	});

	return { fileArgs, optionsFile };
}

export const configValidators = {
	projectRootDir: (value: any) =>
		validator(value, function (value: any) {
			return !!value && typeof value === 'string';
		}),
	doxOut: (value: any) =>
		validator(value, function (value: any) {
			return !!value && typeof value === 'string';
		}),
	typeDependencies: (value: any) =>
		validator(value, function (value: any) {
			return (
				Array.isArray(value) &&
				!value.find((value) => typeof value !== 'string')
			);
		}),
	logLevel: (value: any) =>
		validator(value, function (value: any) {
			return log.logLevelKeyStrings.includes(value);
		}),
	tsConfigs: (value: any) =>
		validator(value, (value: any) => {
			return !Array.isArray(value)
				? false
				: !value.find((innerValue) => {
						return checkInnerTsconfigValue(innerValue);
				  });
		}),
	npmFileConvention: (value: any) =>
		validator(
			value,
			(value: any) =>
				typeof value === 'string' && value.split('.').length > 1,
		),
	typedox: (value: any) =>
		validator(
			value,
			(value) => typeof value === 'string' && value.split('.').length > 1,
		),
};

export const configSetters = {
	projectRootDir: function (doxOptions: config.coreOpts, value: string) {
		doxOptions.projectRootDir = value;
	},
	doxOut: function (doxOptions: config.coreOpts, value: string) {
		doxOptions.doxOut = value;
	},
	typeDependencies: function (
		doxOptions: config.coreOpts,
		value: string,
	): void {
		!doxOptions.typeDependencies &&
			(doxOptions.typeDependencies =
				config.appConfApi.typeDependencies.defaultValue);

		!doxOptions.typeDependencies.includes(value) &&
			doxOptions.typeDependencies.push(value);
	},
	logLevel: function (doxOptions: config.coreOpts, value: string) {
		doxOptions.logLevel = value as keyof typeof log.logLevels;
	},
	tsConfigs: function (doxOptions: config.coreOpts, value: string) {
		!doxOptions.tsConfigs &&
			(doxOptions.tsConfigs = config.appConfApi.tsConfigs.defaultValue);

		!doxOptions.tsConfigs.includes(value) &&
			doxOptions.tsConfigs.push(value);
	},
	npmFileConvention: function (doxOptions: config.coreOpts, value: string) {
		doxOptions.npmFileConvention = value;
	},
	typedox: function (doxOptions: config.coreOpts, value: string) {
		doxOptions.typedox = value;
	},
};

function validator(value: any, callback: (value: any) => boolean) {
	if (!value) return undefined;
	return callback(value);
}
function checkInnerTsconfigValue(innerValue: any) {
	return typeof innerValue === 'string'
		? false
		: Array.isArray(innerValue)
		? !innerValue.find((innerString) => typeof innerString !== 'string')
		: true;
}

function warnAboutInvalidOption(
	key: string,
	coreArgs: config.appConfApi,
	optionsFile: string,
	isType: boolean = false,
) {
	log.warn(
		log.identifier(__filename),
		`Invalid option ${isType ? 'type ' : ''}found in ${optionsFile}:`,
		`"${key}".`,
		'The value was replaced with the default value.',
	);
	isType && log.log('Allowed Options:', Object.keys(coreArgs));
	return true;
}

function getDoxClOptions<Args extends config.doxArgs>(
	doxArgs: config.doxGenericArgs<Args>,
	doxClArgs: string[],
	doxOptions: config.doxGenericOptions<Args>,
) {
	type thisArgs = config.doxGenericArgs<Args>;
	type argKey = keyof thisArgs;
	type clArgKey = `--${string}`;

	const clKeys = config.convertArgObjectToCommandLineKeys<Args>(doxArgs);

	let clKey: clArgKey;
	doxClArgs.forEach((clArg, index) => {
		clKey = clKeys.includes(clArg) ? (clArg as clArgKey) : clKey;

		const doxArg = config.unHyphenateArg(clKey) as argKey;
		const set = doxArgs[doxArg].set;
		const defaultValue = doxArgs[doxArg].defaultValue;
		const valueIsDoxKey = clKeys.includes(clArg);
		const parent = doxClArgs[index + 1];
		const isOrphan = !parent || parent.startsWith(config.argHyphen);

		valueIsDoxKey && isOrphan
			? adoptOrphan()
			: !valueIsDoxKey && set(doxOptions, clArg);

		function adoptOrphan() {
			typeof defaultValue === 'boolean'
				? set(doxOptions, true)
				: (doxOptions[doxArg] = defaultValue);
		}
	});

	return doxOptions;
}
