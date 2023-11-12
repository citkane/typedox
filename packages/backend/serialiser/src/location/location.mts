import { CategoryKind, DoxDeclaration } from '@typedox/core';
import { DoxLocation } from '../index.mjs';

export function makeDeclarationLocation(
	declaration: DoxDeclaration,
): DoxLocation {
	const { doxPackage, doxReference, category, name, flags } = declaration;
	const query = `${doxPackage.name}.${doxReference.name}.${
		CategoryKind[category]
	}.${flags.isDefault ? 'default' : name}`;
	const hash = '';
	return { query, hash };
}
