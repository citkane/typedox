import path from 'path';
import {
	DoxProject,
	DoxPackage,
	DoxReference,
	DoxSourceFile,
	config,
} from '@typedox/core';
import { factoryFolders } from '../test.stubs.mjs';
import { compilerFactory } from './compilerFactory.mjs';
import { loggerUtils } from '@typedox/logger';
import { doxStub } from '../index.mjs';

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

	const doxConfig = new config.DoxConfig({
		projectRootDir: projectDir,
		npmFileConvention: 'package.spec.json',
		tsConfigs: [tsConfigPath],
	});
	const project = new DoxProject(doxConfig);
	specCache[folder].options = doxStub.deepClone(project.options);

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
	const key = Array.from(doxProject.doxPackages.keys())[index];
	if (specCache[folder].package[id]) return specCache[folder].package[id];

	const len = doxProject.doxPackages.size;
	if (index >= len) throw Error(`doxProject only has ${len} doxPackages`);

	return (specCache[folder].package[id] ??= doxProject.doxPackages.get(key)!);
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
