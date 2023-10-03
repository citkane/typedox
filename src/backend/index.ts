import {
	config,
	TsReference,
	DoxProject,
	NpmPackage,
	Branch,
	logger as log,
	logLevels,
} from './typedox';

export default function main(customOptions?: config.doxOptions) {
	const doxProject = makeDoxProject(customOptions);
	const npmPackages = getNpmPackages(doxProject);
	const tsReferences = getTsReferences(npmPackages);

	discoverFilesAndDeclarations(tsReferences);
	buildRelationShips(tsReferences);
	growDocumentBranches(tsReferences);

	const serialised = doxProject.toObject;

	log.debug(JSON.stringify(serialised, null, 4));

	return serialised;
}

function makeDoxProject(customOptions?: config.doxOptions) {
	log.info('Making a typedox project');
	const projectOptions = config.getDoxOptions(customOptions);
	/* istanbul ignore if */
	if (!log.isLogLevelSet) log.setLogLevel(logLevels[projectOptions.logLevel]);
	const doxProject = new DoxProject(projectOptions);

	return doxProject;
}
function getNpmPackages(doxProject: DoxProject) {
	const npmPackages = doxProject.npmPackages;
	log.info(`Found ${npmPackages.length} npm packages`);
	return npmPackages;
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
