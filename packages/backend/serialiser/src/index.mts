import { DeclarationFlags, CategoryKind } from '@typedox/core';
import {
	serialiseBranch,
	serialiseNamespace,
	serialisePackage,
	serialiseProject,
	serialiseReference,
} from './projectStructure/projectStructure.mjs';

export * from './serialiserEventsApi.mjs';
export * from './Serialiser.mjs';
export * from './projectStructure/_index.mjs';
export * from './commentsAndTags/_index.mjs';
export * from './location/_index.mjs';
export * from './types/_index.mjs';
export * from './menus/_index.mjs';

export { Serialised } from './Serialised.mjs';

type comment = { comment: string };
type tag = { tag: any };

export type menuMeta = {
	category: CategoryKind;
	location?: DoxLocation;
};
export type menuBranch = {
	name: string;
	meta: menuMeta;
	children?: menuBranch[];
	index?: string;
};

export type jsDocCollection = (comment | tag)[];
export type serialisedProject = ReturnType<typeof serialiseProject>;
export type serialisedPackage = ReturnType<typeof serialisePackage>;
export type serialisedReference = ReturnType<typeof serialiseReference>;
export type serialisedBranch = ReturnType<typeof serialiseBranch>;
export type serialisedNamespace = ReturnType<typeof serialiseNamespace>;

export interface DoxLocation {
	query: string;
	hash: string;
}
export interface DeclarationType {
	kind: string;
	name: string;
	id?: number;
	valueString?: string;
}
export interface DeclarationSerialised {
	id: number;
	name: string;
	category: CategoryKind;
	flags: DeclarationFlags;
	location: DoxLocation;
	type: DeclarationType;
	jsDoc: jsDocCollection | undefined;
	valueString?: string;
	parents: number[];
}

export enum fooEnum {
	foo,
	bar,
}
