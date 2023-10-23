import path from 'path';
import {
	loggerUtils,
	Branch,
	DoxProject,
	DoxPackage,
	DoxReference,
	DoxSourceFile,
	config,
	log,
} from 'typedox';
import { factoryFolders } from './tests.stubs.mjs';
import { compilerFactory } from './compilerFactory.mjs';

const { colourise } = loggerUtils;

function makeSpecCaches() {
	return factoryFolders.reduce(
		(accumulator, folder) => {
			accumulator[folder] = makeSpecCache();
			return accumulator;
		},
		{} as Record<factoryFolders, ReturnType<typeof makeSpecCache>>,
	);
}
function makeSpecCache() {
	return {
		project: undefined as DoxProject | undefined,
		options: {} as DoxProject['options'],
		package: {} as Record<string, DoxPackage>,
		reference: {} as Record<string, DoxReference>,
		sourceFile: {} as Record<string, DoxSourceFile>,
	};
}
let specCache = makeSpecCaches();
function warnAboutDefaults(name: string) {
	console.warn(
		colourise(
			'FgYellow',
			`        "${name}()" provides a stub that is of the opinion that it's ancestor tests are passing. Use with caution.`,
		),
	);
}
const specDoxProject = (folder: factoryFolders, mute = false): DoxProject => {
	const { projectDir, tsConfigPath } = compilerFactory(folder);

	!mute && warnAboutDefaults('defaultProject');

	if (specCache[folder].project) return specCache[folder].project!;

	const doxOptions = config.getDoxOptions([
		'--projectRootDir',
		projectDir,
		'--npmFileConvention',
		'package.spec.json',
		'--tsConfigs',
		tsConfigPath,
	]);

	const project = new DoxProject(doxOptions);
	specCache[folder].options = config.deepClone(project.options);

	return (specCache[folder].project = project);
};

const specDoxPackage = (
	folder: factoryFolders,
	index = 0,
	doxProject = specDoxProject(folder, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specDoxPackage');
	const id = folder + index;
	if (specCache[folder].package[id]) return specCache[folder].package[id];

	const len = doxProject.doxPackages.length;
	if (index >= len) throw Error(`doxProject only has ${len} doxPackages`);

	doxProject.doxPackages.forEach((doxPackage) => {
		doxPackage.doxReferences.forEach((reference) => {
			reference.discoverFiles();
			reference.discoverDeclarations();
		});
	});
	doxProject.doxPackages.forEach((doxPackage) => {
		doxPackage.doxReferences.forEach((reference) => {
			reference.buildRelationships();
		});
	});
	doxProject.doxPackages.forEach((doxPackage) => {
		doxPackage.doxReferences.forEach((reference) => {
			const rootDeclarations = reference.getRootDeclarations();

			if (!reference.treeBranches.has(reference.name)) {
				const treeBranch = new Branch(reference, rootDeclarations);
				reference.treeBranches.set(reference.name, treeBranch);
			}
		});
	});
	return (specCache[folder].package[id] ??= doxProject.doxPackages[index]);
};
const specDoxReference = (
	folder: factoryFolders,
	index = 0,
	doxPackage = specDoxPackage(folder, undefined, undefined, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specReference');

	return doxPackage.doxReferences[index];
};

const specDoxSourceFile = (
	folder: factoryFolders,
	reference = specDoxReference(folder, undefined, undefined, true),
	fileName = 'index.ts',
	mute = false,
) => {
	!mute && warnAboutDefaults('specDoxSourceFile');

	const projectDir = specCache[folder].options.projectRootDir;
	const filePath = path.join(projectDir, fileName);
	const id = folder + filePath;

	if (specCache[folder].sourceFile[id])
		return specCache[folder].sourceFile[id];

	if (!reference.filesMap.has(filePath)) {
		throw Error(
			`"${filePath}" does not exist in reference named "${reference.name}"`,
		);
	}

	return (specCache[folder].sourceFile[id] ??=
		reference.filesMap.get(filePath)!);
};

export const projectFactory = {
	specDoxProject,
	specDoxPackage,
	specDoxReference,
	specDoxSourceFile,
};
