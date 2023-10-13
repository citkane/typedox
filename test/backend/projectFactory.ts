import path from 'path';
import { colourise } from '../../src/backend/logger/loggerUtils';
import {
	Branch,
	DoxProject,
	DoxPackage,
	DoxReference,
	DoxSourceFile,
	config,
	doxPackageDefinitions,
} from '../../src/backend/typedox';
import { factoryFolders } from './tests.stubs.spec';
import { compilerFactory } from './compilerFactory';

function warnAboutDefaults(name: string) {
	console.warn(
		colourise(
			'FgYellow',
			`        "${name}()" provides a stub that is of the opinion that it's ancestor tests are passing. Use with caution.`,
		),
	);
}

let specCache = {
	project: {} as Record<string, DoxProject>,
	branch: {} as Record<string, Branch>,
	package: {} as Record<string, DoxPackage>,
	reference: {} as Record<string, DoxReference>,
	sourceFile: {} as Record<string, DoxSourceFile>,
};
function flushCache() {
	Object.keys(specCache).forEach((key) => {
		const k = key as keyof typeof specCache;
		specCache[k] = {};
	});
}
const specDoxProject = (folder: factoryFolders, mute = false) => {
	const { projectDir, tsConfigPath } = compilerFactory(folder);

	!mute && warnAboutDefaults('defaultProject');

	if (specCache.project[projectDir]) return specCache.project[projectDir];

	config._deleteCache();
	const doxOptions = config.getDoxOptions([
		'--projectRootDir',
		projectDir,
		'--npmFileConvention',
		'package.spec.json',
		'--tsConfigs',
		tsConfigPath,
	]);

	return (specCache.project[projectDir] ??= new DoxProject(doxOptions));
};

const specDoxPackage = (
	folder: factoryFolders,
	index = 0,
	doxProject = specDoxProject(folder, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specDoxPackage');

	const id = folder + index;
	if (specCache.package[id]) return specCache.package[id];

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
			const treeBranch = (specCache.branch[folder] ??= new Branch(
				reference,
				rootDeclarations,
			));
			!reference.treeBranches.has(reference.name) &&
				reference.treeBranches.set(reference.name, treeBranch);
		});
	});
	return (specCache.package[id] ??= doxProject.doxPackages[index]);
};
const specDoxReference = (
	folder: factoryFolders,
	index = 0,
	doxPackage = specDoxPackage(folder, undefined, undefined, true),
	mute = false,
) => {
	!mute && warnAboutDefaults('specReference');

	const id = folder + index + doxPackage.doxReferences[index].name;

	return specCache.reference[id]
		? specCache.reference[id]
		: (specCache.reference[id] ??= doxPackage.doxReferences[index]);
};

const specDoxSourceFile = (
	folder: factoryFolders,
	reference = specDoxReference(folder, undefined, undefined, true),
	fileName = 'index.ts',
	mute = false,
) => {
	!mute && warnAboutDefaults('specDoxSourceFile');

	const projectDir = reference.options.projectRootDir;
	const filePath = path.join(projectDir, fileName);
	const id = folder + filePath;

	if (specCache.sourceFile[id]) return specCache.sourceFile[id];

	if (!reference.filesMap.has(filePath)) {
		throw Error(
			`"${filePath}" does not exist in reference named "${reference.name}"`,
		);
	}

	return (specCache.sourceFile[id] ??= reference.filesMap.get(filePath)!);
};

export const projectFactory = {
	specDoxProject,
	specDoxPackage,
	specDoxReference,
	specDoxSourceFile,
	flushCache,
};
