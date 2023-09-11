import {
	logger as log,
	config,
	TsReference,
	DoxProject,
	NpmPackage,
	Branch,
} from './typedox';

log.isClRequestForHelp() || main();

function main() {
	const doxProject = makeDoxProject();
	const npmPackages = getNpmPackages(doxProject);
	const tsReferences = getTsReferences(npmPackages);

	discoverFilesAndDeclarations(tsReferences);
	buildRelationShips(tsReferences);
	growDocumentBranches(tsReferences);

	//log.info(JSON.stringify(doxProject.toObject, null, 2));
}

function makeDoxProject() {
	const projectOptions = config.getDoxOptions(config.appConfApi);
	const doxProject = new DoxProject(projectOptions);
	log.setLogLevel(doxProject.logLevel);

	return doxProject;
}
function getNpmPackages(doxProject: DoxProject) {
	return doxProject.npmPackages;
}

function getTsReferences(npmPackages: NpmPackage[]) {
	return npmPackages.map((npmPackage) => npmPackage.tsReferences).flat();
}

function discoverFilesAndDeclarations(tsReferences: TsReference[]) {
	tsReferences.forEach((tsReference) => {
		tsReference.discoverFiles();
		tsReference.discoverDeclarations();
	});
}

function buildRelationShips(tsReferences: TsReference[]) {
	tsReferences.forEach((tsReference) => tsReference.buildRelationships());
}

function growDocumentBranches(tsReferences: TsReference[]) {
	tsReferences.forEach((tsReference) => {
		const fileSources = getSourceFiles(tsReference);
		const rootDeclarations = TsReference.getDeclarationRoots(fileSources);
		const treeBranch = new Branch(tsReference, rootDeclarations);
		tsReference.treeBranches.set(tsReference.name, treeBranch);
	});

	function getSourceFiles(tsReference: TsReference) {
		return [...tsReference.filesMap.values()];
	}
}
