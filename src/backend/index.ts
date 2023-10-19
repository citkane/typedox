import {
	config,
	DoxReference,
	DoxProject,
	DoxPackage,
	Branch,
	logger as log,
	logLevels,
	loggerUtils,
} from './typedox';

export default function main(customOptions?: config.doxOptions) {
	const doxProject = makeDoxProject(customOptions);
	const doxPackages = getDoxPackages(doxProject);
	const doxReferences = getDoxReferences(doxPackages);

	discoverFilesAndDeclarations(doxReferences);
	buildRelationShips(doxReferences);
	growDocumentBranches(doxReferences);

	const serialised = doxProject.toObject;

	log.info(JSON.stringify(serialised, null, 4));

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
function getDoxPackages(doxProject: DoxProject) {
	const doxPackages = doxProject.doxPackages;
	log.info(`Found ${doxPackages.length} npm packages`);
	return doxPackages;
}

function getDoxReferences(doxPackages: DoxPackage[]) {
	return doxPackages.map((doxPackage) => doxPackage.doxReferences).flat();
}

function discoverFilesAndDeclarations(doxReferences: DoxReference[]) {
	doxReferences.forEach((doxReference) => {
		doxReference.discoverFiles();
		doxReference.discoverDeclarations();
	});
}

function buildRelationShips(doxReferences: DoxReference[]) {
	doxReferences.forEach((doxReference) => doxReference.buildRelationships());
}

function growDocumentBranches(doxReferences: DoxReference[]) {
	doxReferences.forEach((doxReference) => {
		const rootDeclarations = doxReference.getRootDeclarations();
		const treeBranch = new Branch(doxReference, rootDeclarations);
		doxReference.treeBranches.set(doxReference.name, treeBranch);
	});
}
