import path from 'path';
import ts from 'typescript';
import { factoryFolders } from './tests.stubs.spec';
import * as stubs from './tests.stubs.spec';
import { assert } from 'chai';

const factoryFolder = 'test/backend/projectFactory';
/** Get a ready made test project from the test "projectScenarios" folder */
export function compilerFactory(
	folder: factoryFolders = 'groups',
	tsconfig = 'tsconfig.json',
) {
	/** The absolute path to the project root */
	const projectDir = path.join(stubs.rootDir, factoryFolder, folder);
	/** The absolute path to the root tsconfig */
	const tsConfigPath = path.join(projectDir, tsconfig);
	const tscConfig = ts.readJsonConfigFile(tsConfigPath, ts.sys.readFile);
	/** A set of tools to create and query a tsc program */
	const compiler = () => {
		const parsedConfig = ts.parseJsonConfigFileContent(
			tscConfig,
			ts.sys,
			projectDir,
		);
		/** The tsc ts.Program instance */
		const program = ts.createProgram(
			parsedConfig.fileNames,
			parsedConfig.options,
		);
		/** The ts.TypeChecker instance */
		const checker = program.getTypeChecker();

		/**
		 * A set tools to retrieve information including a source file as ts.SourceFile, ts.Symbol or ts.Type
		 * @param file The relative file name under the "projectScenario/<projectFolder>" folder
		 * @returns
		 */
		const getFile = (filePath = 'index.ts') => {
			filePath = path.join(projectDir, filePath);
			const sourceFile = program.getSourceFile(filePath);
			assert.exists(sourceFile);
			const sourceSymbol = checker.getSymbolAtLocation(sourceFile!)!;
			const sourceType = checker.getTypeOfSymbol(sourceSymbol!);
			/** get the star export, if any, for the file */
			const starExport = sourceSymbol.exports?.get(
				'__export' as any,
			) as ts.Symbol;

			return {
				filePath,
				sourceFile,
				sourceSymbol,
				sourceType,
				starExport,
			};
		};
		return { program, checker, getFile };
	};

	return { projectDir, tsConfigPath, tsconfig, compiler };
}
