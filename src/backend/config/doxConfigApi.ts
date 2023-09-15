import { logger as log, logLevelKeys } from '../typedox';
import { configurators, deepFreeze } from './libConfig';

type Flatten<T> = T extends any[] ? T[number] : T;
type RequiredValue<R, V> = R extends true | undefined ? V : V | undefined;

export type doxOptions = {
	[K in keyof doxArgs]: doxArgs[K]['required'] extends true | undefined
		? doxArgs[K]['defaultValue']
		: doxArgs[K]['defaultValue'] | undefined;
};
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
	tsConfigs: doxArg<string[]>;
	npmFileConvention: doxArg<string, true>;
	typedox: doxArg<string>;
}

export const doxArgs: doxArgs = {
	projectRootDir: {
		description: 'The absolute path location of the project root',
		defaultValue: process.cwd(),
		required: true,
		set: configurators.projectRootDir.set,
		validate: configurators.projectRootDir.validate,
	},
	doxOut: {
		description: 'The out directory for document build files',
		defaultValue: 'docs',
		required: true,
		set: configurators.doxOut.set,
		validate: configurators.doxOut.validate,
	},
	typeDependencies: {
		description:
			'The @types dependencies in `node_modules` to be included for documentation, if any.',
		defaultValue: [] as string[],
		required: true,
		set: configurators.typeDependencies.set,
		validate: configurators.typeDependencies.validate,
	},
	logLevel: {
		description: `One of [${log.logLevelKeyStrings}]`,
		defaultValue: 'info' as logLevelKeys,
		required: true,
		set: configurators.logLevel.set,
		validate: configurators.logLevel.validate,
	},
	tsConfigs: {
		description: `Specific tsconfig files to used as documentation entry points.`,
		defaultValue: [] as string[],
		set: configurators.tsConfigs.set,
		validate: configurators.tsConfigs.validate,
	},
	npmFileConvention: {
		description: 'The name convention of the json files used to set up npm',
		defaultValue: 'package.json',
		required: true,
		set: configurators.npmFileConvention.set,
		validate: configurators.npmFileConvention.validate,
	},
	typedox: {
		description: 'File location of typedox.json config file',
		defaultValue: 'typedox.json',
		set: configurators.typedox.set,
		validate: configurators.typedox.validate,
	},
};
deepFreeze(doxArgs);
