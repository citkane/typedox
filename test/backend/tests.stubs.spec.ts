import * as path from 'path';
import * as ts from 'typescript';
import {
	Branch,
	DoxProject,
	TsSourceFile,
	config,
	npmPackageDefinitions,
} from '../../src/backend/typedox';
import { colourise } from '../../src/backend/logger/loggerUtils';
import { assert } from 'chai';

/** The default project root directory (probably process.cwd()) */
const rootDir = config.doxArgs.projectRootDir.defaultValue;
/** ensures a path is absolute above the rootDir when a relative path is given */
const ensureAbsPath = config.ensureAbsPath.bind(null, rootDir);
/** A string of five spaces */
const spacer = ' '.repeat(5);
function itExists(key: string, item: any, map: Map<string, any>) {
	assert.exists(
		item,
		`"${key}" does not exist in [\n${spacer}${spacer}${Array.from(
			map.keys(),
		).join(`\n${spacer}${spacer}`)}\n${spacer}]`,
	);
}
/** Gets a dox.TsDeclaration from the given key. Errors with all available keys logged */
function getDeclaration(this: TsSourceFile, key: string) {
	const declaration = this.declarationsMap.get(key);
	itExists(key, declaration, this.declarationsMap);
	return declaration;
}
/** Gets an exported ts.Symbol child from the given key. Errors with all available keys logged */
function getExportSymbol(this: ts.Symbol, key: string) {
	const exports = this.exports!;
	const symbol = exports.get(key as any);
	itExists(key, symbol, exports as Map<string, ts.Symbol>);

	return symbol;
}
export { rootDir, ensureAbsPath, spacer, getDeclaration, getExportSymbol };

/** strips color information from a string */
export function unColour(string: string) {
	return string.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		'',
	);
}

const defaultDoxConfigPath = ensureAbsPath(config.doxArgs.typedox.defaultValue);
export const configs = {
	/** As per the src definition, not test - usually process.cwd()/typedox.json */
	defaultDoxConfigPath,
	/** How many tsconfig.json files set up in the test scenario project chain */
	expectedConfigLength: 4,
};

const factoryFolder = 'test/backend/projectFactory';
/** Get a ready made test project from the test "projectScenarios" folder */
export function compilerFactory(folder: string, tsconfig = 'tsconfig.json') {
	/** The absolute path to the project root */
	const projectDir = path.join(rootDir, factoryFolder, folder);
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
		function getFile(filePath = program.getRootFileNames()[0]) {
			filePath = path.join(projectDir, filePath);
			const sourceFile = program.getSourceFile(filePath)!;
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
		}
		return { program, checker, getFile };
	};
	return { projectDir, tsConfigPath, tsconfig, compiler };
}

function warnAboutDefaults(name: string) {
	console.warn(
		colourise(
			'FgYellow',
			`        "${name}()" provides a stub that is of the opinion that it's ancestor tests are passing. Use with caution.`,
		),
	);
}
const { projectDir, tsConfigPath } = compilerFactory('groups');
const specProject = (mute = false) => {
	config._deleteCache();
	!mute && warnAboutDefaults('defaultProject');

	const doxOptions = config.getDoxOptions([
		'--projectRootDir',
		projectDir,
		'--npmFileConvention',
		'package.spec.json',
		'--tsConfigs',
		tsConfigPath,
	]);
	const doxProject = new DoxProject(doxOptions);
	return doxProject;
};
const specNpmPackageDefinitions = (
	project = specProject(true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specNpmPackageDefinitions');
	return (project as any).npmPackageDefinitions as npmPackageDefinitions;
};
const specNpmPackage = (
	index = 0,
	doxProject = specProject(true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specNpmPackage');
	const len = doxProject.npmPackages.length;
	if (index >= len) throw Error(`doxProject only has ${len} npmPackages`);
	doxProject.npmPackages.forEach((npmPackage) => {
		npmPackage.tsReferences.forEach((reference) => {
			reference.discoverFiles();
			reference.discoverDeclarations();
		});
	});
	doxProject.npmPackages.forEach((npmPackage) => {
		npmPackage.tsReferences.forEach((reference) => {
			reference.buildRelationships();
		});
	});
	doxProject.npmPackages.forEach((npmPackage) => {
		npmPackage.tsReferences.forEach((reference) => {
			const rootDeclarations = reference.getRootDeclarations();
			const treeBranch = new Branch(reference, rootDeclarations);
			reference.treeBranches.set(reference.name, treeBranch);
		});
	});

	return doxProject.npmPackages[index]!;
};
const specReference = (
	index = 0,
	npmPackage = specNpmPackage(undefined, undefined, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specReference');
	const len = npmPackage.tsReferences.length;
	if (index >= len)
		throw Error(`npmPackage.tsReferences only has ${len} members`);
	const reference = npmPackage.tsReferences[index];
	reference.discoverFiles();
	reference.discoverDeclarations();
	reference.buildRelationships();

	const rootDeclarations = reference.getRootDeclarations();
	const treeBranch = new Branch(reference, rootDeclarations);
	reference.treeBranches.set(reference.name, treeBranch);

	return reference;
};

const specTsSourceFile = (
	reference = specReference(undefined, undefined, true),
	fileName = 'index.ts',
	mute = false,
) => {
	!mute && warnAboutDefaults('specTsSourceFile');
	const filePath = path.join(projectDir, fileName);
	if (!reference.filesMap.has(filePath))
		throw Error(
			`"${filePath}" does not exist in reference named "${reference.name}"`,
		);
	return reference.filesMap.get(filePath)!;
};

export const projectFactory = {
	specProject,
	specNpmPackage,
	specNpmPackageDefinitions,
	specReference,
	specTsSourceFile,
};
