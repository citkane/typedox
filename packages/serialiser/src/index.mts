import { DeclarationFlags, DeclarationGroup } from '@typedox/core';

export * from './serialiser.mjs';
export * from './commentsAndTags/index.mjs';
export * from './groups/index.mjs';
export * from './location/index.mjs';
export * from './types/index.mjs';

export { Serialised } from './Serialised.mjs';

type comment = { comment: string };
type tag = { tag: any };
export type jsDocCollection = (comment | tag)[];
/**
 * An enumerator for dox groups used to categorise `doxDeclarations`.
 */

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
