import * as dox from '../typedox';
/*
export function serialiseProject(root: dox.DoxProject) {
	const packages = mapToObject<npmPackage>(
		root.npmPackages,
		serialiseNpmPackage,
	);

	return {
		packages,
	};
}

export function serialiseNpmPackage(npmPackage: dox.NpmPackage) {
	const { version, name, tsReferences } = npmPackage;
	const references = mapToObject<tsReference>(
		tsReferences,
		serialiseTsReference,
	);

	return {
		name,
		version,
		references,
	};
}

export function serialiseTsReference(reference: dox.TsReference) {
	const branches = mapToObject<branch>(reference.treeBranches, branch);
	const branchName = reference.name;

	return { ...branches[branchName] };
}

function branch(treeBranch: dox.Branch) {
	const { nameSpaces, functions, variables, classes, enums } = treeBranch;

	return {
		namespaces: mapToObject<nameSpaces>(nameSpaces, nameSpacesGroup),
		classes: mapToObject<classes>(classes, classesGroup),
		functions: mapToObject<functions>(functions, functionsGroup),
		enums: mapToObject<enums>(enums, enumsGroup),
		variables: mapToObject<variables>(variables, variablesGroup),
	};
}

function nameSpacesGroup(nameSpace: dox.Branch) {
	return { ...branch(nameSpace) };
}

function classesGroup() {
	return {};
}

function variablesGroup() {
	return {};
}

function functionsGroup() {
	return {};
}

function enumsGroup() {
	return {};
}

function mapToObject<T extends targetFunction>(
	sourceMap: sourceMapTypes,
	targetFunction: targetFunctionTypes,
) {
	type R = ReturnType<T>;
	const newObject = Object.fromEntries(sourceMap);
	Object.keys(newObject).forEach((key) => {
		const newKeyValue = targetFunction(newObject[key]);
		newObject[key] = newKeyValue;
	});
	return newObject as {
		[k: string]: R;
	};
}

type sourceMapTypes =
	| Map<string, dox.NpmPackage>
	| Map<string, dox.TsReference>
	| Map<string, dox.Branch>
	| Map<string, dox.TsDeclaration>;

type targetFunctionTypes = npmPackage | tsReference | branch;
type targetFunction = (...args: any) => any;
type npmPackage = typeof serialiseNpmPackage;
type tsReference = typeof serialiseTsReference;
type branch = typeof branch;
type nameSpaces = typeof nameSpacesGroup;
type classes = typeof classesGroup;
type variables = typeof variablesGroup;
type functions = typeof functionsGroup;
type enums = typeof enumsGroup;
*/
