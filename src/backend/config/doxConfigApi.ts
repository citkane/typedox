import { logger as log } from '../typedox';
import { configSetters, configValidators } from './libConfig';

export type doxArgs = Record<string, doxConfigArg<any, any, any>>;
export interface doxConfigArg<
	defaultValue,
	value,
	argsInterface extends doxArgs,
> {
	description: string;
	defaultValue: defaultValue;
	required: boolean;
	set: (doxOptions: doxGenericOptions<argsInterface>, value: value) => void;
	validate: (value: any) => undefined | boolean;
}
export type doxGenericOptions<Args extends doxArgs> = {
	[K in keyof Args]: Args[K]['defaultValue'] | undefined;
};
export type doxGenericArgs<argsInterface extends doxArgs> = {
	[K in keyof argsInterface]: doxConfigArg<any, any, argsInterface>;
};
export type coreOpts = doxGenericOptions<appConfApi>;

export interface appConfApi extends doxArgs {
	projectRootDir: doxConfigArg<string, string, appConfApi>;
	doxOut: doxConfigArg<string, string, appConfApi>;
	typeDependencies: doxConfigArg<string[], string, appConfApi>;
	logLevel: doxConfigArg<keyof typeof log.logLevels, string, appConfApi>;
	tsConfigs: doxConfigArg<string[], string, appConfApi>;
	npmFileConvention: doxConfigArg<string, string, appConfApi>;
	typedox: doxConfigArg<string, string, appConfApi>;
}

export const appConfApi: appConfApi = {
	projectRootDir: {
		description: 'The absolute path location of the project root',
		defaultValue: process.cwd(),
		required: true,
		set: configSetters.projectRootDir,
		validate: configValidators.projectRootDir,
	},
	doxOut: {
		description: 'The out directory for document build files',
		defaultValue: 'docs',
		required: true,
		set: configSetters.doxOut,
		validate: configValidators.doxOut,
	},
	typeDependencies: {
		description:
			'The @types dependencies in `node_modules` to be included for documentation, if any.',
		defaultValue: [] as string[],
		required: true,
		set: configSetters.typeDependencies,
		validate: configValidators.typeDependencies,
	},
	logLevel: {
		description: `One of [${log.logLevelKeyStrings}]`,
		defaultValue: 'info',
		required: true,
		set: configSetters.logLevel,
		validate: configValidators.logLevel,
	},
	tsConfigs: {
		description: `Specific tsconfig files to used as documentation entry points.`,
		defaultValue: [],
		required: false,
		set: configSetters.tsConfigs,
		validate: configValidators.tsConfigs,
	},
	npmFileConvention: {
		description: 'The name convention of the json files used to set up npm',
		defaultValue: 'package.json',
		required: true,
		set: configSetters.npmFileConvention,
		validate: configValidators.npmFileConvention,
	},
	typedox: {
		description: 'File location of typedox.json config file',
		defaultValue: 'typedox.json',
		required: false,
		set: configSetters.typedox,
		validate: configValidators.typedox,
	},
};
