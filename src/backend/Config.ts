/**
 * @todo
 * Build a parser to get node packages
 */

import * as dox from './typedox';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';
const { Logger, Dox } = dox.lib;

export default class Config extends Logger {
	public projectName: string;
	public projectVersion: string;
	public projectRoot: string;

	public referenceConfigs: Map<string, ts.ParsedCommandLine> = new Map();
	public programs: Map<string, ts.Program> = new Map();

	constructor(
		tsEntryRefs: dox.tsEntryDef[],
		projectName: string,
		projectVersion: string,
		projectRoot: string,
		optionOverrides: Partial<ts.ParsedCommandLine> = {},
	) {
		super();
		Config.class.bind(this);
		this.projectName = projectName;
		this.projectVersion = projectVersion;
		this.projectRoot = projectRoot;
		tsEntryRefs.forEach((entryDef) =>
			this.parseTsEntryRef(entryDef, optionOverrides),
		);
	}

	private parseTsEntryRef = (
		entryDef: dox.tsEntryDef,
		optionOverrides: Partial<ts.ParsedCommandLine>,
	) => {
		const fileName = typeof entryDef === 'string' ? entryDef : entryDef[1];
		const filePath = path.join(this.projectRoot, fileName);
		const basePath = path.dirname(filePath);
		const config = Config.getConfigFromFile(
			filePath,
			basePath,
			optionOverrides,
		);
		const referenceName =
			typeof entryDef === 'string'
				? Config.getReferenceName(basePath, config)
				: entryDef[0];

		this.referenceConfigs.set(referenceName, config);
	};
	public static getTsEntryRefs() {
		return dox.tsEntryRefs;
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
			Dox.throwError(Config.class(), 'Entry file not found:', filePath);
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
	public static getNodePackages() {
		return dox.packages;
	}
}
