import * as args from './libArgs';
import * as opts from './libOpts';
import { logger as log } from '../typedox';

export interface confApi extends args.doxArgsType {
	projectRootDir: args.doxArg<string, string, confApi>;
	doxOut: args.doxArg<string, string, confApi>;
	typeDependencies: args.doxArg<string[], string, confApi>;
	logLevel: args.doxArg<keyof typeof log.logLevels, string, confApi>;
	tsConfigs: args.doxArg<string[], string, confApi>;
	npmFileConvention: args.doxArg<string, string, confApi>;
	typedox: args.doxArg<string, string, confApi>;
}

export const confApi: confApi = {
	projectRootDir: {
		description: 'The absolute path location of the project root',
		defaultValue: process.cwd(),
		set: function (doxOptions: opts.coreOpts, value: string) {
			doxOptions.projectRootDir = value;
		},
	},
	doxOut: {
		description: 'The out directory for document build files',
		defaultValue: 'docs',
		set: function (doxOptions: opts.coreOpts, value: string) {
			doxOptions.doxOut = value;
		},
	},
	typeDependencies: {
		description:
			'The @types dependencies in `node_modules` to be included for documentation, if any.',
		defaultValue: [] as string[],
		set: function (doxOptions: opts.coreOpts, value: string): void {
			!doxOptions.typeDependencies &&
				(doxOptions.typeDependencies =
					confApi.typeDependencies.defaultValue);

			!doxOptions.typeDependencies.includes(value) &&
				doxOptions.typeDependencies.push(value);
		},
	},
	logLevel: {
		description: `One of [${log.logLevelKeyStrings}]`,
		defaultValue: 'info',
		set: function (doxOptions: opts.coreOpts, value: string) {
			doxOptions.logLevel = value as keyof typeof log.logLevels;
		},
	},
	tsConfigs: {
		description:
			'The specific tsconfig files to use as documentation entry points',
		defaultValue: [],
		set: function (doxOptions: opts.coreOpts, value: string) {
			!doxOptions.tsConfigs &&
				(doxOptions.tsConfigs = confApi.tsConfigs.defaultValue);

			!doxOptions.tsConfigs.includes(value) &&
				doxOptions.tsConfigs.push(value);
		},
	},
	npmFileConvention: {
		description: 'The name convention of the json files used to set up npm',
		defaultValue: 'package.json',
		set: function (doxOptions: opts.coreOpts, value: string) {
			doxOptions.npmFileConvention = value;
		},
	},
	typedox: {
		description: 'File location of typedox.json config file',
		defaultValue: 'typedox.json',
		set: function (doxOptions: opts.coreOpts, value: string) {
			doxOptions.typedox = value;
		},
	},
};
