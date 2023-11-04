import {
	DoxBranch,
	DoxProject,
	DoxPackage,
	DoxDeclaration,
	DoxReference,
	CategoryKind,
} from '@typedox/core';

import { SerialiseVariable } from './SerialiseVariable.mjs';
import { SerialiseClass } from './SerialiseClass.mjs';
import { SerialiseFunction } from './SerialiseFunction.mjs';
import { SerialiseEnum } from './SerialiseEnum.mjs';
import { log } from '@typedox/logger';

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
	| serialiseFunction
	| serialiseNamespace
	| serialiseVariable;

type serialiseBranch = typeof serialiseBranch;
type serialiseClass = typeof serialiseClass;
type serialisePackage = typeof serialisePackage;
type serialiseReference = typeof serialiseReference;
type serialiseEnum = typeof serialiseEnum;
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
	const { nameSpaces, functions, variables, classes, enums } = treeBranch;

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
	};
}

export function serialiseNamespace(nameSpace: DoxBranch) {
	log.info(nameSpace.doxReference.name);
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
