import ts from 'typescript';
import { DeclarationSerialised, DoxDeclaration } from '../typedox.mjs';
import { serialiseCommentsAndTags } from './commentsAndTags/commentsAndTags.mjs';
import { makeDeclarationLocation } from './location/location.mjs';
import { serialiseType } from './types/types.mjs';

export class Serialised {
	public serialised: DeclarationSerialised;
	protected valueNode: ts.Node;
	constructor(declaration: DoxDeclaration) {
		const { flags, valueNode, id, wrappedItem, group } = declaration;
		const { name } = wrappedItem;

		const location = makeDeclarationLocation(declaration);
		const type = serialiseType(declaration);
		const jsDoc = serialiseCommentsAndTags(valueNode);

		this.valueNode = valueNode;
		this.serialised = { id, name, group, flags, location, type, jsDoc };
	}
}
