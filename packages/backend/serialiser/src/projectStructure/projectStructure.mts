import {
	DoxBranch,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	CategoryKind,
	DoxEvents,
} from '@typedox/core';

import { log } from '@typedox/logger';
import {
	SerialiseClass,
	SerialiseEnum,
	SerialiseFunction,
	SerialiseType,
	SerialiseVariable,
} from './_index.mjs';
import { serialiserEventsApi } from '../serialiserEventsApi.mjs';
import { Serialised } from '../index.mjs';

const events = new DoxEvents<serialiserEventsApi>();
type sourceMap =
	| Map<string, DoxPackage>
	| Map<string, DoxReference>
	| Map<string, DoxBranch>
	| Map<string, DoxDeclaration>;

type serialiserFunction =
	| serialiseBranch
	| serialiseClass
	| serialisePackage
	| serialiseReference
	| serialiseEnum
	| serialiseType
	| serialiseFunction
	| serialiseNamespace
	| serialiseVariable;

type serialiseBranch = typeof serialiseBranch;
type serialiseClass = typeof serialiseClass;
type serialisePackage = typeof serialisePackage;
type serialiseReference = typeof serialiseReference;
type serialiseEnum = typeof serialiseEnum;
type serialiseType = typeof serialiseType;
type serialiseFunction = typeof serialiseFunction;
type serialiseNamespace = typeof serialiseNamespace;
type serialiseVariable = typeof serialiseVariable;

export function serialiseProject(project: DoxProject) {
	const packages = mapToSerialisedObjects<serialisePackage>(
		project.doxPackages,
		serialisePackage,
	);

	return {
		packages,
	};
}
export function serialisePackage(doxPackage: DoxPackage) {
	const { version, name, doxReferences, workspaces, category } = doxPackage;
	const referenceMap = new Map<string, DoxReference>();
	doxReferences.forEach((ref) => referenceMap.set(ref.name, ref));
	const references = mapToSerialisedObjects<serialiseReference>(
		referenceMap,
		serialiseReference,
	);

	return {
		name,
		version,
		references,
		workspaces,
		category,
	};
}
export function serialiseReference(reference: DoxReference) {
	return {
		...serialiseBranch(reference.doxBranch),
		...{ category: CategoryKind.Reference },
	};
}

export function serialiseBranch(treeBranch: DoxBranch) {
	const { nameSpaces, functions, variables, classes, enums, types } =
		treeBranch;

	return {
		namespaces: mapToSerialisedObjects<serialiseNamespace>(
			nameSpaces,
			serialiseNamespace,
		),
		classes: mapToSerialisedObjects<serialiseClass>(
			classes,
			serialiseClass,
		),
		functions: mapToSerialisedObjects<serialiseFunction>(
			functions,
			serialiseFunction,
		),
		enums: mapToSerialisedObjects<serialiseEnum>(enums, serialiseEnum),
		variables: mapToSerialisedObjects<serialiseVariable>(
			variables,
			serialiseVariable,
		),
		types: mapToSerialisedObjects<serialiseType>(types, serialiseType),
	};
}

export function serialiseNamespace(nameSpace: DoxBranch) {
	return {
		...serialiseBranch(nameSpace),
		...{ category: CategoryKind.Namespace },
	};
}

function serialiseVariable(declaration: DoxDeclaration) {
	return new SerialiseVariable(declaration).serialised;
}

function serialiseClass(declaration: DoxDeclaration) {
	return new SerialiseClass(declaration).serialised;
}

function serialiseFunction(declaration: DoxDeclaration) {
	return new SerialiseFunction(declaration).serialised;
}

function serialiseEnum(declaration: DoxDeclaration) {
	return new SerialiseEnum(declaration).serialised;
}
function serialiseType(declaration: DoxDeclaration) {
	return new SerialiseType(declaration).serialised;
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
		if (isDeclararation(newKeyValue))
			events.emit('serialiser.declaration.serialised', newKeyValue);
	});
	return newObject as {
		[key: string]: serialised;
	};
}

function isDeclararation(value: object): value is Serialised['serialised'] {
	return (
		'category' in value &&
		'location' in value &&
		!noEmitCategories.includes(value.category as CategoryKind)
	);
}
const noEmitCategories = [
	CategoryKind.Namespace,
	CategoryKind.Package,
	CategoryKind.Project,
	CategoryKind.Reference,
	CategoryKind.unknown,
	CategoryKind.menuHeader,
];
