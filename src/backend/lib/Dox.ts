import * as ts from 'typescript';
import * as dox from '../typedox';
import Logger from './Logger';

export class Dox {
	protected context: dox.lib.Context;
	checker: ts.TypeChecker;
	protected package?: dox.Package;
	sourceFile?: dox.SourceFile;
	protected exportDeclaration?: dox.Declaration;
	id: number;
	constructor(context: dox.lib.Context) {
		this.context = context;
		this.checker = context.checker;
		this.id = context.id.uid;
		this.package = context.package;
		this.sourceFile = context.sourceFile;
		this.exportDeclaration = context.exportDeclaration;
	}
}
export function loadConfigFromFile(filePath: string, baseDir: string) {
	const configObject = ts.readConfigFile(filePath, ts.sys.readFile).config;
	const config = ts.parseJsonConfigFileContent(
		configObject,
		ts.sys,
		baseDir,
		{},
	);
	return config;
}

export const log = new Logger();
