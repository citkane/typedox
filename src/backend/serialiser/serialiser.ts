import {
	Branch,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	logger as log,
} from '../typedox';

export function serialiseProject(project: DoxProject) {
	const packageMap = new Map<string, DoxPackage>();
	project.doxPackages.forEach((pack) => packageMap.set(pack.name, pack));
	const packages = mapToObject<doxPackage>(packageMap, serialiseDoxPackage);

	return {
		packages,
	};
}
export function serialiseDoxPackage(doxPackage: DoxPackage) {
	const { version, name, doxReferences: doxReferences } = doxPackage;
	const referenceMap = new Map<string, DoxReference>();
	doxReferences.forEach((ref) => referenceMap.set(ref.name, ref));
	const references = mapToObject<doxReference>(
		referenceMap,
		serialiseDoxReference,
	);

	return {
		name,
		version,
		references,
	};
}

export function serialiseDoxReference(reference: DoxReference) {
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
	| Map<string, DoxPackage>
	| Map<string, DoxReference>
	| Map<string, Branch>
	| Map<string, DoxDeclaration>;

type targetFunctionTypes = doxPackage | doxReference | branch;
type targetFunction = (...args: any) => any;
type doxPackage = typeof serialiseDoxPackage;
type doxReference = typeof serialiseDoxReference;
type branch = typeof branch;
type nameSpaces = typeof nameSpacesGroup;
type classes = typeof classesGroup;
type variables = typeof variablesGroup;
type functions = typeof functionsGroup;
type enums = typeof enumsGroup;
