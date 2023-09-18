import * as path from 'path';
import * as ts from 'typescript';
import { config } from '../../src/backend/typedox';

const rootDir = config.doxArgs.projectRootDir.defaultValue;
const doxConfigFile = path.join(rootDir, 'typedox.json');
const testTscConfig = 'test/backend/tsconfig.spec.json';
const testTscConfigPath = path.join(rootDir, testTscConfig);

const ensureAbsPath = config.ensureAbsPath.bind(null, rootDir);
export const configs = {
	rootDir,
	doxConfigFile,
	testTscConfig,
	testTscConfigPath,
	ensureAbsPath,
};

const tscConfig = ts.readJsonConfigFile(
	'functionalTests/templates/tsWrapper.tsconfig.json',
	ts.sys.readFile,
);
const parsedConfig = ts.parseJsonConfigFileContent(
	tscConfig,
	ts.sys,
	path.join(__dirname, 'functionalTests/templates'),
);

const program = ts.createProgram(parsedConfig.fileNames, parsedConfig.options);
const checker = program.getTypeChecker();
const confFile = program.getRootFileNames()[0];
const confDir = path.dirname(confFile);
const confChild = path.join(confDir, 'tsWrapperChild.ts');
const sourceFile = program.getSourceFile(confFile);
const sourceSymbol = checker.getSymbolAtLocation(sourceFile!)!;
const sourceType = checker.getTypeOfSymbol(sourceSymbol!);
const starExport = sourceSymbol?.exports?.get('__export' as any)!;

export const tscWrapper = {
	program,
	checker,
	confFile,
	confDir,
	confChild,
	sourceFile,
	sourceSymbol,
	sourceType,
	starExport,
};

export function unColour(string: string) {
	return string.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		'',
	);
}
