import {
	config,
	TsReference,
	DoxProject,
	NpmPackage,
	Branch,
	logger as log,
} from './typedox';

export default function main(customOptions?: config.doxOptions) {
	const doxProject = makeDoxProject(customOptions);
	const npmPackages = getNpmPackages(doxProject);
	const tsReferences = getTsReferences(npmPackages);

	discoverFilesAndDeclarations(tsReferences);
	buildRelationShips(tsReferences);
	growDocumentBranches(tsReferences);

	//log.inspect(doxProject.toObject);
}

function makeDoxProject(customOptions?: config.doxOptions) {
	const projectOptions = config.getDoxOptions(customOptions);
	const doxProject = new DoxProject(projectOptions);
	log.setLogLevel(doxProject.options.logLevel);

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
		const rootDeclarations = tsReference.getRootDeclarations();
		const treeBranch = new Branch(tsReference, rootDeclarations);
		tsReference.treeBranches.set(tsReference.name, treeBranch);
	});
}
