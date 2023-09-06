/**
 * @todo
 * Build a parser to get node packages
 */

import * as dox from '../typedox';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { tscParsedConfig } from '../typedox';

const log = dox.logger;

export class PackageConfig {
	public npmPackageName: string;
	public npmPackageVersion: string;
	public npmPackageRootDir: string;

	public tscConfigs: Map<string, tscParsedConfig> = new Map();
	public tscPrograms: Map<string, ts.Program> = new Map();

	constructor(
		npmProjectName: string,
		npmProjectVersion: string,
		npmProjectRootDir: string,
		tsEntryDefs: tscParsedConfig[],
		//optionOverrides: Partial<ts.ParsedCommandLine> = {},
	) {
		this.npmPackageName = npmProjectName;
		this.npmPackageVersion = npmProjectVersion;
		this.npmPackageRootDir = npmProjectRootDir;
		tsEntryDefs.forEach(
			(entryDef) => {},
			//this.parseTsEntryDef(entryDef, optionOverrides),
		);
	}
	/*
	private parseTsEntryDef = (
		entryDef: dox.tscRawConfig,
		optionOverrides: Partial<ts.ParsedCommandLine>,
	) => {
		const fileName = typeof entryDef === 'string' ? entryDef : entryDef[1];
		const filePath = path.join(this.npmPackageRootDir, fileName);
		const basePath = path.dirname(filePath);
		const config = PackageConfig.getConfigFromFile(
			filePath,
			basePath,
			optionOverrides,
		);
		const referenceName =
			typeof entryDef === 'string'
				? PackageConfig.getReferenceName(basePath, config)
				: entryDef[0];

		this.tscReferenceConfigs.set(referenceName, config);
	};
	public static findTsEntryDefs() {
		return dox.tsEntryRefsStub;
	}
	private static getReferenceName = (
		basePath: string,
		config: ts.ParsedCommandLine,
	) => {
		return path.basename(basePath);
	};
	private static getConfigFromFile(
		filePath: string,
		basePath: string,
		optionOverrides: Partial<ts.ParsedCommandLine>,
	) {
		if (!fs.existsSync(filePath))
			log.throwError(
				log.identifier(this),
				'Entry file not found:',
				filePath,
			);
		const configObject = ts.readConfigFile(
			filePath,
			ts.sys.readFile,
		).config;
		const parsedOptions = ts.parseJsonConfigFileContent(
			configObject,
			ts.sys,
			basePath,
			{},
		);
		Object.keys(optionOverrides).forEach((k) => {
			const key = k as keyof ts.ParsedCommandLine;
			parsedOptions[key] = {
				...parsedOptions[key],
				...optionOverrides[key],
			};
		});
		return parsedOptions;
	}
	*/
}
