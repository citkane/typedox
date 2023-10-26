import ts from 'typescript';
import {
	DoxBranch,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
} from '../typedox.mjs';
import { SerialiseVariable } from './groups/SerialiseVariable.mjs';

export function serialiseProject(project: DoxProject) {
	const packageMap = new Map<string, DoxPackage>();
	project.doxPackages.forEach((pack) => packageMap.set(pack.name, pack));
	const packages = mapToSerialisedObjects<doxPackage>(
		packageMap,
		serialiseDoxPackage,
	);

	return {
		packages,
	};
}
export function serialiseDoxPackage(doxPackage: DoxPackage) {
	const { version, name, doxReferences: doxReferences } = doxPackage;
	const referenceMap = new Map<string, DoxReference>();
	doxReferences.forEach((ref) => referenceMap.set(ref.name, ref));
	const references = mapToSerialisedObjects<doxReference>(
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
	const branches = mapToSerialisedObjects<branch>(
		reference.treeBranches,
		serialiseBranch,
	);
	const branchName = reference.name;

	return { ...branches[branchName] };
}

function serialiseBranch(treeBranch: DoxBranch) {
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
		namespaces: mapToSerialisedObjects<nameSpaces>(
			nameSpaces,
			serialiseNamespace,
		),
		classes: mapToSerialisedObjects<classes>(classes, serialiseClass),
		functions: mapToSerialisedObjects<functions>(
			functions,
			serialiseFunction,
		),
		enums: mapToSerialisedObjects<enums>(enums, serialiseEnum),
		variables: mapToSerialisedObjects<variables>(
			variables,
			serialiseVariable,
		),
	};
}

function serialiseNamespace(nameSpace: DoxBranch) {
	return { ...serialiseBranch(nameSpace) };
}

function serialiseVariable(declaration: DoxDeclaration) {
	return new SerialiseVariable(declaration).serialised;
}

function serialiseClass() {
	return {};
}

function serialiseFunction() {
	return {};
}

function serialiseEnum() {
	return {};
}

function mapToSerialisedObjects<Fnc extends (...args: any) => any>(
	sourceMap: sourceMap,
	serialiserFunction: serialiserFunction,
) {
	type serialised = ReturnType<Fnc>;

	const newObject = Object.fromEntries(sourceMap);
	Object.keys(newObject).forEach((key) => {
		const newKeyValue = serialiserFunction(newObject[key]);
		newObject[key] = newKeyValue;
	});
	return newObject as {
		[key: string]: serialised;
	};
}

type sourceMap =
	| Map<string, DoxPackage>
	| Map<string, DoxReference>
	| Map<string, DoxBranch>
	| Map<string, DoxDeclaration>;

type serialiserFunction = doxPackage | doxReference | branch | variables;
type doxPackage = typeof serialiseDoxPackage;
type doxReference = typeof serialiseDoxReference;
type branch = typeof serialiseBranch;
type nameSpaces = typeof serialiseNamespace;
type classes = typeof serialiseClass;
type variables = typeof serialiseVariable;
type functions = typeof serialiseFunction;
type enums = typeof serialiseEnum;
