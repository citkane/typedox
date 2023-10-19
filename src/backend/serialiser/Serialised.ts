import ts from 'typescript';
import { DeclarationSerialised, DoxDeclaration } from '../typedox';
import { serialiseCommentsAndTags } from './commentsAndTags/commentsAndTags';
import { makeDeclarationLocation } from './location/location';
import { serialiseType } from './types/types';

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
