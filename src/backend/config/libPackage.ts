import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import {
	logger as log,
	npmPackageInfo,
	npmPackageMap,
	tscRawConfig,
	config,
	tscParsedConfig,
} from '../typedox';

export function discoverNpmPackages(
	this: config.ProjectConfig,
	tscRawConfigs: tscRawConfig[],
) {
	const { projectRootDir, npmFileConvention } = this;
	return tscRawConfigs.reduce(
		mapTscRawConfigToNpmPackage.bind({
			projectRootDir,
			npmFileConvention,
		}),
		{} as npmPackageMap,
	);
}
export function registerNpmPackageDefs(
	this: config.ProjectConfig,
	packageDefs: npmPackageMap,
) {
	Object.entries(packageDefs).forEach((tuple) => {
		const [location, packageInfo] = tuple;
		const { name, version, tscRawConfigs } = packageInfo;
		const basePath = path.dirname(location);
		const callback = parseRawTscconfig.bind(null, basePath);
		const parsedTsConfigs = tscRawConfigs.map(callback);

		const doxPackage = new config.PackageConfig(
			name,
			version,
			basePath,
			parsedTsConfigs,
		);
		this.npmPackages.set(name, doxPackage);
	});
	return this.npmPackages;
}

function parseRawTscconfig(basePath: string, config: tscRawConfig) {
	const parsedConfig = ts.parseJsonConfigFileContent(
		config,
		ts.sys,
		basePath,
		{},
	) as tscParsedConfig;

	const rootNameArray = path.basename(config.filepathAbs).split('.');
	rootNameArray.pop();
	const rootName = rootNameArray.join('-');
	parsedConfig.rootDir = path.dirname(config.filepathAbs);
	parsedConfig.rootName = rootName;

	return parsedConfig;
}
function mapTscRawConfigToNpmPackage(
	this: { npmFileConvention: string; projectRootDir: string },
	accumulator: npmPackageMap,
	tscRawConfig: tscRawConfig,
) {
	const { npmFileConvention, projectRootDir } = this;
	const tscRawConfigDir = path.dirname(tscRawConfig.filepathAbs);
	let npmPackagePath = findNpmPackageAsPath(
		projectRootDir,
		tscRawConfigDir,
		npmFileConvention,
	);
	if (!npmPackagePath) {
		log.error(
			log.identifier(__filename),
			'Could not find a npm package for a tsconfig:',
			tscRawConfig.filepathAbs,
		);
		return accumulator;
	}

	const { name, version } = config.jsonFileToObject(npmPackagePath);
	const accumulatorKey = (accumulator[npmPackagePath] ??= npmPackageInfo(
		name,
		version,
	));
	accumulatorKey.tscRawConfigs.push(tscRawConfig);
	return accumulator;
}
function findNpmPackageAsPath(
	projectRootDir: string,
	directory: string,
	npmFileConvention: string,
) {
	const thisLocation = path.join(directory, npmFileConvention);
	if (fs.existsSync(thisLocation)) return thisLocation;
	if (directory === projectRootDir) return undefined;
	return findNpmPackageAsPath(
		projectRootDir,
		path.join(directory, '../'),
		npmFileConvention,
	);
}

const npmPackageInfo = (name: string, version: string) =>
	({
		name,
		version,
		tscRawConfigs: [] as tscRawConfig[],
	}) as npmPackageInfo;
