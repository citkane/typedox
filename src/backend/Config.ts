import * as dox from './typedox';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';
const { Logger, Dox } = dox.lib;

type tsConfigFile = string;
type referenceName = string;
type startPoint = tsConfigFile | [referenceName, tsConfigFile];

export default class Config extends Logger {
	private projectRoot: string;
	private startPoints: startPoint[] = [
		'test/scenarios/namespace/tsconfig.json',
	];
	public referenceConfigs: Map<string, ts.ParsedCommandLine> = new Map();
	constructor(projectRoot: string) {
		super();
		Config.class.bind(this);
		this.projectRoot = path.join(__dirname, '../../');
		this.startPoints.forEach(this.parseStartPoint);
	}

	private parseStartPoint = (startPoint: startPoint) => {
		const fileName =
			typeof startPoint === 'string' ? startPoint : startPoint[1];
		const filePath = path.join(this.projectRoot, fileName);
		const basePath = path.dirname(filePath);
		const config = Config.getConfigFromFile(filePath, basePath);
		const referenceName =
			typeof startPoint === 'string'
				? Config.getReferenceName(basePath, config)
				: startPoint[0];

		this.referenceConfigs.set(referenceName, config);
	};
	private static getReferenceName = (
		basePath: string,
		config: ts.ParsedCommandLine,
	) => {
		return path.basename(basePath);
	};
	private static getConfigFromFile(filePath: string, basePath: string) {
		if (!fs.existsSync(filePath))
			Dox.throwError(this.class(), 'Entry file not found:', filePath);

		const configObject = ts.readConfigFile(
			filePath,
			ts.sys.readFile,
		).config;
		return ts.parseJsonConfigFileContent(
			configObject,
			ts.sys,
			basePath,
			{},
		);
	}
}
