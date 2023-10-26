import { log, logLevelKeys } from 'typedox/logger';
import { config } from '../typedox.mjs';
import { deepFreeze } from './lib/libConfig.mjs';

export interface doxArg<defaultValue, required = false> {
	description: string;
	defaultValue: defaultValue;
	required?: required;
	set: (
		doxOptions: doxOptions,
		value: RequiredValue<required, Flatten<defaultValue>>,
	) => void;
	validate: (value: RequiredValue<required, defaultValue>) => boolean;
}
export interface doxArgs {
	projectRootDir: doxArg<string, true>;
	doxOut: doxArg<string, true>;
	typeDependencies: doxArg<string[], true>;
	logLevel: doxArg<logLevelKeys, true>;
	tsConfigs: doxArg<string[] | undefined>;
	npmFileConvention: doxArg<string, true>;
	typedox: doxArg<string>;
}

export type doxOptions = {
	[K in keyof doxArgs]: doxArgs[K]['required'] extends true | undefined
		? doxArgs[K]['defaultValue']
		: doxArgs[K]['defaultValue'] | undefined;
};
type Flatten<T> = T extends any[] ? T[number] : T;
type RequiredValue<R, V> = R extends true | undefined ? V : V | undefined;

export const doxArgs: doxArgs = {
	projectRootDir: {
		description: 'The absolute path location of the project root',
		defaultValue: process.cwd(),
		required: true,
		set: setAndValidate().projectRootDir.set,
		validate: setAndValidate().projectRootDir.validate,
	},
	doxOut: {
		description: 'The out directory for document build files',
		defaultValue: 'docs',
		required: true,
		set: setAndValidate().doxOut.set,
		validate: setAndValidate().doxOut.validate,
	},
	typeDependencies: {
		description:
			'The @types dependencies in `node_modules` to be included for documentation, if any.',
		defaultValue: [] as string[],
		required: true,
		set: setAndValidate().typeDependencies.set,
		validate: setAndValidate().typeDependencies.validate,
	},
	logLevel: {
		description: `One of [${log.logLevelKeyStrings}]`,
		defaultValue: 'info' as logLevelKeys,
		required: true,
		set: setAndValidate().logLevel.set,
		validate: setAndValidate().logLevel.validate,
	},
	tsConfigs: {
		description: `Specific tsconfig files to used as documentation entry points.`,
		defaultValue: undefined as undefined | string[],
		set: setAndValidate().tsConfigs.set,
		validate: setAndValidate().tsConfigs.validate,
	},
	npmFileConvention: {
		description: 'The name convention of the json files used to set up npm',
		defaultValue: 'package.json',
		required: true,
		set: setAndValidate().npmFileConvention.set,
		validate: setAndValidate().npmFileConvention.validate,
	},
	typedox: {
		description: 'File location of typedox.json config file',
		defaultValue: 'typedox.json',
		set: setAndValidate().typedox.set,
		validate: setAndValidate().typedox.validate,
	},
};

deepFreeze(doxArgs);

function setAndValidate() {
	return {
		projectRootDir: {
			validate: (value: string) => {
				return !!value && typeof value === 'string';
			},
			set: (doxOptions: config.doxOptions, value: string) => {
				doxOptions.projectRootDir = value;
			},
		},
		doxOut: {
			validate: (value: string) => {
				return !!value && typeof value === 'string';
			},
			set: (doxOptions: config.doxOptions, value: string) => {
				doxOptions.doxOut = value;
			},
		},
		typeDependencies: {
			validate: (value: string[]) => {
				return (
					Array.isArray(value) &&
					!value.find((value) => typeof value !== 'string')
				);
			},
			set: (doxOptions: config.doxOptions, value: string) => {
				doxOptions.typeDependencies ??= config.clone(
					config.doxArgs.typeDependencies.defaultValue,
				);
				!doxOptions.typeDependencies.includes(value) &&
					doxOptions.typeDependencies.push(value);
			},
		},
		logLevel: {
			validate: (value: logLevelKeys) => {
				return log.logLevelKeyStrings.includes(value);
			},
			set: (doxOptions: config.doxOptions, value: logLevelKeys) => {
				doxOptions.logLevel = value;
			},
		},
		tsConfigs: {
			validate: (value: string[] | undefined) => {
				return value === undefined
					? true
					: !Array.isArray(value)
					? false
					: !value.find((innerVal) => typeof innerVal !== 'string');
			},
			set: (doxOptions: config.doxOptions, value: string | undefined) => {
				const defaultValue = config.clone(
					config.doxArgs.tsConfigs.defaultValue || [],
				) as string[];

				doxOptions.tsConfigs ??= defaultValue;
				value === undefined
					? (doxOptions.tsConfigs = undefined)
					: !doxOptions.tsConfigs.includes(value)
					? doxOptions.tsConfigs.push(value)
					: null;
			},
		},
		npmFileConvention: {
			validate: (value: string) => {
				return typeof value === 'string' && value.split('.').length > 1;
			},
			set: (doxOptions: config.doxOptions, value: string) => {
				doxOptions.npmFileConvention = value;
			},
		},
		typedox: {
			validate: (value: string | undefined) => {
				return value === undefined
					? true
					: typeof value === 'string' && value.split('.').length > 1;
			},
			set: (doxOptions: config.doxOptions, value: string | undefined) => {
				doxOptions.typedox = value;
			},
		},
	};
}
