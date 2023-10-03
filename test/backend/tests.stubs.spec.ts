export type factoryFolders = 'configs' | 'groups' | 'specifiers';
import * as path from 'path';
import * as ts from 'typescript';
import {
	logger as log,
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
function logSpecifierHelp() {
	const rep = 80;
	log.info(
		'\n\n',
		'-'.repeat(rep),
		'\n',
		colourise('Bright', 'Examples of the import / export specifier kinds:'),
		'\n',
		'-'.repeat(rep),
		'\n',
		{
			ExportAssignment: [
				'export default clause;',
				'export = nameSpace;',
				'export = nameSpace.clause;',
			],
			ExportDeclaration: ["export * from './child/child';"],
			ExportSpecifier: [
				"export { child } from './child/child';",
				'export { localVar, grandchild, grandchildSpace };',
			],
			ImportClause: [
				"import TypeScript from 'typescript';",
				"import clause from './child/child';",
			],
			ImportEqualsDeclaration: [
				'export import childSpace = childSpace;',
				'export import bar = local.bar;',
				'export import bar = local.bar;',
			],
			ImportSpecifier: [
				"import { grandchild, childSpace } from './grandchild/grandchild'",
			],
			ModuleDeclaration: [
				'export namespace moduleDeclaration { local; childSpace; }',
				"declare namespace local {foo = 'foo'}",
			],
			NamespaceExport: ["export * as childSpace from './child/child';"],
			NamespaceImport: ["import * as childSpace from '../child/child';"],
		},
		'\n',
		'-'.repeat(rep),
		'\n\n',
	);
}
export {
	rootDir,
	ensureAbsPath,
	spacer,
	getDeclaration,
	getExportSymbol,
	logSpecifierHelp,
};

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
export function compilerFactory(
	folder: factoryFolders,
	tsconfig = 'tsconfig.json',
) {
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

function warnAboutDefaults(name: string) {
	console.warn(
		colourise(
			'FgYellow',
			`        "${name}()" provides a stub that is of the opinion that it's ancestor tests are passing. Use with caution.`,
		),
	);
}

const specProject = (folder: factoryFolders = 'groups', mute = false) => {
	const { projectDir, tsConfigPath } = compilerFactory(folder);

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
	folder: factoryFolders = 'groups',
	project = specProject(folder, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specNpmPackageDefinitions');
	return (project as any).npmPackageDefinitions as npmPackageDefinitions;
};
const specNpmPackage = (
	folder: factoryFolders = 'groups',
	index = 0,
	doxProject = specProject(folder, true),
	mute = false,
) => {
	//const logLevel = (log as any).logLevel;
	//log.setLogLevel(logLevels.error);
	//const errorStub = stub(log, 'error');
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
	//errorStub.restore();
	//log.setLogLevel(logLevel);
	return doxProject.npmPackages[index]!;
};
const specReference = (
	folder: factoryFolders = 'groups',
	index = 0,
	npmPackage = specNpmPackage(folder, undefined, undefined, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specReference');
	const len = npmPackage.tsReferences.length;
	if (index >= len)
		throw Error(`npmPackage.tsReferences only has ${len} members`);
	const reference = npmPackage.tsReferences[index];

	const rootDeclarations = reference.getRootDeclarations();
	const treeBranch = new Branch(reference, rootDeclarations);
	reference.treeBranches.set(reference.name, treeBranch);

	return reference;
};

const specTsSourceFile = (
	folder: factoryFolders = 'groups',
	reference = specReference(folder, undefined, undefined, true),
	fileName = 'index.ts',
	mute = false,
) => {
	const projectDir = reference.options.projectRootDir;
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
