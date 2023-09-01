import * as ts from 'typescript';
import * as dox from './typedox';

const log = dox.lib.Logger;

const doxOptions = getDoxOptions();
const doxProject = bootStrapEnv(doxOptions);
const tsReferences = makeTsReferences(doxProject);

discoverFilesAndDeclarations(tsReferences);
buildRelationShips(tsReferences);
growDocumentBranches(tsReferences);

log.info(JSON.stringify(doxProject.toObject, null, 4));

function getDoxOptions() {
	return dox.doxOptionsStub;
}
function bootStrapEnv(doxOptions: dox.doxOptions) {
	const doxProject = new dox.DoxProject(doxOptions);
	const { tsOverrides } = doxOptions;

	getNpmPackages()
		.map(makeProjectConfig)
		.map(registerTsProgramsToConfig)
		.map(diagnoseTsPrograms)
		.map(doxProject.makeNpmPackage)
		.forEach(doxProject.registerNpmPackage);

	return doxProject;

	function getNpmPackages() {
		return dox.npmPackagesStub;
	}
	function makeProjectConfig(npmPackageDef: dox.npmPackageDef) {
		const { name, version, packageRootDir } = npmPackageDef;
		const tsEntryRefs = dox.config.PackageConfig.findTsEntryDefs();
		const config = new dox.config.PackageConfig(
			tsEntryRefs,
			name,
			version,
			packageRootDir,
			tsOverrides,
		);
		return config;
	}
	function registerTsProgramsToConfig(
		packageConfig: dox.config.PackageConfig,
	) {
		packageConfig.tsReferenceConfigs.forEach((config, name) => {
			const program = ts.createProgram(config.fileNames, config.options);
			packageConfig.tsPrograms.set(name, program);
		});
		return packageConfig;
	}
	function diagnoseTsPrograms(projectConfig: dox.config.PackageConfig) {
		projectConfig.tsPrograms.forEach((program) => {
			const diagnostics = ts.getPreEmitDiagnostics(program);
			if (diagnostics.length) {
				diagnostics.forEach((diagnosis) => {
					log.warn(['index'], diagnosis.messageText);
					log.debug(diagnosis.relatedInformation);
				});
				log.throwError(['index'], 'TSC diagnostics failed.');
			}
		});
		return projectConfig;
	}
}
function makeTsReferences(doxProject: dox.DoxProject) {
	return [...(doxProject.npmPackages.values() || [])]
		.map(dox.NpmPackage.makeTsReferences)
		.flat()
		.map(registerReference);

	function registerReference(tsReference: dox.TsReference) {
		tsReference.parent.registerTsReference(tsReference);
		return tsReference;
	}
}
function discoverFilesAndDeclarations(tsReferences: dox.TsReference[]) {
	tsReferences.forEach((tsReference) => {
		tsReference.discoverFiles();
		tsReference.discoverDeclarations();
	});
}
function buildRelationShips(tsReferences: dox.TsReference[]) {
	tsReferences.forEach((tsReference) => tsReference.buildRelationships());
}
function growDocumentBranches(tsReferences: dox.TsReference[]) {
	tsReferences.forEach((tsReference) => {
		const fileSources = getSourceFiles(tsReference);
		const rootDeclarations =
			dox.TsReference.getDeclarationRoots(fileSources);
		const treeBranch = new dox.Branch(tsReference, rootDeclarations);
		tsReference.treeBranches.set(tsReference.name, treeBranch);
	});

	function getSourceFiles(tsReference: dox.TsReference) {
		return [...tsReference.filesMap.values()];
	}
}
