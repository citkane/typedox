import { DeclarationFlags, DeclarationGroup } from '@typedox/core';
import {
	serialiseBranch,
	serialiseDoxPackage,
	serialiseDoxProject,
	serialiseDoxReference,
} from './projectStructure/projectStructure.mjs';

export * from './serialiserEventsApi.mjs';
export * from './Serialiser.mjs';
export * from './projectStructure/projectStructure.mjs';
export * from './commentsAndTags/index.mjs';
export * from './groups/index.mjs';
export * from './location/index.mjs';
export * from './types/index.mjs';

export { Serialised } from './Serialised.mjs';

type comment = { comment: string };
type tag = { tag: any };
export type jsDocCollection = (comment | tag)[];

export type serialisedProject = ReturnType<typeof serialiseDoxProject>;
export type serialisedPackage = ReturnType<typeof serialiseDoxPackage>;
export type serialisedReference = ReturnType<typeof serialiseDoxReference>;
export type serialisedBranch = ReturnType<typeof serialiseBranch>;

export interface DeclarationLocation {
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
	group: DeclarationGroup;
	flags: DeclarationFlags;
	location: DeclarationLocation;
	type: DeclarationType;
	jsDoc: jsDocCollection | undefined;
	valueString?: string;
}
