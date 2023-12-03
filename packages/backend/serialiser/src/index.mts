import { DeclarationFlags, CategoryKind, DoxLocation } from '@typedox/core';

export * from './serialiserEventsApi.mjs';
export * from './Serialiser.mjs';
export * from './projectStructure/_index.mjs';
export * from './commentsAndTags/_index.mjs';
export * from './types/_index.mjs';
export * from './menus/_index.mjs';

export { Serialised } from './Serialised.mjs';

type comment = { comment: string };
type tag = { tag: any };

export type declarationBundle = Record<string, DeclarationSerialised>;
export type menuMeta = {
	category: CategoryKind;
	location?: DoxLocation;
	isExternal?: true;
	isLocal?: true;
};
export type menuBranch = {
	name: string;
	meta: menuMeta;
	children?: menuBranch[];
	index?: string;
};

export type jsDocCollection = (comment | tag)[];
/*
export type serialisedProject = ReturnType<typeof serialiseProject>;
export type serialisedPackage = ReturnType<typeof serialisePackage>;
export type serialisedReference = ReturnType<typeof serialiseReference>;
export type serialisedBranch = ReturnType<typeof serialiseBranch>;
export type serialisedNamespace = ReturnType<typeof serialiseNamespace>;
*/
export interface DeclarationType {
	kind: string;
	name: string;
}
export interface DeclarationSerialised {
	name: string;
	category: CategoryKind;
	flags: DeclarationFlags;
	location: DoxLocation;
	type: DeclarationType;
	file: fileInfo;
	valueString?: string;
	jsDocs?: jsDocCollection[];
	parents?: string[];
	children?: string[];
}

export type fileInfo = {
	positions: filePositions;
	fileName: string;
	dirPath: string;
};
export type filePosition = [
	start: number,
	end: number,
	lineStart: number,
	lineEnd: number,
];
export type filePositions = filePosition[];
