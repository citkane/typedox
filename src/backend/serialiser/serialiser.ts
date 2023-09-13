import {
	Branch,
	DoxProject,
	NpmPackage,
	TsDeclaration,
	TsReference,
	logger as log,
} from '../typedox';

export function serialiseProject(project: DoxProject) {
	const packageMap = new Map<string, NpmPackage>();
	project.npmPackages.forEach((pack) => packageMap.set(pack.name, pack));
	const packages = mapToObject<npmPackage>(packageMap, serialiseNpmPackage);

	return {
		packages,
	};
}
export function serialiseNpmPackage(npmPackage: NpmPackage) {
	const { version, name, tsReferences } = npmPackage;
	const referenceMap = new Map<string, TsReference>();
	tsReferences.forEach((ref) => referenceMap.set(ref.name, ref));
	const references = mapToObject<tsReference>(
		referenceMap,
		serialiseTsReference,
	);

	return {
		name,
		version,
		references,
	};
}

export function serialiseTsReference(reference: TsReference) {
	const branches = mapToObject<branch>(reference.treeBranches, branch);
	const branchName = reference.name;

	return { ...branches[branchName] };
}

function branch(treeBranch: Branch) {
	const {
		nameSpaces,
		functions,
		variables,
		classes,
		enums,
		default: def,
	} = treeBranch;

	return {
		default: def?.name,
		namespaces: mapToObject<nameSpaces>(nameSpaces, nameSpacesGroup),
		classes: mapToObject<classes>(classes, classesGroup),
		functions: mapToObject<functions>(functions, functionsGroup),
		enums: mapToObject<enums>(enums, enumsGroup),
		variables: mapToObject<variables>(variables, variablesGroup),
	};
}

function nameSpacesGroup(nameSpace: Branch) {
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
	| Map<string, NpmPackage>
	| Map<string, TsReference>
	| Map<string, Branch>
	| Map<string, TsDeclaration>;

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
