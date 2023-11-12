import { log, logLevelKeys, logLevels } from '@typedox/logger';
import { options } from './_namespace.mjs';
import { Arg } from './lib/libArgs.mjs';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

export interface CoreArgsApi {
	projectRootDir: Arg<string, true>;
	doxOut: Arg<string, true>;
	logLevel: Arg<logLevelKeys, true>;
	tsConfigs: Arg<string[]>;
	npmFileConvention: Arg<string, true>;
	typedox: Arg<string>;
}
export class CoreArgsApi implements CoreArgsApi {
	//Always leave projectRootDir at index [0] as all other paths resolve relative to this
	projectRootDir = new Arg<string, true>(
		'The path of the the project root',
		'string',
		'./',
		setters.call(this).projectRootDir.set,
		setters.call(this).projectRootDir.validate,
		true,
	);
	doxOut = new Arg<string, true>(
		'The out directory for document build files',
		'string',
		'docs',
		setters.call(this).doxOut.set,
		setters.call(this).doxOut.validate,
		true,
	);
	logLevel = new Arg<logLevelKeys, true>(
		`One of [${log.logLevelKeyStrings}]`,
		'string',
		'info' as logLevelKeys,
		setters.call(this).logLevel.set,
		setters.call(this).logLevel.validate,
		true,
	);
	tsConfigs = new Arg<string[]>(
		`Specific tsconfig files to used as documentation entry points.`,
		'array',
		[] as string[],
		setters.call(this).tsConfigs.set,
		setters.call(this).tsConfigs.validate,
	);
	npmFileConvention = new Arg<string, true>(
		'The name convention of the json files used to set up npm',
		'string',
		'package.json',
		setters.call(this).npmFileConvention.set,
		setters.call(this).npmFileConvention.validate,
		true,
	);
	typedox = new Arg<string>(
		'File location/name of a typedox config json file',
		'string',
		'typedox.json',
		setters.call(this).typedox.set,
		setters.call(this).typedox.validate,
	);
}

function setters(this: CoreArgsApi) {
	return {
		projectRootDir: {
			validate: (value: string) => {
				return (
					!!value && typeof value === 'string' && fs.existsSync(value)
				);
			},
			set: (doxOptions: options<CoreArgsApi>, value?: string) => {
				value ??= this.projectRootDir.defaultValue;
				doxOptions.projectRootDir = path.isAbsolute(value)
					? value
					: path.join(process.cwd(), value);
			},
		},
		doxOut: {
			validate: (value: string) => {
				return !!value && typeof value === 'string';
			},
			set: (doxOptions: options<CoreArgsApi>, value?: string) => {
				value ??= this.doxOut.defaultValue;
				doxOptions.doxOut = path.isAbsolute(value)
					? value
					: path.join(doxOptions.projectRootDir, value);
			},
		},
		logLevel: {
			validate: (value: logLevelKeys) => {
				return !!value && typeof logLevels[value] === 'number';
			},
			set: (doxOptions: options<CoreArgsApi>, value?: logLevelKeys) => {
				const defaultValue = this.logLevel.defaultValue;
				value ??= defaultValue;
				doxOptions.logLevel = value;
			},
		},
		tsConfigs: {
			validate: (values?: string[]) => {
				return values === undefined
					? true
					: !values.find((location) => {
							const isFile = !!path.extname(location);
							if (isFile) return !fs.existsSync(location);
							return !ts.findConfigFile(
								location,
								ts.sys.fileExists,
							);
					  });
			},
			set: (doxOptions: options<CoreArgsApi>, values?: string[]) => {
				doxOptions.tsConfigs = !!values
					? values.reduce((accumulator, value) => {
							const location = path.isAbsolute(value)
								? value
								: path.join(doxOptions.projectRootDir, value);
							if (accumulator.includes(location))
								return accumulator;

							accumulator.push(location);
							return accumulator;
					  }, [] as string[])
					: [];
			},
		},
		npmFileConvention: {
			validate: (value: string) => {
				return typeof value === 'string' && value.split('.').length > 1;
			},
			set: (doxOptions: options<CoreArgsApi>, value?: string) => {
				value ??= this.npmFileConvention.defaultValue;
				doxOptions.npmFileConvention = value;
			},
		},
		typedox: {
			validate: (value?: string) => {
				const defaultValue = this.typedox.defaultValue;

				if (typeof value !== 'string') return false;

				if (value.startsWith('notFound:')) {
					const isDefault = value.endsWith(defaultValue);
					return isDefault;
				}

				return true;
			},
			set: (doxOptions: options<CoreArgsApi>, value?: string) => {
				value ??= this.typedox.defaultValue;
				const location = path.join(process.cwd(), value);

				doxOptions.typedox =
					fs.existsSync(location) && fs.statSync(location).isFile()
						? location
						: `notFound: ${location}`;
			},
		},
	};
}

//export type doxArgs = { [key in keyof Args]: Args[key] };
//export const doxArgs = new Args();
