import { CategoryKind, DoxDeclaration } from '@typedox/core';
import { DeclarationLocation } from '../index.mjs';

export function makeDeclarationLocation(
	declaration: DoxDeclaration,
): DeclarationLocation {
	const { doxPackage, doxReference, category, name, flags } = declaration;
	const query = `${doxPackage.name}.${doxReference.name}.${
		CategoryKind[category]
	}.${flags.isDefault ? 'default' : name}`;
	const hash = '';
	return { query, hash };
}
