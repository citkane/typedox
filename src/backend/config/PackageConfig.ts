/**
 * @todo
 * Build a parser to get node packages
 */

import * as dox from '../typedox';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';
import { Logger } from '../lib/Logger';

export class PackageConfig extends Logger {
	public npmPackageName: string;
	public npmPackageVersion: string;
	public npmPackageRootDir: string;

	public tsReferenceConfigs: Map<string, ts.ParsedCommandLine> = new Map();
	public tsPrograms: Map<string, ts.Program> = new Map();

	constructor(
		tsEntryDefs: dox.tsEntryDef[],
		npmProjectName: string,
		npmProjectVersion: string,
		npmProjectRootDir: string,
		optionOverrides: Partial<ts.ParsedCommandLine> = {},
	) {
		super();
		PackageConfig.classString.bind(this);

		this.npmPackageName = npmProjectName;
		this.npmPackageVersion = npmProjectVersion;
		this.npmPackageRootDir = npmProjectRootDir;
		tsEntryDefs.forEach((entryDef) =>
			this.parseTsEntryDef(entryDef, optionOverrides),
		);
	}

	private parseTsEntryDef = (
		entryDef: dox.tsEntryDef,
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

		this.tsReferenceConfigs.set(referenceName, config);
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
			PackageConfig.throwError(
				PackageConfig.classString(),
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
}
