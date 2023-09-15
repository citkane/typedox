import * as path from 'path';
import { config, logger as log, logLevels } from '../../src/backend/typedox';

const rootDir = config.doxArgs.projectRootDir.defaultValue;
const doxConfigFile = path.join(rootDir, 'typedox.json');
const testTscConfig = 'test/backend/typescript.spec.json';
const testTscConfigPath = path.join(rootDir, testTscConfig);
const defaultConfig = {
	projectRootDir: rootDir,
	doxOut: 'docs',
	typeDependencies: [],
	logLevel: 'info',
	tsConfigs: [],
	npmFileConvention: 'package.json',
	typedox: 'typedox.json',
};
const defaultOptions = {
	...defaultConfig,
	...{
		doxOut: path.join(rootDir, defaultConfig.doxOut),
		tsConfigs: [path.join(rootDir, 'tsconfig.json')],
	},
} as any;
delete defaultOptions.typedox;

export const configs = {
	rootDir,
	doxConfigFile,
	defaultConfig,
	defaultOptions,
	testTscConfig,
	testTscConfigPath,
};
